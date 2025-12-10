import pool from '../database/db.js';

// Create actions for an annual plan
export const createActions = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { annualPlanId, actions } = req.body;
    
    // Verify plan exists and user is main branch
    const planResult = await client.query(
      'SELECT * FROM annual_plans WHERE id = $1',
      [annualPlanId]
    );
    
    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Annual plan not found' });
    }
    
    const createdActions = [];
    
    // Create each action
    for (const action of actions) {
      const result = await client.query(
        `INSERT INTO actions (annual_plan_id, action_number, action_title, plan_number, plan_activity)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [annualPlanId, action.actionNumber, action.actionTitle, action.planNumber, action.planActivity]
      );
      
      createdActions.push(result.rows[0]);
      
      // Create action reports for all branch users for all monthly periods
      const monthlyPeriods = await client.query(
        'SELECT id FROM monthly_periods WHERE annual_plan_id = $1',
        [annualPlanId]
      );
      
      const branchUsers = await client.query(
        `SELECT id FROM users WHERE role = 'branch_user'`
      );
      
      for (const period of monthlyPeriods.rows) {
        for (const user of branchUsers.rows) {
          await client.query(
            `INSERT INTO action_reports (action_id, monthly_period_id, branch_user_id)
             VALUES ($1, $2, $3)`,
            [result.rows[0].id, period.id, user.id]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Actions created successfully', 
      actions: createdActions 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create actions error:', error);
    res.status(500).json({ error: 'Failed to create actions' });
  } finally {
    client.release();
  }
};

// Get actions for an annual plan
export const getActionsByPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM actions WHERE annual_plan_id = $1 ORDER BY action_number`,
      [planId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get actions error:', error);
    res.status(500).json({ error: 'Failed to get actions' });
  }
};

// Get action reports for a branch user
export const getMyActionReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ar.*, a.action_number, a.action_title, a.plan_number, a.plan_activity,
              mp.month, mp.year, mp.deadline, ap.title as plan_title
       FROM action_reports ar
       JOIN actions a ON ar.action_id = a.id
       JOIN monthly_periods mp ON ar.monthly_period_id = mp.id
       JOIN annual_plans ap ON a.annual_plan_id = ap.id
       WHERE ar.branch_user_id = $1
       ORDER BY mp.year DESC, mp.month DESC, a.action_number`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get my action reports error:', error);
    res.status(500).json({ error: 'Failed to get action reports' });
  }
};

// Submit action report
export const submitActionReport = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { reportId, actualActivity, notes } = req.body;
    
    // Get report and action info
    const reportResult = await client.query(
      `SELECT ar.*, a.plan_activity, mp.deadline
       FROM action_reports ar
       JOIN actions a ON ar.action_id = a.id
       JOIN monthly_periods mp ON ar.monthly_period_id = mp.id
       WHERE ar.id = $1 AND ar.branch_user_id = $2`,
      [reportId, req.user.id]
    );
    
    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Action report not found' });
    }
    
    const report = reportResult.rows[0];
    
    // Calculate implementation percentage
    const implementationPercentage = (actualActivity / report.plan_activity) * 100;
    const isLate = new Date() > new Date(report.deadline);
    
    // Update action report
    await client.query(
      `UPDATE action_reports 
       SET actual_activity = $1, implementation_percentage = $2, 
           notes = $3, status = $4, submitted_at = NOW(), updated_at = NOW()
       WHERE id = $5`,
      [actualActivity, implementationPercentage, notes, isLate ? 'late' : 'submitted', reportId]
    );
    
    await client.query('COMMIT');
    
    res.json({ message: 'Action report submitted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit action report error:', error);
    res.status(500).json({ error: 'Failed to submit action report' });
  } finally {
    client.release();
  }
};

// Get all action reports for a plan (main branch view)
export const getAllActionReports = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const result = await pool.query(
      `SELECT ar.*, a.action_number, a.action_title, a.plan_number, a.plan_activity,
              mp.month, mp.year, u.username, u.branch_name
       FROM action_reports ar
       JOIN actions a ON ar.action_id = a.id
       JOIN monthly_periods mp ON ar.monthly_period_id = mp.id
       JOIN users u ON ar.branch_user_id = u.id
       WHERE a.annual_plan_id = $1
       ORDER BY mp.month, a.action_number, u.branch_name`,
      [planId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all action reports error:', error);
    res.status(500).json({ error: 'Failed to get action reports' });
  }
};

// Get action summary by branch
export const getActionSummaryByBranch = async (req, res) => {
  try {
    const { planId } = req.params;

    const result = await pool.query(
      `SELECT
         u.id, u.username, u.branch_name,
         COUNT(ar.id) as total_actions,
         COUNT(CASE WHEN ar.status = 'submitted' THEN 1 END) as submitted_on_time,
         COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as submitted_late,
         COUNT(CASE WHEN ar.status = 'pending' THEN 1 END) as pending,
         COALESCE(AVG(ar.implementation_percentage), 0) as avg_implementation
       FROM users u
       LEFT JOIN action_reports ar ON u.id = ar.branch_user_id
       LEFT JOIN actions a ON ar.action_id = a.id
       WHERE u.role = 'branch_user' AND (a.annual_plan_id = $1 OR a.annual_plan_id IS NULL)
       GROUP BY u.id, u.username, u.branch_name
       ORDER BY avg_implementation DESC`,
      [planId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get action summary error:', error);
    res.status(500).json({ error: 'Failed to get action summary' });
  }
};

// Quick update achievement (similar to update target)
export const quickUpdateAchievement = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { reportId, actualActivity } = req.body;

    // Get report and action info
    const reportResult = await client.query(
      `SELECT ar.*, a.plan_activity, mp.deadline
       FROM action_reports ar
       JOIN actions a ON ar.action_id = a.id
       JOIN monthly_periods mp ON ar.monthly_period_id = mp.id
       WHERE ar.id = $1 AND ar.branch_user_id = $2`,
      [reportId, req.user.id]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Action report not found' });
    }

    const report = reportResult.rows[0];

    // Calculate implementation percentage
    const implementationPercentage = (actualActivity / report.plan_activity) * 100;
    const isLate = new Date() > new Date(report.deadline);

    // Update action report
    await client.query(
      `UPDATE action_reports
       SET actual_activity = $1, implementation_percentage = $2,
           status = $3, submitted_at = NOW(), updated_at = NOW()
       WHERE id = $4`,
      [actualActivity, implementationPercentage, isLate ? 'late' : 'submitted', reportId]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Achievement updated successfully',
      actualActivity,
      implementationPercentage
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Quick update achievement error:', error);
    res.status(500).json({ error: 'Failed to update achievement' });
  } finally {
    client.release();
  }
};
