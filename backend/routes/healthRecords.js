const express = require('express');
const { query } = require('../config/database');
const { validateHealthRecord } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get health records for a patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE hr.patient_id = $1';
    let queryParams = [patientId];
    let paramCount = 2;
    
    if (type) {
      whereClause += ` AND hr.type = $${paramCount}`;
      queryParams.push(type);
      paramCount++;
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM health_records hr 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT hr.id, hr.type, hr.title, hr.document_url, hr.upload_date,
             hr.notes, hr.created_at, hr.updated_at,
             u.email as uploaded_by_email
      FROM health_records hr
      LEFT JOIN users u ON hr.uploaded_by = u.id
      ${whereClause}
      ORDER BY hr.upload_date DESC, hr.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching health records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health records',
      error: error.message
    });
  }
});

// Create new health record
router.post('/', authenticateToken, validateHealthRecord, async (req, res) => {
  try {
    const {
      patient_id,
      type,
      title,
      document_url,
      upload_date,
      notes,
      uploaded_by
    } = req.body;
    
    const result = await query(`
      INSERT INTO health_records (
        patient_id, type, title, document_url, upload_date,
        notes, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, patient_id, type, title, document_url, upload_date,
                notes, uploaded_by, created_at, updated_at
    `, [
      patient_id, type, title, document_url, upload_date,
      notes, uploaded_by
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Health record created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating health record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create health record',
      error: error.message
    });
  }
});

module.exports = router;
