import bcrypt from 'bcryptjs';
import pool from '../database/db.js';

// Get all branches
export const getAllBranches = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, branch_name, email, created_at, 
              (SELECT COUNT(*) FROM monthly_reports WHERE branch_user_id = users.id) as total_reports,
              (SELECT COUNT(*) FROM action_reports WHERE branch_user_id = users.id) as total_action_reports
       FROM users 
       WHERE role = 'branch_user' 
       ORDER BY branch_name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: 'Failed to get branches' });
  }
};

// Create new branch
export const createBranch = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { username, password, branchName, email } = req.body;
    
    // Check if username or email already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create branch user
    const result = await client.query(
      `INSERT INTO users (username, password, role, branch_name, email)
       VALUES ($1, $2, 'branch_user', $3, $4) RETURNING id, username, branch_name, email, created_at`,
      [username, hashedPassword, branchName, email]
    );
    
    const newBranch = result.rows[0];
    
    // Create action reports for existing actions
    const actions = await client.query('SELECT id FROM actions');
    const monthlyPeriods = await client.query('SELECT id FROM monthly_periods');
    
    for (const action of actions.rows) {
      for (const period of monthlyPeriods.rows) {
        await client.query(
          `INSERT INTO action_reports (action_id, monthly_period_id, branch_user_id)
           VALUES ($1, $2, $3)`,
          [action.id, period.id, newBranch.id]
        );
      }
    }
    
    // Create monthly reports for existing monthly periods
    for (const period of monthlyPeriods.rows) {
      await client.query(
        `INSERT INTO monthly_reports (monthly_period_id, branch_user_id)
         VALUES ($1, $2)`,
        [period.id, newBranch.id]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Branch created successfully',
      branch: newBranch
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create branch error:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  } finally {
    client.release();
  }
};

// Update branch
export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, branchName, email, password } = req.body;
    
    let query = `UPDATE users SET username = $1, branch_name = $2, email = $3, updated_at = NOW()`;
    let params = [username, branchName, email];
    
    // If password is provided, hash and update it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password = $4`;
      params.push(hashedPassword);
    }
    
    query += ` WHERE id = $${params.length + 1} AND role = 'branch_user' RETURNING id, username, branch_name, email`;
    params.push(id);
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json({
      message: 'Branch updated successfully',
      branch: result.rows[0]
    });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ error: 'Failed to update branch' });
  }
};

// Delete branch
export const deleteBranch = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Check if branch exists
    const branchResult = await client.query(
      'SELECT id, username, branch_name FROM users WHERE id = $1 AND role = $2',
      [id, 'branch_user']
    );
    
    if (branchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    const branch = branchResult.rows[0];
    
    // Delete related records (cascade should handle this, but being explicit)
    await client.query('DELETE FROM monthly_reports WHERE branch_user_id = $1', [id]);
    await client.query('DELETE FROM action_reports WHERE branch_user_id = $1', [id]);
    
    // Delete the user
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Branch deleted successfully',
      deletedBranch: branch
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete branch error:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  } finally {
    client.release();
  }
};

// Get branch statistics
export const getBranchStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_branches,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month,
        (SELECT COUNT(*) FROM monthly_reports WHERE status = 'submitted') as total_reports_submitted,
        (SELECT COUNT(*) FROM action_reports WHERE status = 'submitted') as total_action_reports_submitted
      FROM users 
      WHERE role = 'branch_user'
    `);
    
    const monthlyActivity = await pool.query(`
      SELECT 
        DATE_TRUNC('month', submitted_at) as month,
        COUNT(*) as reports_count
      FROM monthly_reports 
      WHERE submitted_at IS NOT NULL 
        AND submitted_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', submitted_at)
      ORDER BY month DESC
    `);
    
    res.json({
      overview: stats.rows[0],
      monthlyActivity: monthlyActivity.rows
    });
  } catch (error) {
    console.error('Get branch stats error:', error);
    res.status(500).json({ error: 'Failed to get branch statistics' });
  }
};

// Reset branch password
export const resetBranchPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query(
      `UPDATE users SET password = $1, updated_at = NOW() 
       WHERE id = $2 AND role = 'branch_user' 
       RETURNING id, username, branch_name`,
      [hashedPassword, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json({
      message: 'Password reset successfully',
      branch: result.rows[0]
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Get all users (for admin overview)
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, role, branch_name, email, created_at
       FROM users 
       ORDER BY role, branch_name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};