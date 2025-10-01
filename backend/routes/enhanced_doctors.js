const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateDoctorProfile } = require('../middleware/enhanced_validation');

const router = express.Router();

// Helper function to check if doctor is currently available
async function checkDoctorCurrentAvailability(doctor) {
  try {
    // If doctor has disabled availability, return false
    if (!doctor.isAvailable) {
      return false;
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Check if current day is in working days
    if (!doctor.workingDays || !doctor.workingDays.includes(currentDay)) {
      return false;
    }

    // Check if current time is within working hours
    if (doctor.workingHours && doctor.workingHours.start && doctor.workingHours.end) {
      const startTime = doctor.workingHours.start;
      const endTime = doctor.workingHours.end;
      
      if (currentTime < startTime || currentTime > endTime) {
        return false;
      }
    }

    // Check if doctor has any appointments at current time
    const appointmentResult = await query(`
      SELECT COUNT(*) as count
      FROM appointments 
      WHERE doctor_id = $1 
        AND appointment_date = CURRENT_DATE 
        AND appointment_time BETWEEN $2 AND $3
        AND status IN ('scheduled', 'confirmed')
    `, [doctor.id, currentTime, currentTime]);

    const hasAppointment = parseInt(appointmentResult.rows[0].count) > 0;
    
    return !hasAppointment;
  } catch (error) {
    console.error('Error checking doctor availability:', error);
    return false;
  }
}

// Get doctor profile with complete information
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get doctor details with user information
    const doctorResult = await query(`
      SELECT 
        d.id,
        d.first_name,
        d.last_name,
        d.phone,
        d.specialty,
        d.license_number,
        d.medical_school,
        d.graduation_year,
        d.hospital_affiliation,
        d.practice_address,
        d.city,
        d.consultation_fee,
        d.bio,
        d.languages,
        d.experience_years,
        d.profile_image_url,
        d.is_verified,
        d.verification_documents,
        d.board_certification,
        d.board_certification_document,
        d.is_profile_complete,
        d.is_available,
        d.created_at,
        d.updated_at,
        u.email
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = $1
    `, [id]);

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const doctor = doctorResult.rows[0];

    res.json({
      success: true,
      data: {
        id: doctor.id,
        firstName: doctor.first_name,
        lastName: doctor.last_name,
        email: doctor.email,
        phone: doctor.phone,
        specialty: doctor.specialty,
        licenseNumber: doctor.license_number,
        medicalSchool: doctor.medical_school,
        graduationYear: doctor.graduation_year,
        hospitalAffiliation: doctor.hospital_affiliation,
        practiceAddress: doctor.practice_address,
        city: doctor.city,
        consultationFee: doctor.consultation_fee,
        bio: doctor.bio,
        languages: doctor.languages || [],
        experienceYears: doctor.experience_years,
        profileImageUrl: doctor.profile_image_url,
        isVerified: doctor.is_verified,
        verificationDocuments: doctor.verification_documents || [],
        boardCertification: doctor.board_certification,
        boardCertificationDocument: doctor.board_certification_document,
        isProfileComplete: doctor.is_profile_complete,
        isAvailable: doctor.is_available,
        createdAt: doctor.created_at,
        updatedAt: doctor.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update doctor profile
router.put('/:id', authenticateToken, validateDoctorProfile, async (req, res) => {
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
      'specialty': 'specialty',
      'licenseNumber': 'license_number',
      'medicalSchool': 'medical_school',
      'graduationYear': 'graduation_year',
      'hospitalAffiliation': 'hospital_affiliation',
      'practiceAddress': 'practice_address',
      'city': 'city',
      'consultationFee': 'consultation_fee',
      'bio': 'bio',
      'languages': 'languages',
      'experienceYears': 'experience_years',
      'profileImageUrl': 'profile_image_url',
      'verificationDocuments': 'verification_documents',
      'boardCertification': 'board_certification',
      'boardCertificationDocument': 'board_certification_document',
      'isAvailable': 'is_available'
    };

    for (const [frontendField, dbField] of Object.entries(allowedFields)) {
      if (updateData[frontendField] !== undefined) {
        updateFields.push(`${dbField} = $${paramCount}`);
        if (dbField === 'practice_address' || dbField === 'verification_documents') {
          values.push(JSON.stringify(updateData[frontendField]));
        } else if (dbField === 'languages') {
          // Handle languages as PostgreSQL array format
          values.push(`{${updateData[frontendField].map(lang => `"${lang}"`).join(',')}}`);
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
    const requiredFields = ['first_name', 'last_name', 'phone', 'specialty', 'license_number', 'practice_address'];
    const isComplete = requiredFields.every(field => {
      const frontendField = Object.keys(allowedFields).find(key => allowedFields[key] === field);
      return updateData[frontendField] !== undefined || 
             (updateData[frontendField] === undefined && req.body[frontendField] !== null);
    });

    if (isComplete) {
      updateFields.push(`is_profile_complete = true`);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const queryText = `
      UPDATE doctors 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    values.push(id);

    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Complete doctor profile (for profile completion flow)
router.post('/:id/complete-profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const profileData = req.body;

    const result = await query(`
      UPDATE doctors 
      SET 
        medical_school = $2,
        graduation_year = $3,
        hospital_affiliation = $4,
        practice_address = $5,
        city = $6,
        consultation_fee = $7,
        bio = $8,
        languages = $9,
        experience_years = $10,
        verification_documents = $11,
        board_certification = $12,
        board_certification_document = $13,
        is_profile_complete = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [
      id,
      profileData.medicalSchool,
      profileData.graduationYear,
      profileData.hospitalAffiliation,
      JSON.stringify(profileData.practiceAddress),
      profileData.city,
      profileData.consultationFee,
      profileData.bio,
      profileData.languages,
      profileData.experienceYears,
      JSON.stringify(profileData.verificationDocuments),
      profileData.boardCertification,
      profileData.boardCertificationDocument
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
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

// Get doctor appointments
router.get('/:id/appointments', authenticateToken, async (req, res) => {
  try {
      const { id } = req.params;
    const { page = 1, limit = 10, status, date } = req.query;
    const offset = (page - 1) * limit;
    
    // Ensure we use the doctor's profile ID
    const doctorProfileResult = await query('SELECT id FROM doctors WHERE user_id = $1 OR id = $1', [id]);
    if (doctorProfileResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctorProfileId = doctorProfileResult.rows[0].id;

    let whereClause = 'WHERE a.doctor_id = $1';
    let queryParams = [doctorProfileId];
    let paramCount = 2;
    
    if (status) {
      // Handle multiple statuses for 'upcoming' appointments
      if (status === 'upcoming') {
        whereClause += ` AND a.status IN ($${paramCount}, $${paramCount + 1})`;
        queryParams.push('scheduled', 'confirmed');
        paramCount += 2;
      } else {
        whereClause += ` AND a.status = $${paramCount}`;
        queryParams.push(status);
        paramCount++;
      }
    }
    
    if (date) {
      whereClause += ` AND a.appointment_date >= $${paramCount}`;
      queryParams.push(date);
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
        a.patient_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.profile_picture_url as patient_image
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      ${whereClause}
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, [doctorProfileId, ...queryParams.slice(1)]),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const appointments = dataResult.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      doctorId: id,
      patientName: `${row.patient_first_name} ${row.patient_last_name}`,
      patientPhone: row.patient_phone,
      patientImage: row.patient_image,
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
      data: {
        appointments: appointments,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get doctor's patients
router.get('/:id/patients', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE a.doctor_id = $1';
    let queryParams = [id];
    let paramCount = 1;
    
    if (search) {
      whereClause += ` AND (p.first_name ILIKE $${paramCount + 1} OR p.last_name ILIKE $${paramCount + 1} OR p.phone ILIKE $${paramCount + 1})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }
    
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) 
      FROM patients p
      JOIN appointments a ON p.id = a.patient_id
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT DISTINCT
        p.id,
        p.first_name,
        p.last_name,
        p.phone,
        p.date_of_birth,
        p.gender,
        p.profile_picture_url,
        p.created_at,
        MAX(a.appointment_date) as last_appointment_date,
        COUNT(a.id) as total_appointments
      FROM patients p
      JOIN appointments a ON p.id = a.patient_id
      ${whereClause}
      GROUP BY p.id, p.first_name, p.last_name, p.phone, p.date_of_birth, p.gender, p.profile_picture_url, p.created_at
      ORDER BY last_appointment_date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const patients = dataResult.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      profilePictureUrl: row.profile_picture_url,
      lastAppointmentDate: row.last_appointment_date,
      totalAppointments: parseInt(row.total_appointments),
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      data: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get doctor earnings
router.get('/:id/earnings', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND de.earned_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND de.earned_date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND de.earned_date >= CURRENT_DATE - INTERVAL '365 days'";
        break;
    }
    
    // Get earnings summary
    const summaryResult = await query(`
      SELECT 
        COALESCE(SUM(de.amount), 0) as total_earnings,
        COALESCE(SUM(de.net_amount), 0) as net_earnings,
        COUNT(de.id) as total_appointments,
        COALESCE(AVG(de.amount), 0) as average_earning_per_appointment
      FROM doctor_earnings de
      WHERE de.doctor_id = $1 ${dateFilter}
    `, [id]);
    
    // Get recent earnings
    const recentEarningsResult = await query(`
      SELECT 
        de.id,
        de.amount,
        de.net_amount,
        de.status,
        de.earned_date,
        de.created_at,
        a.appointment_date,
        a.appointment_time,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name
      FROM doctor_earnings de
      JOIN appointments a ON de.appointment_id = a.id
      JOIN patients p ON a.patient_id = p.id
      WHERE de.doctor_id = $1 ${dateFilter}
      ORDER BY de.earned_date DESC
      LIMIT 10
    `, [id]);
    
    const summary = summaryResult.rows[0];
    const recentEarnings = recentEarningsResult.rows.map(row => ({
      id: row.id,
      amount: parseFloat(row.amount),
      netAmount: parseFloat(row.net_amount),
      status: row.status,
      earnedDate: row.earned_date,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      patientName: `${row.patient_first_name} ${row.patient_last_name}`,
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalEarnings: parseFloat(summary.total_earnings),
          netEarnings: parseFloat(summary.net_earnings),
          totalAppointments: parseInt(summary.total_appointments),
          averageEarningPerAppointment: parseFloat(summary.average_earning_per_appointment)
        },
        recentEarnings
      }
    });

  } catch (error) {
    console.error('Error fetching doctor earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get doctor's prescriptions
router.get('/:id/prescriptions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE p.doctor_id = $1';
    let queryParams = [id];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      whereClause += ` AND p.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM prescriptions p 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        p.id,
        p.patient_id,
        p.prescription_date,
        p.status,
        p.notes,
        p.follow_up_date,
        p.created_at,
        p.updated_at,
        pt.first_name as patient_first_name,
        pt.last_name as patient_last_name,
        pt.phone as patient_phone
      FROM prescriptions p
      JOIN patients pt ON p.patient_id = pt.id
      ${whereClause}
      ORDER BY p.prescription_date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const prescriptions = dataResult.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      doctorId: id,
      patientName: `${row.patient_first_name} ${row.patient_last_name}`,
      patientPhone: row.patient_phone,
      prescriptionDate: row.prescription_date,
      status: row.status,
      notes: row.notes,
      followUpDate: row.follow_up_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get doctor's lab tests
router.get('/:id/lab-tests', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE lt.ordered_by = $1';
    let queryParams = [id];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
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
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const labTests = dataResult.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      doctorId: id,
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

// Get doctor's medical records
router.get('/:id/medical-records', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE hr.doctor_id = $1';
    let queryParams = [id];
    let paramCount = 1;
    
    if (type) {
      paramCount++;
      whereClause += ` AND hr.type = $${paramCount}`;
      queryParams.push(type);
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
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone
      FROM health_records hr
      JOIN patients p ON hr.patient_id = p.id
      ${whereClause}
      ORDER BY hr.record_date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const medicalRecords = dataResult.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      doctorId: id,
      patientName: `${row.patient_first_name} ${row.patient_last_name}`,
      patientPhone: row.patient_phone,
      type: row.type,
      title: row.title,
      description: row.description,
      recordDate: row.record_date,
      attachments: row.attachments || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: medicalRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching doctor medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all doctors (for patient search) with availability filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { specialty, search, page = 1, limit = 10, checkAvailability = 'true' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE d.is_verified = true AND d.is_profile_complete = true';
    let queryParams = [];
    let paramCount = 1;
    
    if (specialty) {
      whereClause += ` AND d.specialty = $${paramCount}`;
      queryParams.push(specialty);
      paramCount++;
    }
    
    if (search) {
      whereClause += ` AND (d.first_name ILIKE $${paramCount} OR d.last_name ILIKE $${paramCount} OR d.specialty ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }
    
    // Add availability filtering if requested
    if (checkAvailability === 'true') {
      whereClause += ` AND d.is_available = true`;
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM doctors d 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        d.id,
        d.first_name,
        d.last_name,
        d.specialty,
        d.consultation_fee,
        d.bio,
        d.languages,
        d.experience_years,
        d.profile_image_url,
        d.is_verified,
        d.is_available,
        d.city,
        d.hospital_affiliation,
        d.working_days,
        d.working_hours,
        d.emergency_availability,
        d.timezone,
        0 as average_rating,
        0 as total_reviews
      FROM doctors d
      ${whereClause}
      GROUP BY d.id, d.first_name, d.last_name, d.specialty, d.consultation_fee, 
               d.bio, d.languages, d.experience_years, d.profile_image_url, 
               d.is_verified, d.is_available, d.city, d.hospital_affiliation,
               d.working_days, d.working_hours, d.emergency_availability, d.timezone
      ORDER BY d.is_verified DESC, d.is_available DESC, average_rating DESC NULLS LAST
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    // Process doctors and check real-time availability
    const doctors = await Promise.all(dataResult.rows.map(async (row) => {
      const doctor = {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        specialty: row.specialty,
        consultationFee: parseFloat(row.consultation_fee || 0),
        bio: row.bio,
        languages: row.languages || [],
        experienceYears: row.experience_years,
        profileImageUrl: row.profile_image_url,
        isVerified: row.is_verified,
        isAvailable: row.is_available,
        city: row.city,
        hospitalAffiliation: row.hospital_affiliation,
        averageRating: parseFloat(row.average_rating || 0),
        totalReviews: parseInt(row.total_reviews || 0),
        workingDays: row.working_days || [],
        workingHours: row.working_hours || {},
        emergencyAvailability: row.emergency_availability,
        timezone: row.timezone || 'UTC'
      };

      // Check real-time availability if requested
      if (checkAvailability === 'true') {
        doctor.isCurrentlyAvailable = await checkDoctorCurrentAvailability(doctor);
      }

      return doctor;
    }));

    res.json({
      success: true,
      data: doctors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get doctor availability
router.get('/:id/availability', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }
    
    // Get doctor's working schedule
    const doctorResult = await query(`
      SELECT working_days, working_hours, is_available
      FROM doctors
      WHERE id = $1
    `, [id]);
    
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    const doctor = doctorResult.rows[0];
    
    // Check if doctor is available
    if (!doctor.is_available) {
      return res.json({
        success: true,
        data: {
          date,
          availableSlots: [],
          bookedTimes: [],
          message: 'Doctor is not available for appointments'
        }
      });
    }
    
    // Check if the requested date is a working day
    const requestedDateObj = new Date(date);
    const dayName = requestedDateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    if (doctor.working_days && doctor.working_days.length > 0 && !doctor.working_days.includes(dayName)) {
      return res.json({
        success: true,
        data: {
          date,
          availableSlots: [],
          bookedTimes: [],
          message: 'Doctor is not available on this day'
        }
      });
    }
    
    // Get existing appointments for the date
    const appointmentsResult = await query(`
      SELECT appointment_time
      FROM appointments
      WHERE doctor_id = $1 
        AND appointment_date = $2 
        AND status IN ('scheduled', 'confirmed')
    `, [id, date]);
    
    const bookedTimes = appointmentsResult.rows.map(row => row.appointment_time);
    
    // Generate available time slots based on doctor's working hours
    const availableSlots = [];
    const now = new Date();
    const requestedDate = new Date(date);
    
    // Use doctor's working hours if available, otherwise default to 9 AM - 5 PM
    let startHour = 9;
    let endHour = 17;
    
    if (doctor.working_hours && doctor.working_hours.start && doctor.working_hours.end) {
      const startTime = doctor.working_hours.start;
      const endTime = doctor.working_hours.end;
      
      // Parse working hours (format: "HH:MM")
      const [startHourStr, startMinStr] = startTime.split(':');
      const [endHourStr, endMinStr] = endTime.split(':');
      
      startHour = parseInt(startHourStr);
      endHour = parseInt(endHourStr);
    }
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        
        // Create a date object for this time slot
        const slotDate = new Date(requestedDate);
        slotDate.setHours(hour, minute, 0, 0);
        
        // Only include slots that are in the future and not booked
        if (slotDate > now && !bookedTimes.includes(timeString)) {
          availableSlots.push(timeString);
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        date,
        availableSlots,
        bookedTimes
      }
    });

  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get doctor availability settings
router.get('/:id/availability-settings', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        availability_schedule,
        working_days,
        working_hours,
        break_times,
        appointment_duration,
        max_appointments_per_day,
        advance_booking_days,
        emergency_availability,
        timezone,
        is_available
      FROM doctors 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    const availability = result.rows[0];
    
    res.json({
      success: true,
      data: {
        availabilitySchedule: availability.availability_schedule,
        workingDays: availability.working_days,
        workingHours: availability.working_hours,
        breakTimes: availability.break_times,
        appointmentDuration: availability.appointment_duration,
        maxAppointmentsPerDay: availability.max_appointments_per_day,
        advanceBookingDays: availability.advance_booking_days,
        emergencyAvailability: availability.emergency_availability,
        timezone: availability.timezone,
        isAvailable: availability.is_available
      }
    });
    
  } catch (error) {
    console.error('Error fetching doctor availability settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update doctor availability settings
router.patch('/:id/availability-settings', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      availabilitySchedule,
      workingDays,
      workingHours,
      breakTimes,
      appointmentDuration,
      maxAppointmentsPerDay,
      advanceBookingDays,
      emergencyAvailability,
      timezone,
      isAvailable
    } = req.body;
    
    // Validate input
    if (appointmentDuration && (appointmentDuration < 15 || appointmentDuration > 120)) {
      return res.status(400).json({
        success: false,
        message: 'Appointment duration must be between 15 and 120 minutes'
      });
    }
    
    if (maxAppointmentsPerDay && (maxAppointmentsPerDay < 1 || maxAppointmentsPerDay > 50)) {
      return res.status(400).json({
        success: false,
        message: 'Max appointments per day must be between 1 and 50'
      });
    }
    
    if (advanceBookingDays && (advanceBookingDays < 1 || advanceBookingDays > 365)) {
      return res.status(400).json({
        success: false,
        message: 'Advance booking days must be between 1 and 365'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (availabilitySchedule !== undefined) {
      updates.push(`availability_schedule = $${paramCount}`);
      values.push(JSON.stringify(availabilitySchedule));
      paramCount++;
    }
    
    if (workingDays !== undefined) {
      updates.push(`working_days = $${paramCount}`);
      values.push(workingDays);
      paramCount++;
    }
    
    if (workingHours !== undefined) {
      updates.push(`working_hours = $${paramCount}`);
      values.push(JSON.stringify(workingHours));
      paramCount++;
    }
    
    if (breakTimes !== undefined) {
      updates.push(`break_times = $${paramCount}`);
      values.push(JSON.stringify(breakTimes));
      paramCount++;
    }
    
    if (appointmentDuration !== undefined) {
      updates.push(`appointment_duration = $${paramCount}`);
      values.push(appointmentDuration);
      paramCount++;
    }
    
    if (maxAppointmentsPerDay !== undefined) {
      updates.push(`max_appointments_per_day = $${paramCount}`);
      values.push(maxAppointmentsPerDay);
      paramCount++;
    }
    
    if (advanceBookingDays !== undefined) {
      updates.push(`advance_booking_days = $${paramCount}`);
      values.push(advanceBookingDays);
      paramCount++;
    }
    
    if (emergencyAvailability !== undefined) {
      updates.push(`emergency_availability = $${paramCount}`);
      values.push(emergencyAvailability);
      paramCount++;
    }
    
    if (timezone !== undefined) {
      updates.push(`timezone = $${paramCount}`);
      values.push(timezone);
      paramCount++;
    }
    
    if (isAvailable !== undefined) {
      updates.push(`is_available = $${paramCount}`);
      values.push(isAvailable);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(id);
    
    const queryText = `
      UPDATE doctors 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await query(queryText, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Availability settings updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating doctor availability settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle doctor availability (quick on/off)
router.patch('/:id/toggle-availability', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable must be a boolean value'
      });
    }
    
    const result = await query(`
      UPDATE doctors 
      SET is_available = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, first_name, last_name, is_available
    `, [isAvailable, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    res.json({
      success: true,
      message: `Doctor availability ${isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error toggling doctor availability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get doctor statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure we use the doctor's profile ID
    const doctorProfileResult = await query('SELECT id FROM doctors WHERE user_id = $1 OR id = $1', [id]);
    if (doctorProfileResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctorProfileId = doctorProfileResult.rows[0].id;

    // Get total appointments
    const totalAppointmentsResult = await query(`
      SELECT COUNT(*) as total
      FROM appointments 
      WHERE doctor_id = $1
    `, [doctorProfileId]);

    // Get completed appointments
    const completedAppointmentsResult = await query(`
      SELECT COUNT(*) as completed
      FROM appointments 
      WHERE doctor_id = $1 AND status = 'completed'
    `, [doctorProfileId]);

    // Get pending appointments
    const pendingAppointmentsResult = await query(`
      SELECT COUNT(*) as pending
      FROM appointments 
      WHERE doctor_id = $1 AND status IN ('scheduled', 'confirmed')
    `, [doctorProfileId]);

    // Get today's appointments
    const todayAppointmentsResult = await query(`
      SELECT COUNT(*) as today
      FROM appointments 
      WHERE doctor_id = $1 AND appointment_date = CURRENT_DATE
    `, [doctorProfileId]);

    // Get this month's appointments
    const monthAppointmentsResult = await query(`
      SELECT COUNT(*) as this_month
      FROM appointments 
      WHERE doctor_id = $1 
        AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND appointment_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    `, [doctorProfileId]);

    // Get total earnings
    const totalEarningsResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total_earnings
      FROM doctor_earnings 
      WHERE doctor_id = $1
    `, [doctorProfileId]);

    // Get this month's earnings
    const monthEarningsResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as month_earnings
      FROM doctor_earnings 
      WHERE doctor_id = $1 
        AND earned_date >= DATE_TRUNC('month', CURRENT_DATE)
    `, [doctorProfileId]);

    // Get total distinct patients seen by this doctor
    const totalPatientsResult = await query(`
      SELECT COUNT(DISTINCT patient_id) AS total_patients
      FROM appointments
      WHERE doctor_id = $1
    `, [doctorProfileId]);

    const stats = {
      totalAppointments: parseInt(totalAppointmentsResult.rows[0].total),
      completedAppointments: parseInt(completedAppointmentsResult.rows[0].completed),
      pendingAppointments: parseInt(pendingAppointmentsResult.rows[0].pending),
      todayAppointments: parseInt(todayAppointmentsResult.rows[0].today),
      thisMonthAppointments: parseInt(monthAppointmentsResult.rows[0].this_month),
      totalEarnings: parseFloat(totalEarningsResult.rows[0].total_earnings),
      thisMonthEarnings: parseFloat(monthEarningsResult.rows[0].month_earnings),
      totalPatients: parseInt(totalPatientsResult.rows[0].total_patients)
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
