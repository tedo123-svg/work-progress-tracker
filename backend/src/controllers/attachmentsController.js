import pool from '../database/db.js';

export const addActionAttachment = async (req, res) => {
  try {
    const { actionId } = req.params;
    const { title, url, mimeType } = req.body;

    const actionExists = await pool.query(
      'SELECT id FROM actions WHERE id = $1',
      [actionId]
    );
    if (actionExists.rows.length === 0) {
      return res.status(404).json({ error: 'Action not found' });
    }

    const result = await pool.query(
      `INSERT INTO attachments (entity_type, entity_id, title, url, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['action', actionId, title, url, mimeType || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add action attachment error:', error);
    res.status(500).json({ error: 'Failed to add attachment' });
  }
};

export const addActionReportAttachment = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { title, url, mimeType } = req.body;

    // Ensure the report belongs to this branch user
    const report = await pool.query(
      'SELECT id FROM action_reports WHERE id = $1 AND branch_user_id = $2',
      [reportId, req.user.id]
    );
    if (report.rows.length === 0) {
      return res.status(404).json({ error: 'Action report not found' });
    }

    const result = await pool.query(
      `INSERT INTO attachments (entity_type, entity_id, title, url, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['action_report', reportId, title, url, mimeType || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add action report attachment error:', error);
    res.status(500).json({ error: 'Failed to add attachment' });
  }
};

export const addMonthlyReportAttachment = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { title, url, mimeType } = req.body;

    // Ensure the report belongs to this branch user
    const report = await pool.query(
      'SELECT id FROM monthly_reports WHERE id = $1 AND branch_user_id = $2',
      [reportId, req.user.id]
    );
    if (report.rows.length === 0) {
      return res.status(404).json({ error: 'Monthly report not found' });
    }

    const result = await pool.query(
      `INSERT INTO attachments (entity_type, entity_id, title, url, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['monthly_report', reportId, title, url, mimeType || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add monthly report attachment error:', error);
    res.status(500).json({ error: 'Failed to add attachment' });
  }
};

export const listAttachments = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const result = await pool.query(
      'SELECT * FROM attachments WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
      [entityType, entityId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List attachments error:', error);
    res.status(500).json({ error: 'Failed to list attachments' });
  }
};

