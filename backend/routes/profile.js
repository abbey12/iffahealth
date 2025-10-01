const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get current user profile (works for both patients and doctors)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Get user details
    const userResult = await query(
      'SELECT id, email, role, is_active, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    let profile = null;

    // Get role-specific profile data
    if (userRole === 'patient') {
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
          p.updated_at
        FROM patients p
        WHERE p.user_id = $1
      `, [userId]);

      if (patientResult.rows.length > 0) {
        const patient = patientResult.rows[0];
        profile = {
          id: patient.id,
          firstName: patient.first_name,
          lastName: patient.last_name,
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
        };
      }
    } else if (userRole === 'doctor') {
      const doctorResult = await query(`
        SELECT 
          d.id,
          d.first_name,
          d.last_name,
          d.specialty,
          d.license_number,
          d.phone,
          d.experience_years,
          d.education,
          d.bio,
          d.created_at,
          d.updated_at
        FROM doctors d
        WHERE d.user_id = $1
      `, [userId]);

      if (doctorResult.rows.length > 0) {
        const doctor = doctorResult.rows[0];
        profile = {
          id: doctor.id,
          firstName: doctor.first_name,
          lastName: doctor.last_name,
          specialty: doctor.specialty,
          licenseNumber: doctor.license_number,
          phone: doctor.phone,
          experienceYears: doctor.experience_years,
          education: doctor.education,
          bio: doctor.bio,
          createdAt: doctor.created_at,
          updatedAt: doctor.updated_at
        };
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at
        },
        profile
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update current user profile
router.put('/', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('address').optional().trim().isLength({ min: 10 }).withMessage('Address must be at least 10 characters'),
  body('emergencyContact').optional().trim().isLength({ min: 2 }).withMessage('Emergency contact must be at least 2 characters'),
  body('medicalHistory').optional().isArray().withMessage('Medical history must be an array'),
  body('allergies').optional().isArray().withMessage('Allergies must be an array'),
  body('currentMedications').optional().isArray().withMessage('Current medications must be an array'),
  // Doctor-specific fields
  body('specialty').optional().trim().isLength({ min: 2 }).withMessage('Specialty must be at least 2 characters'),
  body('licenseNumber').optional().trim().isLength({ min: 5 }).withMessage('License number must be at least 5 characters'),
  body('experienceYears').optional().isInt({ min: 0 }).withMessage('Experience years must be a positive integer'),
  body('education').optional().trim().isLength({ min: 5 }).withMessage('Education must be at least 5 characters'),
  body('bio').optional().trim().isLength({ min: 10 }).withMessage('Bio must be at least 10 characters')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const userRole = req.user.role;
    const {
      firstName,
      lastName,
      phone,
      address,
      emergencyContact,
      medicalHistory,
      allergies,
      currentMedications,
      // Doctor-specific fields
      specialty,
      licenseNumber,
      experienceYears,
      education,
      bio
    } = req.body;

    let result;

    if (userRole === 'patient') {
      // Update patient profile
      result = await query(`
        UPDATE patients 
        SET 
          first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          phone = COALESCE($4, phone),
          address = COALESCE($5, address),
          emergency_contact = COALESCE($6, emergency_contact),
          medical_history = COALESCE($7, medical_history),
          allergies = COALESCE($8, allergies),
          current_medications = COALESCE($9, current_medications),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `, [
        userId,
        firstName,
        lastName,
        phone,
        address,
        emergencyContact,
        medicalHistory ? JSON.stringify(medicalHistory) : null,
        allergies ? JSON.stringify(allergies) : null,
        currentMedications ? JSON.stringify(currentMedications) : null
      ]);
    } else if (userRole === 'doctor') {
      // Update doctor profile
      result = await query(`
        UPDATE doctors 
        SET 
          first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          phone = COALESCE($4, phone),
          specialty = COALESCE($5, specialty),
          license_number = COALESCE($6, license_number),
          experience_years = COALESCE($7, experience_years),
          education = COALESCE($8, education),
          bio = COALESCE($9, bio),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `, [
        userId,
        firstName,
        lastName,
        phone,
        specialty,
        licenseNumber,
        experienceYears,
        education,
        bio
      ]);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role'
      });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const updatedProfile = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get profile statistics (for dashboard)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'patient') {
      // Get patient ID
      const patientResult = await query(
        'SELECT id FROM patients WHERE user_id = $1',
        [userId]
      );

      if (patientResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      const patientId = patientResult.rows[0].id;

      // Get counts for various entities
      const [appointmentsResult, medicationsResult, labTestsResult, healthRecordsResult] = await Promise.all([
        query('SELECT COUNT(*) as count FROM appointments WHERE patient_id = $1', [patientId]),
        query('SELECT COUNT(*) as count FROM medications WHERE patient_id = $1', [patientId]),
        query('SELECT COUNT(*) as count FROM lab_tests WHERE patient_id = $1', [patientId]),
        query('SELECT COUNT(*) as count FROM health_records WHERE patient_id = $1', [patientId])
      ]);

      // Get upcoming appointments count
      const upcomingAppointmentsResult = await query(`
        SELECT COUNT(*) as count 
        FROM appointments 
        WHERE patient_id = $1 
          AND appointment_date >= CURRENT_DATE 
          AND status IN ('scheduled', 'confirmed')
      `, [patientId]);

      // Get active medications count
      const activeMedicationsResult = await query(`
        SELECT COUNT(*) as count 
        FROM medications 
        WHERE patient_id = $1 
          AND status = 'active'
      `, [patientId]);

      stats = {
        totalAppointments: parseInt(appointmentsResult.rows[0].count),
        upcomingAppointments: parseInt(upcomingAppointmentsResult.rows[0].count),
        totalMedications: parseInt(medicationsResult.rows[0].count),
        activeMedications: parseInt(activeMedicationsResult.rows[0].count),
        totalLabTests: parseInt(labTestsResult.rows[0].count),
        totalHealthRecords: parseInt(healthRecordsResult.rows[0].count)
      };
    } else if (userRole === 'doctor') {
      // Get doctor ID
      const doctorResult = await query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [userId]
      );

      if (doctorResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const doctorId = doctorResult.rows[0].id;

      // Get counts for doctor
      const [appointmentsResult, patientsResult] = await Promise.all([
        query('SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1', [doctorId]),
        query(`
          SELECT COUNT(DISTINCT patient_id) as count 
          FROM appointments 
          WHERE doctor_id = $1
        `, [doctorId])
      ]);

      // Get today's appointments
      const todayAppointmentsResult = await query(`
        SELECT COUNT(*) as count 
        FROM appointments 
        WHERE doctor_id = $1 
          AND appointment_date = CURRENT_DATE
      `, [doctorId]);

      stats = {
        totalAppointments: parseInt(appointmentsResult.rows[0].count),
        todayAppointments: parseInt(todayAppointmentsResult.rows[0].count),
        totalPatients: parseInt(patientsResult.rows[0].count)
      };
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching profile stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Test endpoint for doctor stats (bypasses authentication)
router.get('/test-stats/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Get counts for doctor
    const [appointmentsResult, patientsResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1', [doctorId]),
      query(`
        SELECT COUNT(DISTINCT patient_id) as count 
        FROM appointments 
        WHERE doctor_id = $1
      `, [doctorId])
    ]);
    
    // Get today's appointments
    const todayAppointmentsResult = await query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE doctor_id = $1 
        AND appointment_date = CURRENT_DATE
    `, [doctorId]);
    
    const stats = {
      totalAppointments: parseInt(appointmentsResult.rows[0].count),
      todayAppointments: parseInt(todayAppointmentsResult.rows[0].count),
      totalPatients: parseInt(patientsResult.rows[0].count)
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching test stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Test endpoint for doctor appointments (bypasses authentication)
router.get('/test-appointments/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, limit = 10 } = req.query;
    
    let whereClause = 'WHERE a.doctor_id = $1';
    let queryParams = [doctorId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }
    
    const appointmentsResult = await query(`
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
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.profile_picture_url as patient_image,
        p.date_of_birth as patient_date_of_birth,
        EXTRACT(YEAR FROM AGE(p.date_of_birth)) as patient_age,
        u.email as patient_email
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT $${paramCount}
    `, [...queryParams, parseInt(limit)]);
    
    const appointments = appointmentsResult.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      doctorId: doctorId,
      patientName: `${row.patient_first_name} ${row.patient_last_name}`,
      patientPhone: row.patient_phone,
      patientImage: row.patient_image,
      patientEmail: row.patient_email,
      patientAge: parseInt(row.patient_age) || 0,
      patientDateOfBirth: row.patient_date_of_birth,
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
        total: appointments.length,
        page: 1,
        limit: parseInt(limit),
        totalPages: 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching test appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Test endpoint for doctor earnings (bypasses authentication)
router.get('/test-earnings/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { period = 'month' } = req.query;
    
    // For now, return mock earnings data
    const earnings = {
      summary: {
        totalEarnings: 0,
        netEarnings: 0,
        totalAppointments: 0,
        averageEarningPerAppointment: 0
      },
      recentEarnings: []
    };
    
    res.json({
      success: true,
      data: earnings
    });
    
  } catch (error) {
    console.error('Error fetching test earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
