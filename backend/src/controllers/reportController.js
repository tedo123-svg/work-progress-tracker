import pool from '../database/db.js';

export const submitMonthlyReport = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { reportId, achievedAmount, notes } = req.body;
    
    // Get report and plan info (NEW SYSTEM: monthly_plans)
    const reportResult = await client.query(
      `SELECT mr.*, mp.target_amount, mp.deadline, mp.month, mp.year
       FROM monthly_reports mr
       JOIN monthly_plans mp ON mr.monthly_plan_id = mp.id
       WHERE mr.id = $1 AND mr.branch_user_id = $2`,
      [reportId, req.user.id]
    );
    
    if (reportResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = reportResult.rows[0];
    
    // Calculate progress percentage
    const progressPercentage = report.target_amount > 0 
      ? (achievedAmount / report.target_amount) * 100 
      : 0;
    
    // Check if submission is late (after deadline)
    const isLate = new Date() > new Date(report.deadline);
    
    // Update monthly report
    await client.query(
      `UPDATE monthly_reports 
       SET achieved_amount = $1, progress_percentage = $2, 
           notes = $3, status = $4, submitted_at = NOW(), updated_at = NOW()
       WHERE id = $5`,
      [achievedAmount, progressPercentage, notes, isLate ? 'late' : 'submitted', reportId]
    );
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Report submitted successfully',
      progress: progressPercentage,
      status: isLate ? 'late' : 'submitted'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit report error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  } finally {
    client.release();
  }
};

// Note: Quarterly and annual aggregations removed - using monthly auto-renewal system

export const getMyReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mr.*, mp.month, mp.year, mp.target_amount, mp.deadline,
              mp.title as plan_title
       FROM monthly_reports mr
       JOIN monthly_plans mp ON mr.monthly_plan_id = mp.id
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
    // Restrict strictly to current Ethiopian month/year to avoid older active plans
    const now = new Date();
    const gregorianMonth = now.getMonth() + 1;
    const gregorianYear = now.getFullYear();
    const currentMonth = (
      {7:1,8:2,9:3,10:4,11:5,12:6,1:7,2:8,3:9,4:10,5:11,6:12}[gregorianMonth] || 1
    );
    const currentYear = gregorianMonth >= 9 ? gregorianYear - 7 : gregorianYear - 8;

    const result = await pool.query(
      `SELECT mr.*, mp.month, mp.year, mp.target_amount, mp.deadline,
              u.username, u.branch_name, mp.title as plan_title,
              mr.status, mr.achieved_amount, mr.progress_percentage, mr.submitted_at
       FROM monthly_reports mr
       JOIN monthly_plans mp ON mr.monthly_plan_id = mp.id
       JOIN users u ON mr.branch_user_id = u.id
       WHERE mp.status = 'active' AND mp.month = $1 AND mp.year = $2
       ORDER BY u.branch_name, mr.status`,
      [currentMonth, currentYear]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all current month reports error:', error);
    res.status(500).json({ error: 'Failed to get current month reports' });
  }
};
