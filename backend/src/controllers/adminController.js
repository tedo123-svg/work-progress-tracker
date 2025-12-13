import bcrypt from 'bcryptjs';
import pool from '../database/db.js';
import { sendPasswordResetEmail } from '../services/resendService.js';

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
    
    let query = `UPDATE users SET username = $1, branch_name = $2, email = $3`;
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
      `UPDATE users SET password = $1 
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
      `SELECT id, username, role, branch_name, email, created_at,
              (SELECT COUNT(*) FROM monthly_reports WHERE branch_user_id = users.id) as total_reports,
              (SELECT COUNT(*) FROM action_reports WHERE branch_user_id = users.id) as total_action_reports
       FROM users 
       ORDER BY role, branch_name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Create any type of user (admin, main_branch, branch_user)
export const createUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { username, password, role, branchName, email, phoneNumber } = req.body;
    
    // Validate role
    if (!['admin', 'main_branch', 'branch_user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
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
    
    // Create user
    const result = await client.query(
      `INSERT INTO users (username, password, role, branch_name, email, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, role, branch_name, email, phone_number, created_at`,
      [username, hashedPassword, role, branchName || null, email, phoneNumber || null]
    );
    
    const newUser = result.rows[0];
    
    // If creating a branch user, set up their reports
    if (role === 'branch_user') {
      // Create action reports for existing actions
      const actions = await client.query('SELECT id FROM actions');
      const monthlyPeriods = await client.query('SELECT id FROM monthly_periods');
      
      for (const action of actions.rows) {
        for (const period of monthlyPeriods.rows) {
          await client.query(
            `INSERT INTO action_reports (action_id, monthly_period_id, branch_user_id)
             VALUES ($1, $2, $3)`,
            [action.id, period.id, newUser.id]
          );
        }
      }
      
      // Create monthly reports for existing monthly periods
      for (const period of monthlyPeriods.rows) {
        await client.query(
          `INSERT INTO monthly_reports (monthly_period_id, branch_user_id)
           VALUES ($1, $2)`,
          [period.id, newUser.id]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    client.release();
  }
};

// Update any user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, branchName, email, password } = req.body;
    
    // Validate role if provided
    if (role && !['admin', 'main_branch', 'branch_user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    let query = `UPDATE users SET username = $1, role = $2, branch_name = $3, email = $4`;
    let params = [username, role, branchName || null, email];
    
    // If password is provided, hash and update it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password = $5`;
      params.push(hashedPassword);
    }
    
    query += ` WHERE id = $${params.length + 1} RETURNING id, username, role, branch_name, email`;
    params.push(id);
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete any user
export const deleteUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Check if user exists
    const userResult = await client.query(
      'SELECT id, username, role, branch_name FROM users WHERE id = $1',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await client.query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }
    
    // Delete related records (cascade should handle this, but being explicit)
    await client.query('DELETE FROM monthly_reports WHERE branch_user_id = $1', [id]);
    await client.query('DELETE FROM action_reports WHERE branch_user_id = $1', [id]);
    
    // Delete the user
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.json({
      message: 'User deleted successfully',
      deletedUser: user
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    client.release();
  }
};

// Reset any user's password
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query(
      `UPDATE users SET password = $1 
       WHERE id = $2 
       RETURNING id, username, role, branch_name, email`,
      [hashedPassword, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    // Send password reset email notification
    try {
      await sendPasswordResetEmail(user.email, newPassword, user.username);
      console.log('✅ Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      // Don't fail the password reset if email fails
    }
    
    res.json({
      message: 'Password reset successfully and notification sent',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        branch_name: user.branch_name
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Get system overview statistics
export const getSystemStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
        (SELECT COUNT(*) FROM users WHERE role = 'main_branch') as total_main_branches,
        (SELECT COUNT(*) FROM users WHERE role = 'branch_user') as total_branch_users,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM annual_plans) as total_annual_plans,
        (SELECT COUNT(*) FROM monthly_reports WHERE status = 'submitted') as total_reports_submitted,
        (SELECT COUNT(*) FROM action_reports WHERE status = 'submitted') as total_action_reports_submitted,
        (SELECT COUNT(*) FROM monthly_reports WHERE status = 'late') as total_late_reports
    `);
    
    const recentActivity = await pool.query(`
      SELECT 
        'report' as type,
        u.username,
        u.branch_name,
        mr.submitted_at as activity_date,
        'Monthly Report Submitted' as description
      FROM monthly_reports mr
      JOIN users u ON mr.branch_user_id = u.id
      WHERE mr.submitted_at IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'action_report' as type,
        u.username,
        u.branch_name,
        ar.submitted_at as activity_date,
        'Action Report Submitted' as description
      FROM action_reports ar
      JOIN users u ON ar.branch_user_id = u.id
      WHERE ar.submitted_at IS NOT NULL
      
      ORDER BY activity_date DESC
      LIMIT 10
    `);
    
    res.json({
      overview: stats.rows[0],
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ error: 'Failed to get system statistics' });
  }
};
// Update user email specifically (quick email update)
export const updateUserEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    
    // Check if email already exists for another user
    const existingEmail = await pool.query(
      'SELECT id, username FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );
    
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ 
        error: `Email already in use by user: ${existingEmail.rows[0].username}` 
      });
    }
    
    const result = await pool.query(
      `UPDATE users SET email = $1 WHERE id = $2 RETURNING id, username, email, role, branch_name`,
      [email, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ Admin updated email for user ${result.rows[0].username} to ${email}`);
    
    res.json({
      message: 'Email updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Failed to update email' });
  }
};
// Update user phone number specifically
export const updateUserPhone = async (req, res) => {
  try {
    const { id } = req.params;
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Basic phone number validation (can be enhanced)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    // Check if phone number already exists for another user
    const existingPhone = await pool.query(
      'SELECT id, username FROM users WHERE phone_number = $1 AND id != $2',
      [phoneNumber, id]
    );
    
    if (existingPhone.rows.length > 0) {
      return res.status(400).json({ 
        error: `Phone number already in use by user: ${existingPhone.rows[0].username}` 
      });
    }
    
    const result = await pool.query(
      `UPDATE users SET phone_number = $1 WHERE id = $2 RETURNING id, username, email, phone_number, role, branch_name`,
      [phoneNumber, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ Admin updated phone number for user ${result.rows[0].username} to ${phoneNumber}`);
    
    res.json({
      message: 'Phone number updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update phone number error:', error);
    res.status(500).json({ error: 'Failed to update phone number' });
  }
};

// Update user contact info (email and phone together)
export const updateUserContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phoneNumber } = req.body;
    
    // Validate email
    if (email && !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    
    // Validate phone number
    if (phoneNumber) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }
    }
    
    // Check for duplicate email
    if (email) {
      const existingEmail = await pool.query(
        'SELECT id, username FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      
      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ 
          error: `Email already in use by user: ${existingEmail.rows[0].username}` 
        });
      }
    }
    
    // Check for duplicate phone number
    if (phoneNumber) {
      const existingPhone = await pool.query(
        'SELECT id, username FROM users WHERE phone_number = $1 AND id != $2',
        [phoneNumber, id]
      );
      
      if (existingPhone.rows.length > 0) {
        return res.status(400).json({ 
          error: `Phone number already in use by user: ${existingPhone.rows[0].username}` 
        });
      }
    }
    
    // Build dynamic query
    let query = 'UPDATE users SET ';
    let params = [];
    let updates = [];
    
    if (email) {
      updates.push(`email = $${params.length + 1}`);
      params.push(email);
    }
    
    if (phoneNumber) {
      updates.push(`phone_number = $${params.length + 1}`);
      params.push(phoneNumber);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No contact information provided to update' });
    }
    
    query += updates.join(', ');
    query += ` WHERE id = $${params.length + 1} RETURNING id, username, email, phone_number, role, branch_name`;
    params.push(id);
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ Admin updated contact info for user ${result.rows[0].username}`);
    
    res.json({
      message: 'Contact information updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update contact info error:', error);
    res.status(500).json({ error: 'Failed to update contact information' });
  }
};