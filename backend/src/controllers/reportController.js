import pool from '../database/db.js';

export const submitMonthlyReport = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { reportId, achievedAmount, achievedUnits, notes } = req.body;
    
    // Get report and period info
    const reportResult = await client.query(
      `SELECT mr.*, mp.target_amount, mp.target_units, mp.deadline, mp.annual_plan_id, mp.month
       FROM monthly_reports mr
       JOIN monthly_periods mp ON mr.monthly_period_id = mp.id
       WHERE mr.id = $1 AND mr.branch_user_id = $2`,
      [reportId, req.user.id]
    );
    
    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = reportResult.rows[0];
    const progressPercentage = (achievedAmount / report.target_amount) * 100;
    const isLate = new Date() > new Date(report.deadline);
    
    // Update monthly report
    await client.query(
      `UPDATE monthly_reports 
       SET achieved_amount = $1, achieved_units = $2, progress_percentage = $3, 
           notes = $4, status = $5, submitted_at = NOW(), updated_at = NOW()
       WHERE id = $6`,
      [achievedAmount, achievedUnits, progressPercentage, notes, isLate ? 'late' : 'submitted', reportId]
    );
    
    // Recalculate quarterly aggregation
    const quarter = Math.ceil(report.month / 3);
    await recalculateQuarterly(client, report.annual_plan_id, quarter);
    
    // Recalculate annual aggregation
    await recalculateAnnual(client, report.annual_plan_id);
    
    await client.query('COMMIT');
    
    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit report error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  } finally {
    client.release();
  }
};

async function recalculateQuarterly(client, annualPlanId, quarter) {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  
  const result = await client.query(
    `SELECT 
       COALESCE(SUM(mr.achieved_amount), 0) as total_amount,
       COALESCE(SUM(mr.achieved_units), 0) as total_units,
       COALESCE(AVG(mr.progress_percentage), 0) as avg_progress
     FROM monthly_reports mr
     JOIN monthly_periods mp ON mr.monthly_period_id = mp.id
     WHERE mp.annual_plan_id = $1 AND mp.month BETWEEN $2 AND $3
       AND mr.status IN ('submitted', 'late')`,
    [annualPlanId, startMonth, endMonth]
  );
  
  const data = result.rows[0];
  
  await client.query(
    `UPDATE quarterly_aggregations 
     SET total_achieved_amount = $1, total_achieved_units = $2, 
         progress_percentage = $3, updated_at = NOW()
     WHERE annual_plan_id = $4 AND quarter = $5`,
    [data.total_amount, data.total_units, data.avg_progress, annualPlanId, quarter]
  );
}

async function recalculateAnnual(client, annualPlanId) {
  const result = await client.query(
    `SELECT 
       COALESCE(SUM(mr.achieved_amount), 0) as total_amount,
       COALESCE(SUM(mr.achieved_units), 0) as total_units,
       COALESCE(AVG(mr.progress_percentage), 0) as avg_progress
     FROM monthly_reports mr
     JOIN monthly_periods mp ON mr.monthly_period_id = mp.id
     WHERE mp.annual_plan_id = $1 AND mr.status IN ('submitted', 'late')`,
    [annualPlanId]
  );
  
  const data = result.rows[0];
  
  await client.query(
    `UPDATE annual_aggregations 
     SET total_achieved_amount = $1, total_achieved_units = $2, 
         progress_percentage = $3, updated_at = NOW()
     WHERE annual_plan_id = $4`,
    [data.total_amount, data.total_units, data.avg_progress, annualPlanId]
  );
}

export const getMyReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mr.*, mp.month, mp.year, mp.target_amount, mp.target_units, mp.deadline,
              ap.title as plan_title
       FROM monthly_reports mr
       JOIN monthly_periods mp ON mr.monthly_period_id = mp.id
       JOIN annual_plans ap ON mp.annual_plan_id = ap.id
       WHERE mr.branch_user_id = $1
       ORDER BY mp.year DESC, mp.month DESC`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const result = await pool.query(
      `SELECT mr.*, mp.month, mp.year, mp.target_amount, mp.target_units, mp.deadline,
              u.username, u.branch_name
       FROM monthly_reports mr
       JOIN monthly_periods mp ON mr.monthly_period_id = mp.id
       JOIN users u ON mr.branch_user_id = u.id
       WHERE mp.annual_plan_id = $1
       ORDER BY mp.month, u.branch_name`,
      [planId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
};

export const getBranchComparison = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const result = await pool.query(
      `SELECT 
         u.id, u.username, u.branch_name,
         COUNT(mr.id) as total_reports,
         COUNT(CASE WHEN mr.status = 'submitted' THEN 1 END) as submitted_on_time,
         COUNT(CASE WHEN mr.status = 'late' THEN 1 END) as submitted_late,
         COUNT(CASE WHEN mr.status = 'pending' THEN 1 END) as pending,
         COALESCE(SUM(mr.achieved_amount), 0) as total_achieved,
         COALESCE(AVG(mr.progress_percentage), 0) as avg_progress
       FROM users u
       LEFT JOIN monthly_reports mr ON u.id = mr.branch_user_id
       LEFT JOIN monthly_periods mp ON mr.monthly_period_id = mp.id
       WHERE u.role = 'branch_user' AND (mp.annual_plan_id = $1 OR mp.annual_plan_id IS NULL)
       GROUP BY u.id, u.username, u.branch_name
       ORDER BY avg_progress DESC`,
      [planId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get branch comparison error:', error);
    res.status(500).json({ error: 'Failed to get branch comparison' });
  }
};


// Get all branch reports for current monthly plan (for main branch dashboard)
export const getAllCurrentMonthReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mr.*, mp.month, mp.year, mp.target_amount, mp.target_units, mp.deadline,
              u.username, u.branch_name, ap.title as plan_title
       FROM monthly_reports mr
       JOIN monthly_periods mp ON mr.monthly_period_id = mp.id
       JOIN annual_plans ap ON mp.annual_plan_id = ap.id
       JOIN users u ON mr.branch_user_id = u.id
       WHERE mp.month = (
         SELECT month FROM monthly_periods 
         WHERE annual_plan_id = ap.id 
         ORDER BY year DESC, month DESC 
         LIMIT 1
       )
       ORDER BY u.branch_name, mr.status`,
      []
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all current month reports error:', error);
    res.status(500).json({ error: 'Failed to get current month reports' });
  }
};
