const express = require('express');
const { query } = require('../config/database');
const { validateLabTest } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get lab tests for a patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status } = req.query;
    
    let whereClause = 'WHERE lt.patient_id = $1';
    let queryParams = [patientId];
    
    if (status) {
      whereClause += ' AND lt.status = $2';
      queryParams.push(status);
    }
    
    const result = await query(`
      SELECT lt.id, lt.test_name, lt.test_type, lt.test_date, lt.test_time,
             lt.location, lt.status, lt.results, lt.created_at, lt.updated_at,
             d.first_name as doctor_first_name, d.last_name as doctor_last_name
      FROM lab_tests lt
      LEFT JOIN doctors d ON lt.ordered_by = d.id
      ${whereClause}
      ORDER BY lt.test_date DESC, lt.test_time DESC
    `, queryParams);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab tests',
      error: error.message
    });
  }
});

// Create new lab test
router.post('/', authenticateToken, validateLabTest, async (req, res) => {
  try {
    const {
      patient_id,
      test_name,
      test_type,
      ordered_by,
      test_date,
      test_time,
      location,
      status = 'scheduled',
      results
    } = req.body;
    
    const result = await query(`
      INSERT INTO lab_tests (
        patient_id, test_name, test_type, ordered_by, test_date, test_time,
        location, status, results
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, patient_id, test_name, test_type, ordered_by, test_date, test_time,
                location, status, results, created_at, updated_at
    `, [
      patient_id, test_name, test_type, ordered_by, test_date, test_time,
      location, status, results
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Lab test scheduled successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating lab test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule lab test',
      error: error.message
    });
  }
});

module.exports = router;
