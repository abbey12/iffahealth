const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateLabTest } = require('../middleware/enhanced_validation');

const router = express.Router();

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
      notes
    } = req.body;
    
    const result = await query(`
      INSERT INTO lab_tests (
        patient_id, test_name, test_type, ordered_by, test_date, test_time, location, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8)
      RETURNING id, patient_id, test_name, test_type, ordered_by, test_date, test_time, location, status, notes, created_at, updated_at
    `, [patient_id, test_name, test_type, ordered_by, test_date, test_time, location, notes]);
    
    res.status(201).json({
      success: true,
      message: 'Lab test created successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating lab test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lab test',
      error: error.message
    });
  }
});

// Get lab test by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        lt.id,
        lt.patient_id,
        lt.test_name,
        lt.test_type,
        lt.test_date,
        lt.test_time,
        lt.location,
        lt.status,
        lt.results,
        lt.notes,
        lt.doctor_notes,
        lt.created_at,
        lt.updated_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty as doctor_specialty
      FROM lab_tests lt
      JOIN patients p ON lt.patient_id = p.id
      LEFT JOIN doctors d ON lt.ordered_by = d.id
      WHERE lt.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }
    
    const labTest = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: labTest.id,
        patientId: labTest.patient_id,
        patientName: `${labTest.patient_first_name} ${labTest.patient_last_name}`,
        patientPhone: labTest.patient_phone,
        testName: labTest.test_name,
        testType: labTest.test_type,
        date: labTest.test_date,
        time: labTest.test_time,
        location: labTest.location,
        status: labTest.status,
        results: labTest.results,
        notes: labTest.notes,
        doctorNotes: labTest.doctor_notes,
        orderedBy: labTest.doctor_first_name && labTest.doctor_last_name 
          ? `${labTest.doctor_first_name} ${labTest.doctor_last_name}` 
          : null,
        doctorSpecialty: labTest.doctor_specialty,
        createdAt: labTest.created_at,
        updatedAt: labTest.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error fetching lab test:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update lab test
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, results, notes, doctor_notes } = req.body;
    
    const result = await query(`
      UPDATE lab_tests 
      SET 
        status = COALESCE($2, status),
        results = COALESCE($3, results),
        notes = COALESCE($4, notes),
        doctor_notes = COALESCE($5, doctor_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, status, results ? JSON.stringify(results) : null, notes, doctor_notes]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Lab test updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating lab test:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get lab tests by patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE lt.patient_id = $1';
    let queryParams = [patientId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND lt.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM lab_tests lt 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        lt.id,
        lt.test_name,
        lt.test_type,
        lt.test_date,
        lt.test_time,
        lt.location,
        lt.status,
        lt.results,
        lt.notes,
        lt.doctor_notes,
        lt.created_at,
        lt.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM lab_tests lt
      LEFT JOIN doctors d ON lt.ordered_by = d.id
      ${whereClause}
      ORDER BY lt.test_date DESC, lt.test_time DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const labTests = dataResult.rows.map(row => ({
      id: row.id,
      patientId: patientId,
      testName: row.test_name,
      testType: row.test_type,
      date: row.test_date,
      time: row.test_time,
      location: row.location,
      status: row.status,
      results: row.results,
      notes: row.notes,
      doctorNotes: row.doctor_notes,
      orderedBy: row.doctor_first_name && row.doctor_last_name 
        ? `${row.doctor_first_name} ${row.doctor_last_name}` 
        : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: labTests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching patient lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get upcoming lab tests for patient
router.get('/patient/:patientId/upcoming', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const result = await query(`
      SELECT 
        lt.id,
        lt.test_name,
        lt.test_type,
        lt.test_date,
        lt.test_time,
        lt.location,
        lt.status,
        lt.results,
        lt.notes,
        lt.doctor_notes,
        lt.created_at,
        lt.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM lab_tests lt
      LEFT JOIN doctors d ON lt.ordered_by = d.id
      WHERE lt.patient_id = $1 
        AND lt.test_date >= CURRENT_DATE
        AND lt.status = 'scheduled'
      ORDER BY lt.test_date ASC, lt.test_time ASC
    `, [patientId]);
    
    const labTests = result.rows.map(row => ({
      id: row.id,
      patientId: patientId,
      testName: row.test_name,
      testType: row.test_type,
      date: row.test_date,
      time: row.test_time,
      location: row.location,
      status: row.status,
      results: row.results,
      notes: row.notes,
      doctorNotes: row.doctor_notes,
      orderedBy: row.doctor_first_name && row.doctor_last_name 
        ? `${row.doctor_first_name} ${row.doctor_last_name}` 
        : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: labTests
    });
    
  } catch (error) {
    console.error('Error fetching upcoming lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get lab tests by doctor
router.get('/doctor/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE lt.ordered_by = $1';
    let queryParams = [doctorId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND lt.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM lab_tests lt 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        lt.id,
        lt.patient_id,
        lt.test_name,
        lt.test_type,
        lt.test_date,
        lt.test_time,
        lt.location,
        lt.status,
        lt.results,
        lt.notes,
        lt.doctor_notes,
        lt.created_at,
        lt.updated_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone
      FROM lab_tests lt
      JOIN patients p ON lt.patient_id = p.id
      ${whereClause}
      ORDER BY lt.test_date DESC, lt.test_time DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const labTests = dataResult.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: `${row.patient_first_name} ${row.patient_last_name}`,
      patientPhone: row.patient_phone,
      testName: row.test_name,
      testType: row.test_type,
      date: row.test_date,
      time: row.test_time,
      location: row.location,
      status: row.status,
      results: row.results,
      notes: row.notes,
      doctorNotes: row.doctor_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: labTests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching doctor lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add lab test results
router.post('/:id/results', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { results, doctor_notes } = req.body;
    
    const result = await query(`
      UPDATE lab_tests 
      SET 
        results = $2,
        doctor_notes = COALESCE($3, doctor_notes),
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, JSON.stringify(results), doctor_notes]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Lab test results added successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error adding lab test results:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add doctor notes to lab test
router.post('/:id/notes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { doctor_notes } = req.body;
    
    const result = await query(`
      UPDATE lab_tests 
      SET 
        doctor_notes = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, doctor_notes]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Doctor notes added successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error adding doctor notes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get lab test types
router.get('/types/list', authenticateToken, async (req, res) => {
  try {
    const labTestTypes = [
      { id: 'blood_test', name: 'Blood Test', category: 'Hematology' },
      { id: 'urine_test', name: 'Urine Test', category: 'Urinalysis' },
      { id: 'x_ray', name: 'X-Ray', category: 'Radiology' },
      { id: 'ct_scan', name: 'CT Scan', category: 'Radiology' },
      { id: 'mri', name: 'MRI', category: 'Radiology' },
      { id: 'ultrasound', name: 'Ultrasound', category: 'Radiology' },
      { id: 'ecg', name: 'ECG', category: 'Cardiology' },
      { id: 'echocardiogram', name: 'Echocardiogram', category: 'Cardiology' },
      { id: 'endoscopy', name: 'Endoscopy', category: 'Gastroenterology' },
      { id: 'colonoscopy', name: 'Colonoscopy', category: 'Gastroenterology' },
      { id: 'mammogram', name: 'Mammogram', category: 'Oncology' },
      { id: 'pap_smear', name: 'Pap Smear', category: 'Gynecology' },
      { id: 'pregnancy_test', name: 'Pregnancy Test', category: 'Gynecology' },
      { id: 'stool_test', name: 'Stool Test', category: 'Microbiology' },
      { id: 'throat_swab', name: 'Throat Swab', category: 'Microbiology' },
      { id: 'covid_test', name: 'COVID-19 Test', category: 'Infectious Disease' },
      { id: 'hiv_test', name: 'HIV Test', category: 'Infectious Disease' },
      { id: 'hepatitis_test', name: 'Hepatitis Test', category: 'Infectious Disease' },
      { id: 'diabetes_test', name: 'Diabetes Test', category: 'Endocrinology' },
      { id: 'thyroid_test', name: 'Thyroid Test', category: 'Endocrinology' }
    ];
    
    res.json({
      success: true,
      data: labTestTypes
    });
    
  } catch (error) {
    console.error('Error fetching lab test types:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get lab test statistics
router.get('/stats/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND lt.test_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND lt.test_date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND lt.test_date >= CURRENT_DATE - INTERVAL '365 days'";
        break;
    }
    
    const statsResult = await query(`
      SELECT 
        COUNT(lt.id) as total_tests,
        COUNT(CASE WHEN lt.status = 'scheduled' THEN 1 END) as scheduled_tests,
        COUNT(CASE WHEN lt.status = 'completed' THEN 1 END) as completed_tests,
        COUNT(CASE WHEN lt.status = 'pending' THEN 1 END) as pending_tests,
        COUNT(CASE WHEN lt.status = 'cancelled' THEN 1 END) as cancelled_tests,
        COUNT(DISTINCT lt.patient_id) as unique_patients
      FROM lab_tests lt
      WHERE lt.ordered_by = $1 ${dateFilter}
    `, [doctorId]);
    
    const stats = statsResult.rows[0];
    
    res.json({
      success: true,
      data: {
        totalTests: parseInt(stats.total_tests),
        scheduledTests: parseInt(stats.scheduled_tests),
        completedTests: parseInt(stats.completed_tests),
        pendingTests: parseInt(stats.pending_tests),
        cancelledTests: parseInt(stats.cancelled_tests),
        uniquePatients: parseInt(stats.unique_patients)
      }
    });
    
  } catch (error) {
    console.error('Error fetching lab test stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search lab tests
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query: searchQuery, patient_id, doctor_id, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    let paramCount = 1;
    
    if (searchQuery) {
      whereClause += ` AND (lt.test_name ILIKE $${paramCount} OR lt.test_type ILIKE $${paramCount})`;
      queryParams.push(`%${searchQuery}%`);
      paramCount++;
    }
    
    if (patient_id) {
      whereClause += ` AND lt.patient_id = $${paramCount}`;
      queryParams.push(patient_id);
      paramCount++;
    }
    
    if (doctor_id) {
      whereClause += ` AND lt.ordered_by = $${paramCount}`;
      queryParams.push(doctor_id);
      paramCount++;
    }
    
    if (status) {
      whereClause += ` AND lt.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM lab_tests lt 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        lt.id,
        lt.patient_id,
        lt.test_name,
        lt.test_type,
        lt.test_date,
        lt.test_time,
        lt.location,
        lt.status,
        lt.results,
        lt.notes,
        lt.doctor_notes,
        lt.created_at,
        lt.updated_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM lab_tests lt
      LEFT JOIN patients p ON lt.patient_id = p.id
      LEFT JOIN doctors d ON lt.ordered_by = d.id
      ${whereClause}
      ORDER BY lt.test_date DESC, lt.test_time DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const labTests = dataResult.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_first_name && row.patient_last_name 
        ? `${row.patient_first_name} ${row.patient_last_name}` 
        : null,
      testName: row.test_name,
      testType: row.test_type,
      date: row.test_date,
      time: row.test_time,
      location: row.location,
      status: row.status,
      results: row.results,
      notes: row.notes,
      doctorNotes: row.doctor_notes,
      orderedBy: row.doctor_first_name && row.doctor_last_name 
        ? `${row.doctor_first_name} ${row.doctor_last_name}` 
        : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: labTests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error searching lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
