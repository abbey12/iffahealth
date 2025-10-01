const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validatePatientProfile } = require('../middleware/enhanced_validation');

const router = express.Router();

// Get patient profile with complete information
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get patient details with user information
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
        p.blood_type,
        p.height,
        p.weight,
        p.marital_status,
        p.occupation,
        p.employer,
        p.insurance_provider,
        p.insurance_number,
        p.insurance_group_number,
        p.insurance_type,
        p.insurance_expiry_date,
        p.preferred_language,
        p.preferred_doctor_gender,
        p.preferred_appointment_time,
        p.communication_preferences,
        p.referral_source,
        p.profile_picture_url,
        p.consent_to_telehealth,
        p.consent_to_data_sharing,
        p.is_profile_complete,
        p.created_at,
        p.updated_at,
        u.email
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
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
        bloodType: patient.blood_type,
        height: patient.height,
        weight: patient.weight,
        maritalStatus: patient.marital_status,
        occupation: patient.occupation,
        employer: patient.employer,
        insuranceProvider: patient.insurance_provider,
        insuranceNumber: patient.insurance_number,
        insuranceGroupNumber: patient.insurance_group_number,
        insuranceType: patient.insurance_type,
        insuranceExpiryDate: patient.insurance_expiry_date,
        preferredLanguage: patient.preferred_language,
        preferredDoctorGender: patient.preferred_doctor_gender,
        preferredAppointmentTime: patient.preferred_appointment_time,
        communicationPreferences: patient.communication_preferences || [],
        referralSource: patient.referral_source,
        profilePictureUrl: patient.profile_picture_url,
        consentToTelehealth: patient.consent_to_telehealth,
        consentToDataSharing: patient.consent_to_data_sharing,
        isProfileComplete: patient.is_profile_complete,
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
router.put('/:id', authenticateToken, validatePatientProfile, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = {
      'firstName': 'first_name',
      'lastName': 'last_name',
      'phone': 'phone',
      'dateOfBirth': 'date_of_birth',
      'gender': 'gender',
      'address': 'address',
      'emergencyContact': 'emergency_contact',
      'medicalHistory': 'medical_history',
      'allergies': 'allergies',
      'currentMedications': 'current_medications',
      'bloodType': 'blood_type',
      'height': 'height',
      'weight': 'weight',
      'maritalStatus': 'marital_status',
      'occupation': 'occupation',
      'employer': 'employer',
      'insuranceProvider': 'insurance_provider',
      'insuranceNumber': 'insurance_number',
      'insuranceGroupNumber': 'insurance_group_number',
      'insuranceType': 'insurance_type',
      'insuranceExpiryDate': 'insurance_expiry_date',
      'preferredLanguage': 'preferred_language',
      'preferredDoctorGender': 'preferred_doctor_gender',
      'preferredAppointmentTime': 'preferred_appointment_time',
      'communicationPreferences': 'communication_preferences',
      'referralSource': 'referral_source',
      'profilePictureUrl': 'profile_picture_url',
      'consentToTelehealth': 'consent_to_telehealth',
      'consentToDataSharing': 'consent_to_data_sharing'
    };

    for (const [frontendField, dbField] of Object.entries(allowedFields)) {
      if (updateData[frontendField] !== undefined) {
        updateFields.push(`${dbField} = $${paramCount}`);
        if (dbField === 'address' || dbField === 'emergency_contact') {
          values.push(JSON.stringify(updateData[frontendField]));
        } else if (dbField === 'allergies' || dbField === 'current_medications' || dbField === 'medical_history') {
          // Handle array fields - convert empty string to empty array
          const value = updateData[frontendField];
          if (value === '' || value === null || value === undefined) {
            values.push([]);
          } else if (Array.isArray(value)) {
            values.push(value);
          } else {
            values.push([value]);
          }
        } else {
          values.push(updateData[frontendField]);
        }
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Check if profile is complete
    const requiredFields = ['first_name', 'last_name', 'phone', 'date_of_birth', 'gender', 'address'];
    const isComplete = requiredFields.every(field => {
      const frontendField = Object.keys(allowedFields).find(key => allowedFields[key] === field);
      const value = updateData[frontendField];
      return value !== undefined && value !== null && value.toString().trim() !== '';
    });

    if (isComplete) {
      updateFields.push(`is_profile_complete = true`);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const queryText = `
      UPDATE patients 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;
    values.push(id);

    const result = await query(queryText, values);

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

// Complete patient profile (for profile completion flow)
router.post('/:id/complete-profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const profileData = req.body;

    const result = await query(`
      UPDATE patients 
      SET 
        address = $2,
        emergency_contact = $3,
        medical_history = $4,
        allergies = $5,
        current_medications = $6,
        blood_type = $7,
        height = $8,
        weight = $9,
        marital_status = $10,
        occupation = $11,
        employer = $12,
        insurance_provider = $13,
        insurance_number = $14,
        insurance_group_number = $15,
        insurance_type = $16,
        insurance_expiry_date = $17,
        preferred_language = $18,
        preferred_doctor_gender = $19,
        preferred_appointment_time = $20,
        communication_preferences = $21,
        referral_source = $22,
        consent_to_telehealth = $23,
        consent_to_data_sharing = $24,
        is_profile_complete = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [
      id,
      JSON.stringify(profileData.address),
      JSON.stringify(profileData.emergencyContact),
      profileData.medicalHistory,
      profileData.allergies,
      profileData.currentMedications,
      profileData.bloodType,
      profileData.height,
      profileData.weight,
      profileData.maritalStatus,
      profileData.occupation,
      profileData.employer,
      profileData.insuranceProvider,
      profileData.insuranceNumber,
      profileData.insuranceGroupNumber,
      profileData.insuranceType,
      profileData.insuranceExpiryDate,
      profileData.preferredLanguage,
      profileData.preferredDoctorGender,
      profileData.preferredAppointmentTime,
      profileData.communicationPreferences,
      profileData.referralSource,
      profileData.consentToTelehealth,
      profileData.consentToDataSharing
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile completed successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error completing profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get patient appointments with pagination
router.get('/:id/appointments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    // Get patient_id from user_id
    const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [id]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    const patientId = patientResult.rows[0].id;
    
    let whereClause = 'WHERE a.patient_id = $1';
    let queryParams = [patientId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM appointments a 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.type,
        a.status,
        a.notes,
        a.meeting_link,
        a.payment_status,
        a.amount,
        a.created_at,
        a.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty,
        d.profile_image_url as doctor_image
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      ${whereClause}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const appointments = dataResult.rows.map(row => ({
      id: row.id,
      patientId: id,
      doctorId: row.doctor_id,
      doctorName: `${row.doctor_first_name} ${row.doctor_last_name}`,
      doctorImage: row.doctor_image,
      specialty: row.specialty,
      date: row.appointment_date,
      time: row.appointment_time,
      type: row.type,
      status: row.status,
      notes: row.notes,
      meetingLink: row.meeting_link,
      paymentStatus: row.payment_status,
      amount: row.amount,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
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
        a.payment_status,
        a.amount,
        a.created_at,
        a.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty,
        d.profile_image_url as doctor_image
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = $1 
        AND a.appointment_date >= CURRENT_DATE
        AND a.status IN ('scheduled', 'confirmed')
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `, [id]);

    const appointments = result.rows.map(row => ({
      id: row.id,
      patientId: id,
      doctorId: row.doctor_id,
      doctorName: `${row.doctor_first_name} ${row.doctor_last_name}`,
      doctorImage: row.doctor_image,
      specialty: row.specialty,
      date: row.appointment_date,
      time: row.appointment_time,
      type: row.type,
      status: row.status,
      notes: row.notes,
      meetingLink: row.meeting_link,
      paymentStatus: row.payment_status,
      amount: row.amount,
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
    const { status } = req.query;
    
    // Get patient_id from user_id
    const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [id]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    const patientId = patientResult.rows[0].id;
    
    let whereClause = 'WHERE m.patient_id = $1';
    let queryParams = [patientId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND m.status = $${paramCount}`;
      queryParams.push(status);
    }
    
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
        m.side_effects,
        m.created_at,
        m.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM medications m
      LEFT JOIN doctors d ON m.prescribed_by = d.id
      ${whereClause}
      ORDER BY m.created_at DESC
    `, queryParams);

    const medications = result.rows.map(row => ({
      id: row.id,
      patientId: id,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      instructions: row.instructions,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      sideEffects: row.side_effects || [],
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
        m.side_effects,
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
      patientId: id,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      instructions: row.instructions,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      sideEffects: row.side_effects || [],
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
    const { status } = req.query;
    
    // Get patient_id from user_id
    const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [id]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    const patientId = patientResult.rows[0].id;
    
    let whereClause = 'WHERE lt.patient_id = $1';
    let queryParams = [patientId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND lt.status = $${paramCount}`;
      queryParams.push(status);
    }
    
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
      ${whereClause}
      ORDER BY lt.test_date DESC, lt.test_time DESC
    `, queryParams);

    const labTests = result.rows.map(row => ({
      id: row.id,
      patientId: id,
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
    `, [id]);

    const labTests = result.rows.map(row => ({
      id: row.id,
      patientId: id,
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

// Get patient health records
router.get('/:id/health-records', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;
    
    // Check if id is a patient_id or user_id
    let patientId = id;
    
    // First try to find as patient_id
    const patientResult = await query('SELECT id FROM patients WHERE id = $1', [id]);
    if (patientResult.rows.length === 0) {
      // If not found as patient_id, try as user_id
      const userResult = await query('SELECT id FROM patients WHERE user_id = $1', [id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }
      patientId = userResult.rows[0].id;
    }
    
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
      SELECT 
        hr.id,
        hr.type,
        hr.title,
        hr.description,
        hr.record_date,
        hr.attachments,
        hr.created_at,
        hr.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        h.name as hospital_name
      FROM health_records hr
      LEFT JOIN doctors d ON hr.doctor_id = d.id
      LEFT JOIN hospitals h ON hr.hospital_id = h.id
      ${whereClause}
      ORDER BY hr.record_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const healthRecords = dataResult.rows.map(row => ({
      id: row.id,
      patientId: id,
      type: row.type,
      title: row.title,
      description: row.description,
      recordDate: row.record_date,
      attachments: row.attachments || [],
      doctor: row.doctor_first_name && row.doctor_last_name 
        ? `${row.doctor_first_name} ${row.doctor_last_name}` 
        : null,
      hospital: row.hospital_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: healthRecords,
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
      message: 'Internal server error'
    });
  }
});

// Get recent health records
router.get('/:id/health-records/recent', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is a patient_id or user_id
    let patientId = id;
    
    // First try to find as patient_id
    const patientResult = await query('SELECT id FROM patients WHERE id = $1', [id]);
    if (patientResult.rows.length === 0) {
      // If not found as patient_id, try as user_id
      const userResult = await query('SELECT id FROM patients WHERE user_id = $1', [id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }
      patientId = userResult.rows[0].id;
    }
    
    const result = await query(`
      SELECT 
        hr.id,
        hr.type,
        hr.title,
        hr.description,
        hr.record_date,
        hr.attachments,
        hr.created_at,
        hr.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        h.name as hospital_name
      FROM health_records hr
      LEFT JOIN doctors d ON hr.doctor_id = d.id
      LEFT JOIN hospitals h ON hr.hospital_id = h.id
      WHERE hr.patient_id = $1 
        AND hr.record_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY hr.record_date DESC
      LIMIT 10
    `, [patientId]);

    const healthRecords = result.rows.map(row => ({
      id: row.id,
      patientId: id,
      type: row.type,
      title: row.title,
      description: row.description,
      recordDate: row.record_date,
      attachments: row.attachments || [],
      doctor: row.doctor_first_name && row.doctor_last_name 
        ? `${row.doctor_first_name} ${row.doctor_last_name}` 
        : null,
      hospital: row.hospital_name,
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

// Get patient prescriptions
router.get('/:id/prescriptions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    
    // Get patient_id from user_id
    const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [id]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    const patientId = patientResult.rows[0].id;
    
    let whereClause = 'WHERE p.patient_id = $1';
    let queryParams = [patientId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND p.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    const result = await query(`
      SELECT 
        p.id,
        p.prescription_date,
        p.status,
        p.notes,
        p.follow_up_date,
        p.created_at,
        p.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      ${whereClause}
      ORDER BY p.prescription_date DESC
    `, queryParams);

    const prescriptions = result.rows.map(row => ({
      id: row.id,
      patientId: id,
      prescriptionDate: row.prescription_date,
      status: row.status,
      notes: row.notes,
      followUpDate: row.follow_up_date,
      prescribedBy: row.doctor_first_name && row.doctor_last_name 
        ? `${row.doctor_first_name} ${row.doctor_last_name}` 
        : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: prescriptions
    });

  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get patient notifications
router.get('/:id/notifications', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'unread' } = req.query;
    
    // Get user_id from patient
    const userResult = await query('SELECT user_id FROM patients WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const userId = userResult.rows[0].user_id;
    
    let whereClause = 'WHERE n.user_id = $1';
    let queryParams = [userId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND n.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    const result = await query(`
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.status,
        n.read_at,
        n.created_at
      FROM notifications n
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT 50
    `, queryParams);

    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data,
      status: row.status,
      readAt: row.read_at,
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
