const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get patient profile
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get patient details
    const patientResult = await query(`
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.phone,
        p.date_of_birth,
        p.gender,
        p.address,
        p.emergency_contact,
        p.medical_history,
        p.allergies,
        p.current_medications,
        p.created_at,
        p.updated_at,
        u.email
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [id]);

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const patient = patientResult.rows[0];

    res.json({
      success: true,
      data: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        address: patient.address,
        emergencyContact: patient.emergency_contact,
        medicalHistory: patient.medical_history || [],
        allergies: patient.allergies || [],
        currentMedications: patient.current_medications || [],
        createdAt: patient.created_at,
        updatedAt: patient.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update patient profile
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      medicalHistory,
      allergies,
      currentMedications
    } = req.body;

    // Update patient
    const result = await query(`
      UPDATE patients 
      SET 
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        phone = COALESCE($4, phone),
        date_of_birth = COALESCE($5, date_of_birth),
        gender = COALESCE($6, gender),
        address = COALESCE($7, address),
        emergency_contact = COALESCE($8, emergency_contact),
        medical_history = COALESCE($9, medical_history),
        allergies = COALESCE($10, allergies),
        current_medications = COALESCE($11, current_medications),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [
      id,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address ? JSON.stringify(address) : null,
      emergencyContact ? JSON.stringify(emergencyContact) : null,
      medicalHistory,
      allergies,
      currentMedications
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get patient appointments
router.get('/:id/appointments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.type,
        a.status,
        a.notes,
        a.meeting_link,
        a.created_at,
        a.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [id]);

    const appointments = result.rows.map(row => ({
      id: row.id,
      doctorName: `${row.doctor_first_name} ${row.doctor_last_name}`,
      specialty: row.specialty,
      date: row.appointment_date,
      time: row.appointment_time,
      type: row.type,
      status: row.status,
      notes: row.notes,
      meetingLink: row.meeting_link,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get upcoming appointments
router.get('/:id/appointments/upcoming', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.type,
        a.status,
        a.notes,
        a.meeting_link,
        a.created_at,
        a.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = $1 
        AND a.appointment_date >= CURRENT_DATE
        AND a.status IN ('scheduled', 'confirmed')
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `, [id]);

    const appointments = result.rows.map(row => ({
      id: row.id,
      doctorName: `${row.doctor_first_name} ${row.doctor_last_name}`,
      specialty: row.specialty,
      date: row.appointment_date,
      time: row.appointment_time,
      type: row.type,
      status: row.status,
      notes: row.notes,
      meetingLink: row.meeting_link,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get patient medications
router.get('/:id/medications', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        m.id,
        m.name,
        m.dosage,
        m.frequency,
        m.instructions,
        m.start_date,
        m.end_date,
        m.status,
        m.created_at,
        m.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM medications m
      LEFT JOIN doctors d ON m.prescribed_by = d.id
      WHERE m.patient_id = $1
      ORDER BY m.created_at DESC
    `, [id]);

    const medications = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      instructions: row.instructions,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      prescribedBy: row.doctor_first_name && row.doctor_last_name 
        ? `${row.doctor_first_name} ${row.doctor_last_name}` 
        : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: medications
    });

  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current medications
router.get('/:id/medications/current', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        m.id,
        m.name,
        m.dosage,
        m.frequency,
        m.instructions,
        m.start_date,
        m.end_date,
        m.status,
        m.created_at,
        m.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM medications m
      LEFT JOIN doctors d ON m.prescribed_by = d.id
      WHERE m.patient_id = $1 AND m.status = 'active'
      ORDER BY m.created_at DESC
    `, [id]);

    const medications = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      instructions: row.instructions,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      prescribedBy: row.doctor_first_name && row.doctor_last_name 
        ? `${row.doctor_first_name} ${row.doctor_last_name}` 
        : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: medications
    });

  } catch (error) {
    console.error('Error fetching current medications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get patient lab tests
router.get('/:id/lab-tests', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
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
        lt.created_at,
        lt.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM lab_tests lt
      LEFT JOIN doctors d ON lt.ordered_by = d.id
      WHERE lt.patient_id = $1
      ORDER BY lt.test_date DESC, lt.test_time DESC
    `, [id]);

    const labTests = result.rows.map(row => ({
      id: row.id,
      testName: row.test_name,
      testType: row.test_type,
      date: row.test_date,
      time: row.test_time,
      location: row.location,
      status: row.status,
      results: row.results,
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
    console.error('Error fetching lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get upcoming lab tests
router.get('/:id/lab-tests/upcoming', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
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
    `, [id]);

    const labTests = result.rows.map(row => ({
      id: row.id,
      testName: row.test_name,
      testType: row.test_type,
      date: row.test_date,
      time: row.test_time,
      location: row.location,
      status: row.status,
      results: row.results,
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

// Get patient health records
router.get('/:id/health-records', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        hr.id,
        hr.title,
        hr.type,
        hr.document_url,
        hr.upload_date,
        hr.notes,
        hr.created_at,
        hr.updated_at,
        u.email as uploaded_by_email
      FROM health_records hr
      LEFT JOIN users u ON hr.uploaded_by = u.id
      WHERE hr.patient_id = $1
      ORDER BY hr.upload_date DESC
    `, [id]);

    const healthRecords = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      type: row.type,
      documentUrl: row.document_url,
      uploadDate: row.upload_date,
      notes: row.notes,
      uploadedBy: row.uploaded_by_email,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: healthRecords
    });

  } catch (error) {
    console.error('Error fetching health records:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get recent health records
router.get('/:id/health-records/recent', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        hr.id,
        hr.title,
        hr.type,
        hr.document_url,
        hr.upload_date,
        hr.notes,
        hr.created_at,
        hr.updated_at,
        u.email as uploaded_by_email
      FROM health_records hr
      LEFT JOIN users u ON hr.uploaded_by = u.id
      WHERE hr.patient_id = $1 
        AND hr.upload_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY hr.upload_date DESC
    `, [id]);

    const healthRecords = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      type: row.type,
      documentUrl: row.document_url,
      uploadDate: row.upload_date,
      notes: row.notes,
      uploadedBy: row.uploaded_by_email,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: healthRecords
    });

  } catch (error) {
    console.error('Error fetching recent health records:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;