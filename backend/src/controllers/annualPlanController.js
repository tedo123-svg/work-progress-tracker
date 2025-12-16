import pool from '../database/db.js';

export const createAnnualPlan = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { title, description, year, targetAmount } = req.body;
    
    // Create annual plan (targetUnits set to 0 for backward compatibility)
    const planResult = await client.query(
      `INSERT INTO annual_plans (title, description, year, target_amount, target_units, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, year, targetAmount, 0, req.user.id]
    );
    
    const plan = planResult.rows[0];
    
    // Auto-generate 12 monthly periods
    const monthlyTarget = targetAmount / 12;
    const monthlyUnits = 0;
    
    for (let month = 1; month <= 12; month++) {
      // Ethiopian calendar: deadline is 18th of each month
      // Ethiopian months have 30 days each (except the 13th month)
      const deadline = new Date(year, month - 1, 18); // 18th day of each month
      
      await client.query(
        `INSERT INTO monthly_periods (annual_plan_id, month, year, target_amount, target_units, deadline)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [plan.id, month, year, monthlyTarget, monthlyUnits, deadline]
      );
    }
    
    // Create quarterly aggregations
    for (let quarter = 1; quarter <= 4; quarter++) {
      await client.query(
        `INSERT INTO quarterly_aggregations (annual_plan_id, quarter, year)
         VALUES ($1, $2, $3)`,
        [plan.id, quarter, year]
      );
    }
    
    // Create annual aggregation
    await client.query(
      `INSERT INTO annual_aggregations (annual_plan_id)
       VALUES ($1)`,
      [plan.id]
    );
    
    // Create monthly reports for all branch users
    const branchUsers = await client.query(
      `SELECT id FROM users WHERE role = 'branch_user'`
    );
    
    const monthlyPeriods = await client.query(
      `SELECT id FROM monthly_periods WHERE annual_plan_id = $1`,
      [plan.id]
    );
    
    for (const period of monthlyPeriods.rows) {
      for (const user of branchUsers.rows) {
        await client.query(
          `INSERT INTO monthly_reports (monthly_period_id, branch_user_id)
           VALUES ($1, $2)`,
          [period.id, user.id]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ message: 'Annual plan created successfully', plan });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create annual plan error:', error);
    res.status(500).json({ error: 'Failed to create annual plan' });
  } finally {
    client.release();
  }
};

export const getAnnualPlans = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ap.*, u.username as creator_name 
       FROM annual_plans ap
       LEFT JOIN users u ON ap.created_by = u.id
       ORDER BY ap.year DESC, ap.created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get annual plans error:', error);
    res.status(500).json({ error: 'Failed to get annual plans' });
  }
};

export const getAnnualPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const planResult = await pool.query(
      `SELECT ap.*, u.username as creator_name,
              aa.total_achieved_amount, aa.total_achieved_units, aa.progress_percentage
       FROM annual_plans ap
       LEFT JOIN users u ON ap.created_by = u.id
       LEFT JOIN annual_aggregations aa ON aa.annual_plan_id = ap.id
       WHERE ap.id = $1`,
      [id]
    );
    
    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Annual plan not found' });
    }
    
    const monthlyPeriods = await pool.query(
      `SELECT * FROM monthly_periods WHERE annual_plan_id = $1 ORDER BY month`,
      [id]
    );
    
    const quarterlyData = await pool.query(
      `SELECT * FROM quarterly_aggregations WHERE annual_plan_id = $1 ORDER BY quarter`,
      [id]
    );
    
    res.json({
      plan: planResult.rows[0],
      monthlyPeriods: monthlyPeriods.rows,
      quarterlyData: quarterlyData.rows
    });
  } catch (error) {
    console.error('Get annual plan error:', error);
    res.status(500).json({ error: 'Failed to get annual plan' });
  }
};

// Get plan activities for a specific plan
export const getPlanActivities = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM plan_activities WHERE annual_plan_id = $1 ORDER BY sort_order, activity_number`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get plan activities error:', error);
    res.status(500).json({ error: 'Failed to get plan activities' });
  }
};

// Update Amharic structured plan
export const updateAmharicPlan = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { title, title_amharic, description_amharic, year, month, plan_type, activities } = req.body;
    
    // Update the annual plan
    await client.query(
      `UPDATE annual_plans 
       SET title = $1, plan_title_amharic = $2, plan_description_amharic = $3, 
           year = $4, plan_month = $5, plan_type = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [title, title_amharic, description_amharic, year, month || 1, plan_type || 'amharic_structured', id]
    );

    // Delete existing activities
    await client.query('DELETE FROM plan_activities WHERE annual_plan_id = $1', [id]);

    // Insert updated activities
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      await client.query(
        `INSERT INTO plan_activities (annual_plan_id, activity_number, activity_title_amharic, target_number, target_unit_amharic, sort_order) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, activity.activity_number, activity.activity_title_amharic, activity.target_number, activity.target_unit_amharic, i]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Amharic plan updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update Amharic plan error:', error);
    res.status(500).json({ error: 'Failed to update Amharic plan' });
  } finally {
    client.release();
  }
};

// Delete Amharic structured plan
export const deleteAmharicPlan = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Delete activity reports first (foreign key constraint)
    await client.query(
      `DELETE FROM activity_reports 
       WHERE plan_activity_id IN (
         SELECT id FROM plan_activities WHERE annual_plan_id = $1
       )`,
      [id]
    );
    
    // Delete plan activities
    await client.query('DELETE FROM plan_activities WHERE annual_plan_id = $1', [id]);
    
    // Delete the plan itself
    await client.query('DELETE FROM annual_plans WHERE id = $1 AND plan_type = $2', [id, 'amharic_structured']);

    await client.query('COMMIT');

    res.json({ message: 'Amharic plan deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete Amharic plan error:', error);
    res.status(500).json({ error: 'Failed to delete Amharic plan' });
  } finally {
    client.release();
  }
};

// Delete all Amharic structured plans and reports
export const deleteAllAmharicPlans = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete all activity reports for Amharic plans
    await client.query(
      `DELETE FROM activity_reports 
       WHERE plan_activity_id IN (
         SELECT pa.id FROM plan_activities pa
         JOIN annual_plans ap ON pa.annual_plan_id = ap.id
         WHERE ap.plan_type = 'amharic_structured'
       )`
    );
    
    // Delete all plan activities for Amharic plans
    await client.query(
      `DELETE FROM plan_activities 
       WHERE annual_plan_id IN (
         SELECT id FROM annual_plans WHERE plan_type = 'amharic_structured'
       )`
    );
    
    // Delete all Amharic plans
    await client.query(`DELETE FROM annual_plans WHERE plan_type = 'amharic_structured'`);

    await client.query('COMMIT');

    res.json({ message: 'All Amharic plans and reports deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete all Amharic plans error:', error);
    res.status(500).json({ error: 'Failed to delete all Amharic plans' });
  } finally {
    client.release();
  }
};

// Submit Amharic activity reports
export const submitAmharicActivityReports = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { planId } = req.params;
    
    // Validate request body and reports array
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    const { reports } = req.body; // Array of { activityId, achieved_number, notes_amharic }
    
    if (!reports || !Array.isArray(reports)) {
      return res.status(400).json({ error: 'Reports array is required' });
    }
    
    if (reports.length === 0) {
      return res.status(400).json({ error: 'Reports array cannot be empty' });
    }
    
    const userId = req.user.id;
    
    // Get current month period for this plan
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const periodResult = await client.query(
      `SELECT id FROM monthly_periods WHERE annual_plan_id = $1 AND month = $2 AND year = $3`,
      [planId, currentMonth, currentYear]
    );
    
    if (periodResult.rows.length === 0) {
      return res.status(404).json({ error: 'No monthly period found for current month' });
    }
    
    const monthlyPeriodId = periodResult.rows[0].id;
    
    // Check if any reports have already been submitted for this plan and period
    const submittedReportsCheck = await client.query(
      `SELECT ar.id FROM activity_reports ar
       JOIN plan_activities pa ON ar.plan_activity_id = pa.id
       WHERE pa.annual_plan_id = $1 AND ar.monthly_period_id = $2 AND ar.branch_user_id = $3 
       AND ar.status = 'submitted'`,
      [planId, monthlyPeriodId, userId]
    );
    
    if (submittedReportsCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Reports have already been submitted for this plan',
        message: 'You have already submitted activity reports for this plan this month. Duplicate submissions are not allowed.'
      });
    }

    // Submit reports for each activity
    for (const report of reports) {
      // Validate each report object
      if (!report || typeof report !== 'object') {
        console.warn('Invalid report object:', report);
        continue; // Skip invalid reports
      }
      
      const { activityId, achieved_number, notes_amharic } = report;
      
      // Validate required fields
      if (!activityId) {
        console.warn('Missing activityId in report:', report);
        continue; // Skip reports without activityId
      }
      
      const safeAchievedNumber = Number(achieved_number) || 0;
      const safeNotesAmharic = notes_amharic || '';
      
      const achievement_percentage = await calculateActivityPercentage(client, activityId, safeAchievedNumber);
      
      // Check if report already exists
      const existingReport = await client.query(
        `SELECT id FROM activity_reports 
         WHERE plan_activity_id = $1 AND monthly_period_id = $2 AND branch_user_id = $3`,
        [activityId, monthlyPeriodId, userId]
      );
      
      if (existingReport.rows.length > 0) {
        // Update existing report
        await client.query(
          `UPDATE activity_reports 
           SET achieved_number = $1, achievement_percentage = $2, notes_amharic = $3, 
               status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [safeAchievedNumber, achievement_percentage, safeNotesAmharic, existingReport.rows[0].id]
        );
      } else {
        // Create new report
        await client.query(
          `INSERT INTO activity_reports (plan_activity_id, monthly_period_id, branch_user_id, 
                                       achieved_number, achievement_percentage, notes_amharic, 
                                       status, submitted_at) 
           VALUES ($1, $2, $3, $4, $5, $6, 'submitted', CURRENT_TIMESTAMP)`,
          [activityId, monthlyPeriodId, userId, safeAchievedNumber, achievement_percentage, safeNotesAmharic]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({ message: 'Amharic activity reports submitted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit Amharic activity reports error:', error);
    res.status(500).json({ error: 'Failed to submit activity reports' });
  } finally {
    client.release();
  }
};

// Helper function to calculate activity percentage
const calculateActivityPercentage = async (client, activityId, achievedNumber) => {
  const result = await client.query(
    `SELECT target_number FROM plan_activities WHERE id = $1`,
    [activityId]
  );
  
  if (result.rows.length === 0) return 0;
  
  const targetNumber = result.rows[0].target_number;
  if (targetNumber === 0) return 0;
  
  return Math.min(Math.round((achievedNumber / targetNumber) * 100), 100);
};

// Get Amharic activity reports for a branch user
export const getAmharicActivityReports = async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.user.id;
    
    // Get current month period
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const result = await pool.query(
      `SELECT ar.*, pa.activity_number, pa.activity_title_amharic, pa.target_number, pa.target_unit_amharic,
              mp.month, mp.year
       FROM activity_reports ar
       JOIN plan_activities pa ON ar.plan_activity_id = pa.id
       JOIN monthly_periods mp ON ar.monthly_period_id = mp.id
       WHERE pa.annual_plan_id = $1 AND ar.branch_user_id = $2 AND mp.month = $3 AND mp.year = $4
       ORDER BY pa.sort_order, pa.activity_number`,
      [planId, userId, currentMonth, currentYear]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get Amharic activity reports error:', error);
    res.status(500).json({ error: 'Failed to get activity reports' });
  }
};

// Get all Amharic activity reports for main branch (to view all branch submissions)
export const getAllAmharicActivityReports = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // December = 12
    
    console.log('=== BACKEND: getAllAmharicActivityReports v3 ===');
    console.log('Filtering for month:', currentMonth, 'year:', currentYear);
    
    // First, try to get Amharic activity reports
    const activityReportsResult = await pool.query(
      `SELECT 
         u.branch_name,
         u.username,
         ap.id as plan_id,
         ap.title as plan_title,
         ap.plan_title_amharic,
         ap.goal_amharic,
         ap.plan_month as month,
         ap.year,
         json_agg(
           json_build_object(
             'activity_number', pa.activity_number,
             'activity_title_amharic', pa.activity_title_amharic,
             'target_number', pa.target_number,
             'target_unit_amharic', pa.target_unit_amharic,
             'actual_achievement', ar.achieved_number,
             'achievement_percentage', ar.achievement_percentage,
             'status', ar.status,
             'notes_amharic', ar.notes_amharic,
             'submitted_at', ar.submitted_at
           ) ORDER BY pa.sort_order, pa.activity_number
         ) as activities
       FROM activity_reports ar
       JOIN plan_activities pa ON ar.plan_activity_id = pa.id
       JOIN annual_plans ap ON pa.annual_plan_id = ap.id
       JOIN users u ON ar.branch_user_id = u.id
       JOIN monthly_periods mp ON ar.monthly_period_id = mp.id
       WHERE ap.plan_type = 'amharic_structured'
         AND mp.month = $1
         AND mp.year = $2
       GROUP BY u.branch_name, u.username, ap.id, ap.title, ap.plan_title_amharic, ap.goal_amharic, ap.plan_month, ap.year
       ORDER BY u.branch_name`,
      [currentMonth, currentYear]
    );
    
    console.log('Activity reports found:', activityReportsResult.rows.length);
    
    // If no activity reports found, check for regular monthly reports that could be converted
    if (activityReportsResult.rows.length === 0) {
      console.log('No activity reports found, checking for regular monthly reports...');
      
      const monthlyReportsResult = await pool.query(
        `SELECT 
           u.branch_name,
           u.username,
           mp.id as plan_id,
           mp.title as plan_title,
           mp.title as plan_title_amharic,
           mp.month,
           mp.year,
           json_agg(
             json_build_object(
               'activity_number', '1.0',
               'activity_title_amharic', 'የወርሃዊ ዒላማ ተግባር',
               'target_number', mr.target_amount,
               'target_unit_amharic', 'ብር',
               'actual_achievement', mr.achieved_amount,
               'achievement_percentage', mr.progress_percentage,
               'status', mr.status,
               'notes_amharic', mr.notes,
               'submitted_at', mr.submitted_at
             )
           ) as activities
         FROM monthly_reports mr
         JOIN monthly_plans mp ON mr.monthly_plan_id = mp.id
         JOIN users u ON mr.branch_user_id = u.id
         WHERE mp.month = $1
           AND mp.year = $2
           AND mr.status IN ('submitted', 'late')
         GROUP BY u.branch_name, u.username, mp.id, mp.title, mp.month, mp.year
         ORDER BY u.branch_name`,
        [currentMonth, currentYear]
      );
      
      console.log('Monthly reports found:', monthlyReportsResult.rows.length);
      
      // Transform monthly reports to look like activity reports
      const transformedReports = monthlyReportsResult.rows.map(report => ({
        ...report,
        activities: report.activities.map(activity => ({
          ...activity,
          // Flatten the structure to match expected format
          activity_number: activity.activity_number,
          activity_title_amharic: activity.activity_title_amharic,
          target_number: activity.target_number,
          target_unit_amharic: activity.target_unit_amharic,
          actual_achievement: activity.actual_achievement,
          achievement_percentage: activity.achievement_percentage,
          status: activity.status,
          notes_amharic: activity.notes_amharic,
          submitted_at: activity.submitted_at
        }))
      }));
      
      console.log('=== BACKEND: Returning transformed monthly reports ===');
      console.log('Total transformed reports:', transformedReports.length);
      
      res.json(transformedReports);
    } else {
      console.log('=== BACKEND: Returning activity reports ===');
      console.log('Total activity reports:', activityReportsResult.rows.length);
      
      res.json(activityReportsResult.rows);
    }
  } catch (error) {
    console.error('Get all Amharic activity reports error:', error);
    console.error('Error stack:', error.stack);
    
    // Always return an array, even on error
    res.status(500).json([]);
  }
};

// Create new Amharic structured plan
export const createAmharicPlan = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { title, title_amharic, goal_amharic, description_amharic, year, month, plan_type, activities } = req.body;
    
    // Create the annual plan with Amharic fields including goal
    const planResult = await client.query(
      `INSERT INTO annual_plans (title, plan_title_amharic, goal_amharic, plan_description_amharic, year, plan_month, plan_type, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, title_amharic, goal_amharic, description_amharic, year, month || 1, plan_type || 'amharic_structured', req.user.id]
    );

    const plan = planResult.rows[0];

    // Create plan activities
    const createdActivities = [];
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const activityResult = await client.query(
        `INSERT INTO plan_activities (annual_plan_id, activity_number, activity_title_amharic, target_number, target_unit_amharic, sort_order) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [plan.id, activity.activity_number, activity.activity_title_amharic, activity.target_number, activity.target_unit_amharic, i]
      );
      createdActivities.push(activityResult.rows[0]);
    }

    // Auto-generate 12 monthly periods
    for (let month = 1; month <= 12; month++) {
      const deadline = new Date(year, month - 1, 18);
      
      await client.query(
        `INSERT INTO monthly_periods (annual_plan_id, month, year, deadline) 
         VALUES ($1, $2, $3, $4)`,
        [plan.id, month, year, deadline]
      );
    }

    // Create activity reports for all branch users for each activity and period
    const branchUsers = await client.query(
      "SELECT id FROM users WHERE role = 'branch_user'"
    );

    const monthlyPeriods = await client.query(
      `SELECT id FROM monthly_periods WHERE annual_plan_id = $1`,
      [plan.id]
    );

    for (const period of monthlyPeriods.rows) {
      for (const activity of createdActivities) {
        for (const user of branchUsers.rows) {
          await client.query(
            `INSERT INTO activity_reports (plan_activity_id, monthly_period_id, branch_user_id, achieved_number, achievement_percentage) 
             VALUES ($1, $2, $3, $4, $5)`,
            [activity.id, period.id, user.id, 0, 0]
          );
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Amharic structured plan created successfully',
      plan,
      activities: createdActivities
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create Amharic plan error:', error);
    res.status(500).json({ error: 'Failed to create Amharic plan' });
  } finally {
    client.release();
  }
};
