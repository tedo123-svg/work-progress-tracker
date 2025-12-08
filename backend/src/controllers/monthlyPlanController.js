import pool from '../database/db.js';

// Get current Ethiopian month (from 1-12)
const getCurrentEthiopianMonth = () => {
  // This should match the CURRENT_ETHIOPIAN_MONTH in frontend
  return 5; // Currently: ኅዳር (Hidar) - Update this monthly
};

// Get current Ethiopian year
const getCurrentEthiopianYear = () => {
  return 2025; // Update as needed
};

// Calculate deadline (18th of the month)
const getDeadlineForMonth = (month, year) => {
  return new Date(year, month - 1, 18);
};

/**
 * Auto-create monthly plan for current month if it doesn't exist
 * This runs automatically when the system starts or when checking for plans
 */
export const autoCreateMonthlyPlan = async (client = null) => {
  const shouldReleaseClient = !client;
  if (!client) {
    client = await pool.connect();
  }
  
  try {
    const currentMonth = getCurrentEthiopianMonth();
    const currentYear = getCurrentEthiopianYear();
    
    // Check if a plan already exists for current month
    const existingPlan = await client.query(
      `SELECT id FROM monthly_plans WHERE month = $1 AND year = $2`,
      [currentMonth, currentYear]
    );
    
    if (existingPlan.rows.length > 0) {
      console.log(`Monthly plan already exists for month ${currentMonth}`);
      return existingPlan.rows[0];
    }
    
    // Get the previous month's plan to copy target values
    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;
    
    if (previousMonth < 1) {
      previousMonth = 12;
      previousYear = currentYear - 1;
    }
    
    const previousPlan = await client.query(
      `SELECT target_amount FROM monthly_plans 
       WHERE month = $1 AND year = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [previousMonth, previousYear]
    );
    
    // Use previous month's target or default to 0
    const targetAmount = previousPlan.rows.length > 0 
      ? previousPlan.rows[0].target_amount 
      : 0;
    
    const deadline = getDeadlineForMonth(currentMonth, currentYear);
    
    // Create new monthly plan
    const newPlan = await client.query(
      `INSERT INTO monthly_plans (
        title, description, month, year, target_amount, deadline, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        `Monthly Plan - Month ${currentMonth}`,
        `Auto-generated monthly plan for Ethiopian month ${currentMonth}`,
        currentMonth,
        currentYear,
        targetAmount,
        deadline,
        'active'
      ]
    );
    
    const plan = newPlan.rows[0];
    
    // Create reports for all branch users
    const branchUsers = await client.query(
      `SELECT id FROM users WHERE role = 'branch_user'`
    );
    
    for (const user of branchUsers.rows) {
      await client.query(
        `INSERT INTO monthly_reports (monthly_plan_id, branch_user_id, status)
         VALUES ($1, $2, $3)`,
        [plan.id, user.id, 'pending']
      );
    }
    
    console.log(`✅ Auto-created monthly plan for month ${currentMonth}, year ${currentYear}`);
    return plan;
    
  } catch (error) {
    console.error('Auto-create monthly plan error:', error);
    throw error;
  } finally {
    if (shouldReleaseClient) {
      client.release();
    }
  }
};

/**
 * Check if current month has ended (past 18th deadline)
 * If yes, archive current plan and create next month's plan
 */
export const checkAndRenewMonthlyPlan = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const currentMonth = getCurrentEthiopianMonth();
    const currentYear = getCurrentEthiopianYear();
    const today = new Date();
    
    // Get current active plan
    const activePlan = await client.query(
      `SELECT * FROM monthly_plans 
       WHERE month = $1 AND year = $2 AND status = 'active'`,
      [currentMonth, currentYear]
    );
    
    if (activePlan.rows.length === 0) {
      // No active plan, create one
      await autoCreateMonthlyPlan(client);
      await client.query('COMMIT');
      return;
    }
    
    const plan = activePlan.rows[0];
    const deadline = new Date(plan.deadline);
    
    // Check if deadline has passed
    if (today > deadline) {
      console.log(`Deadline passed for month ${currentMonth}. Archiving and creating next month...`);
      
      // Archive current plan
      await client.query(
        `UPDATE monthly_plans SET status = 'archived' WHERE id = $1`,
        [plan.id]
      );
      
      // Calculate next month
      let nextMonth = currentMonth + 1;
      let nextYear = currentYear;
      
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = currentYear + 1;
      }
      
      // Create next month's plan with same target
      const nextDeadline = getDeadlineForMonth(nextMonth, nextYear);
      
      const newPlan = await client.query(
        `INSERT INTO monthly_plans (
          title, description, month, year, target_amount, deadline, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          `Monthly Plan - Month ${nextMonth}`,
          `Auto-generated monthly plan for Ethiopian month ${nextMonth}`,
          nextMonth,
          nextYear,
          plan.target_amount, // Copy target from previous month
          nextDeadline,
          'active'
        ]
      );
      
      const nextPlan = newPlan.rows[0];
      
      // Create reports for all branch users
      const branchUsers = await client.query(
        `SELECT id FROM users WHERE role = 'branch_user'`
      );
      
      for (const user of branchUsers.rows) {
        await client.query(
          `INSERT INTO monthly_reports (monthly_plan_id, branch_user_id, status)
           VALUES ($1, $2, $3)`,
          [nextPlan.id, user.id, 'pending']
        );
      }
      
      console.log(`✅ Created new plan for month ${nextMonth}, year ${nextYear}`);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Check and renew monthly plan error:', error);
  } finally {
    client.release();
  }
};

/**
 * Get current active monthly plan
 */
export const getCurrentMonthlyPlan = async (req, res) => {
  try {
    // Ensure current month plan exists
    await autoCreateMonthlyPlan();
    
    const currentMonth = getCurrentEthiopianMonth();
    const currentYear = getCurrentEthiopianYear();
    
    const result = await pool.query(
      `SELECT * FROM monthly_plans 
       WHERE month = $1 AND year = $2 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [currentMonth, currentYear]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active monthly plan found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get current monthly plan error:', error);
    res.status(500).json({ error: 'Failed to get current monthly plan' });
  }
};

/**
 * Update monthly plan target (main branch only)
 */
export const updateMonthlyPlanTarget = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { targetAmount } = req.body;
    const currentMonth = getCurrentEthiopianMonth();
    const currentYear = getCurrentEthiopianYear();
    
    // Update current month's plan
    const result = await client.query(
      `UPDATE monthly_plans 
       SET target_amount = $1, updated_at = CURRENT_TIMESTAMP
       WHERE month = $2 AND year = $3 AND status = 'active'
       RETURNING *`,
      [targetAmount, currentMonth, currentYear]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No active monthly plan found' });
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Monthly plan updated successfully', plan: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update monthly plan error:', error);
    res.status(500).json({ error: 'Failed to update monthly plan' });
  } finally {
    client.release();
  }
};

/**
 * Get all monthly plans (for history/reports)
 */
export const getAllMonthlyPlans = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM monthly_plans 
       ORDER BY year DESC, month DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all monthly plans error:', error);
    res.status(500).json({ error: 'Failed to get monthly plans' });
  }
};

/**
 * Get monthly plan statistics
 */
export const getMonthlyPlanStats = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const stats = await pool.query(
      `SELECT 
        mp.*,
        COUNT(mr.id) as total_reports,
        COUNT(CASE WHEN mr.status = 'submitted' THEN 1 END) as submitted_reports,
        COUNT(CASE WHEN mr.status = 'pending' THEN 1 END) as pending_reports,
        COUNT(CASE WHEN mr.status = 'late' THEN 1 END) as late_reports,
        SUM(mr.achieved_amount) as total_achieved,
        AVG(mr.progress_percentage) as avg_progress
       FROM monthly_plans mp
       LEFT JOIN monthly_reports mr ON mr.monthly_plan_id = mp.id
       WHERE mp.id = $1
       GROUP BY mp.id`,
      [planId]
    );
    
    if (stats.rows.length === 0) {
      return res.status(404).json({ error: 'Monthly plan not found' });
    }
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get monthly plan stats error:', error);
    res.status(500).json({ error: 'Failed to get monthly plan statistics' });
  }
};
