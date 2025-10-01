const express = require('express');
const { query } = require('../config/database');
const { validateMedication } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get medications for a patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status } = req.query;
    
    let whereClause = 'WHERE m.patient_id = $1';
    let queryParams = [patientId];
    
    if (status) {
      whereClause += ' AND m.status = $2';
      queryParams.push(status);
    }
    
    const result = await query(`
      SELECT m.id, m.name, m.dosage, m.frequency, m.start_date, m.end_date,
             m.instructions, m.status, m.created_at, m.updated_at,
             d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM medications m
      LEFT JOIN doctors d ON m.prescribed_by = d.id
      ${whereClause}
      ORDER BY m.created_at DESC
    `, queryParams);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medications',
      error: error.message
    });
  }
});

// Create new medication
router.post('/', authenticateToken, validateMedication, async (req, res) => {
  try {
    const {
      patient_id,
      name,
      dosage,
      frequency,
      start_date,
      end_date,
      prescribed_by,
      instructions,
      status = 'active'
    } = req.body;
    
    const result = await query(`
      INSERT INTO medications (
        patient_id, name, dosage, frequency, start_date, end_date,
        prescribed_by, instructions, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, patient_id, name, dosage, frequency, start_date, end_date,
                prescribed_by, instructions, status, created_at, updated_at
    `, [
      patient_id, name, dosage, frequency, start_date, end_date,
      prescribed_by, instructions, status
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Medication added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add medication',
      error: error.message
    });
  }
});

module.exports = router;
