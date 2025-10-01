const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');
const { authenticateToken: auth } = require('../middleware/auth');

const router = express.Router();

// Utility helpers
const buildPaginationMeta = (total, page, limit) => {
  const numericPage = Number(page) || 1;
  const numericLimit = Number(limit) || 10;
  const totalPages = Math.max(1, Math.ceil(total / numericLimit));

  return {
    total,
    page: numericPage,
    limit: numericLimit,
    totalPages
  };
};

const normalizeString = (value) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const parseJSONField = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }
  return value;
};

const toTextArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // Ignore JSON parse error and fallback to comma split
    }

    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'iffahealth-secret-key-2024';

// Admin Login
router.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if admin exists
    const adminResult = await query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email]
    );

    if (adminResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const admin = adminResult.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email, 
        role: admin.role,
        type: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = $1',
      [admin.id]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          permissions: admin.permissions || [],
          createdAt: admin.created_at,
          lastLogin: admin.last_login
        },
        token
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current admin user
router.get('/auth/me', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const adminResult = await query(
      'SELECT id, email, name, role, permissions, created_at, last_login FROM admin_users WHERE id = $1',
      [req.user.id]
    );

    if (adminResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    const admin = adminResult.rows[0];

    res.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions || [],
        createdAt: admin.created_at,
        lastLogin: admin.last_login
      }
    });

  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin logout
router.post('/auth/logout', auth, async (req, res) => {
  try {
    // For JWT, logout is handled client-side by removing the token
    // In a more sophisticated setup, you might maintain a token blacklist
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard Stats
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get total users (excluding admin users)
    const totalUsersResult = await query('SELECT COUNT(*) as count FROM users WHERE role != $1', ['admin']);
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Get total doctors
    const totalDoctorsResult = await query('SELECT COUNT(*) as count FROM doctors');
    const totalDoctors = parseInt(totalDoctorsResult.rows[0].count);

    // Get total patients
    const totalPatientsResult = await query('SELECT COUNT(*) as count FROM patients');
    const totalPatients = parseInt(totalPatientsResult.rows[0].count);

    // Get total appointments
    const totalAppointmentsResult = await query('SELECT COUNT(*) as count FROM appointments');
    const totalAppointments = parseInt(totalAppointmentsResult.rows[0].count);

    // Partner counts
    const totalLabCentersResult = await query('SELECT COUNT(*) as count FROM lab_centers WHERE is_active = TRUE');
    const totalLabCenters = parseInt(totalLabCentersResult.rows[0].count);

    const totalPharmaciesResult = await query('SELECT COUNT(*) as count FROM partner_pharmacies WHERE is_active = TRUE');
    const totalPharmacies = parseInt(totalPharmaciesResult.rows[0].count);

    const totalInsurancePartnersResult = await query('SELECT COUNT(*) as count FROM insurance_partners WHERE is_active = TRUE');
    const totalInsurancePartners = parseInt(totalInsurancePartnersResult.rows[0].count);

    // Get pending appointments
    const pendingAppointmentsResult = await query(
      'SELECT COUNT(*) as count FROM appointments WHERE status = $1',
      ['scheduled']
    );
    const pendingAppointments = parseInt(pendingAppointmentsResult.rows[0].count);

    // Get completed appointments
    const completedAppointmentsResult = await query(
      'SELECT COUNT(*) as count FROM appointments WHERE status = $1',
      ['completed']
    );
    const completedAppointments = parseInt(completedAppointmentsResult.rows[0].count);

    // Get total revenue (from doctor earnings)
    const totalRevenueResult = await query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM doctor_earnings'
    );
    const totalRevenue = parseFloat(totalRevenueResult.rows[0].total);

    // Get monthly revenue (current month)
    const monthlyRevenueResult = await query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM doctor_earnings WHERE created_at >= DATE_TRUNC(\'month\', CURRENT_DATE)'
    );
    const monthlyRevenue = parseFloat(monthlyRevenueResult.rows[0].total);

    // Get active users (logged in within last 30 days, excluding admin users)
    const activeUsersResult = await query(
      'SELECT COUNT(*) as count FROM users WHERE last_login >= NOW() - INTERVAL \'30 days\' AND role != $1',
      ['admin']
    );
    const activeUsers = parseInt(activeUsersResult.rows[0].count);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalAppointments,
        totalLabCenters,
        totalPharmacies,
        totalInsurancePartners,
        pendingAppointments,
        completedAppointments,
        totalRevenue,
        monthlyRevenue,
        activeUsers
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all doctors
router.get('/doctors', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { page = 1, limit = 10, status, search, specialty } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramCount = 0;

    if (specialty) {
      paramCount++;
      whereClause += ` AND d.specialty = $${paramCount}`;
      queryParams.push(specialty);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (d.first_name ILIKE $${paramCount} OR d.last_name ILIKE $${paramCount} OR d.email ILIKE $${paramCount} OR d.specialty ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Get doctors directly from doctors table
    const doctorsResult = await query(
      `SELECT 
        d.id,
        d.first_name,
        d.last_name,
        u.email,
        d.phone,
        d.specialty,
        d.experience_years,
        d.license_number,
        d.consultation_fee,
        d.hospital_affiliation,
        d.medical_school,
        d.languages,
        d.city,
        d.practice_address,
        d.is_verified,
        d.created_at,
        d.updated_at,
        COALESCE(patients.total_patients, 0) AS total_patients
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN (
         SELECT doctor_id, COUNT(DISTINCT patient_id) AS total_patients
         FROM appointments
         WHERE status IN ('completed', 'scheduled')
         GROUP BY doctor_id
       ) patients ON d.id = patients.doctor_id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM doctors d
       JOIN users u ON d.user_id = u.id
       ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        items: doctorsResult.rows,
        meta: buildPaginationMeta(total, page, limit)
      }
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all patients
router.get('/patients', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount} OR p.phone ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Get patients directly from patients table
    const patientsResult = await query(
      `SELECT 
        p.id,
        p.first_name,
        p.last_name,
        u.email,
        p.phone,
        p.date_of_birth,
        p.gender,
        p.blood_type,
        p.medical_history,
        p.allergies,
        p.address,
        p.insurance_provider,
        p.insurance_number,
        p.insurance_expiry_date,
        p.created_at,
        p.updated_at
       FROM patients p
       JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM patients p
       JOIN users u ON p.user_id = u.id
       ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        items: patientsResult.rows,
        meta: buildPaginationMeta(total, page, limit)
      }
    });

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all appointments
router.get('/appointments', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      page = 1,
      limit = 10,
      status,
      search,
      date_from,
      date_to,
      doctor_id,
      patient_id
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (date_from) {
      paramCount++;
      whereClause += ` AND a.appointment_date >= $${paramCount}`;
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      whereClause += ` AND a.appointment_date <= $${paramCount}`;
      queryParams.push(date_to);
    }

    if (doctor_id) {
      paramCount++;
      whereClause += ` AND a.doctor_id = $${paramCount}`;
      queryParams.push(doctor_id);
    }

    if (patient_id) {
      paramCount++;
      whereClause += ` AND a.patient_id = $${paramCount}`;
      queryParams.push(patient_id);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount} OR d.first_name ILIKE $${paramCount} OR d.last_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Get appointments with patient and doctor info
    const appointmentsResult = await query(
      `SELECT 
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.appointment_time,
        a.type,
        a.status,
        a.notes,
        a.location,
        a.meeting_link,
        a.payment_status,
        a.payment_reference,
        a.amount,
        a.created_at,
        a.updated_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        pu.email as patient_email,
        p.phone as patient_phone,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        du.email as doctor_email,
        d.specialty as doctor_specialty,
        d.consultation_fee as doctor_consultation_fee
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       ${whereClause}
       ORDER BY a.appointment_date DESC, a.appointment_time DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count 
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        items: appointmentsResult.rows,
        meta: buildPaginationMeta(total, page, limit)
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== Partner Lab Centers =====

router.get('/labs', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      page = 1,
      limit = 10,
      search,
      city,
      region,
      isActive
    } = req.query;

    const filters = [];
    const params = [];
    let idx = 1;

    if (search) {
      filters.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx += 1;
    }

    if (city) {
      filters.push(`city ILIKE $${idx}`);
      params.push(`%${city}%`);
      idx += 1;
    }

    if (region) {
      filters.push(`region ILIKE $${idx}`);
      params.push(`%${region}%`);
      idx += 1;
    }

    if (typeof isActive !== 'undefined') {
      filters.push(`is_active = $${idx}`);
      params.push(isActive === 'true');
      idx += 1;
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const listQuery = `
      SELECT
        id,
        name,
        description,
        address,
        city,
        region,
        country,
        latitude,
        longitude,
        phone,
        email,
        website,
        services,
        operating_hours,
        coverage_radius_km,
        is_active,
        rating,
        total_reviews,
        created_at,
        updated_at
      FROM lab_centers
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM lab_centers
      ${whereClause}
    `;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [labsResult, countResult] = await Promise.all([
      query(listQuery, [...params, limit, offset]),
      query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    const items = labsResult.rows.map((lab) => ({
      ...lab,
      address: parseJSONField(lab.address),
      services: toTextArray(lab.services),
      operating_hours: parseJSONField(lab.operating_hours)
    }));

    res.json({
      success: true,
      data: {
        items,
        meta: buildPaginationMeta(total, page, limit)
      }
    });
  } catch (error) {
    console.error('Get lab centers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


router.put('/labs/:id', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { id } = req.params;
    const fields = [];
    const params = [];
    let idx = 1;

    const updatableFields = {
      name: 'name',
      description: 'description',
      address: 'address',
      city: 'city',
      region: 'region',
      country: 'country',
      latitude: 'latitude',
      longitude: 'longitude',
      phone: 'phone',
      email: 'email',
      website: 'website',
      services: 'services',
      operatingHours: 'operating_hours',
      coverageRadiusKm: 'coverage_radius_km',
      isActive: 'is_active'
    };

    Object.entries(updatableFields).forEach(([key, column]) => {
      if (typeof req.body[key] !== 'undefined') {
        fields.push(`${column} = $${idx}`);
        params.push(req.body[key]);
        idx += 1;
      }
    });

    if (!fields.length) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update'
      });
    }

    fields.push(`updated_by = $${idx}`);
    params.push(req.user.id);
    idx += 1;

    params.push(id);

    const updateQuery = `
      UPDATE lab_centers
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
    `;

    const result = await query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab center not found'
      });
    }

    const lab = result.rows[0];

    res.json({
      success: true,
      data: {
        ...lab,
        address: parseJSONField(lab.address),
        services: toTextArray(lab.services),
        operating_hours: parseJSONField(lab.operating_hours)
      }
    });
  } catch (error) {
    console.error('Update lab center error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.delete('/labs/:id', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { id } = req.params;

    const result = await query('DELETE FROM lab_centers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab center not found'
      });
    }

    res.json({
      success: true,
      message: 'Lab center removed'
    });
  } catch (error) {
    console.error('Delete lab center error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Analytics - Revenue over period
router.get('/analytics/revenue', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { period = '30d' } = req.query;

    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    const revenueResult = await query(
      `SELECT 
         DATE(created_at) AS date,
         COALESCE(SUM(amount), 0) AS revenue
       FROM doctor_earnings
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`
    );

    const apptResult = await query(
      `SELECT 
         DATE(created_at) AS date,
         COUNT(*) AS appointments
       FROM appointments
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`
    );

    // Merge by date
    const dateToRevenue = new Map();
    for (const row of revenueResult.rows) {
      dateToRevenue.set(row.date.toISOString().slice(0, 10), { date: row.date.toISOString().slice(0,10), revenue: Number(row.revenue), appointments: 0 });
    }
    for (const row of apptResult.rows) {
      const key = row.date.toISOString().slice(0, 10);
      const existing = dateToRevenue.get(key) || { date: key, revenue: 0, appointments: 0 };
      existing.appointments = Number(row.appointments);
      dateToRevenue.set(key, existing);
    }

    res.json({ success: true, data: Array.from(dateToRevenue.values()) });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Analytics - Users over period
router.get('/analytics/users', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { period = '30d' } = req.query;
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    const usersResult = await query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS new_users
       FROM users
       WHERE created_at >= NOW() - INTERVAL '${days} days' AND role != 'admin'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`
    );

    const doctorsResult = await query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS doctors
       FROM doctors
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`
    );

    const patientsResult = await query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS patients
       FROM patients
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`
    );

    // Build by date
    const map = new Map();
    for (const r of usersResult.rows) {
      const key = r.date.toISOString().slice(0, 10);
      map.set(key, { date: key, totalUsers: 0, doctors: 0, patients: 0, newUsers: Number(r.new_users) });
    }
    for (const r of doctorsResult.rows) {
      const key = r.date.toISOString().slice(0, 10);
      const e = map.get(key) || { date: key, totalUsers: 0, doctors: 0, patients: 0, newUsers: 0 };
      e.doctors = Number(r.doctors);
      map.set(key, e);
    }
    for (const r of patientsResult.rows) {
      const key = r.date.toISOString().slice(0, 10);
      const e = map.get(key) || { date: key, totalUsers: 0, doctors: 0, patients: 0, newUsers: 0 };
      e.patients = Number(r.patients);
      map.set(key, e);
    }

    // Compute totalUsers per day as cumulative users count up to that day
    // Fetch total users per day quickly by cumulative sum of new_users
    let runningTotal = 0;
    const sorted = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    for (const e of sorted) {
      runningTotal += e.newUsers;
      e.totalUsers = runningTotal;
    }

    res.json({ success: true, data: sorted });
  } catch (error) {
    console.error('Users analytics error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Analytics - Appointments over period
router.get('/analytics/appointments', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { period = '30d' } = req.query;
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    const apptResult = await query(
      `SELECT 
         DATE(created_at) AS date,
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
       FROM appointments
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`
    );

    const data = apptResult.rows.map(r => ({
      date: r.date.toISOString().slice(0, 10),
      totalAppointments: Number(r.total),
      scheduled: Number(r.scheduled),
      completed: Number(r.completed),
      cancelled: Number(r.cancelled)
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Appointments analytics error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Verify doctor endpoint
router.patch('/doctors/:id/verify', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { id } = req.params;

    // Update doctor verification status
    const result = await query(
      `UPDATE doctors SET is_verified = true, updated_at = NOW() 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Also update the user's verification status
    await query(
      `UPDATE users SET is_verified = true, updated_at = NOW() 
       WHERE id = (SELECT user_id FROM doctors WHERE id = $1)`,
      [id]
    );

    res.json({
      success: true,
      message: 'Doctor verified successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Verify doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reject doctor verification endpoint
router.patch('/doctors/:id/reject', auth, [
  body('reason').notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    // Update doctor verification status
    const result = await query(
      `UPDATE doctors SET is_verified = false, updated_at = NOW() 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Also update the user's verification status
    await query(
      `UPDATE users SET is_verified = false, updated_at = NOW() 
       WHERE id = (SELECT user_id FROM doctors WHERE id = $1)`,
      [id]
    );

    res.json({
      success: true,
      message: 'Doctor verification rejected',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Reject doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update doctor status
router.patch('/doctors/:id/status', auth, [
  body('status').isIn(['active', 'inactive', 'suspended']),
  body('verified').optional().isBoolean()
], async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, verified } = req.body;

    let updateFields = ['status = $1', 'updated_at = NOW()'];
    let queryParams = [status];
    let paramCount = 1;

    if (verified !== undefined) {
      paramCount++;
      updateFields.push(`verified = $${paramCount}`);
      queryParams.push(verified);
    }

    // Update user status instead of doctor status
    const result = await query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = (SELECT user_id FROM doctors WHERE id = $2) RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: 'Doctor status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update doctor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update patient status
router.patch('/patients/:id/status', auth, [
  body('status').isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Update user status instead of patient status
    const result = await query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = (SELECT user_id FROM patients WHERE id = $2) RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update patient status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update appointment status
router.patch('/appointments/:id/status', auth, [
  body('status').isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'])
], async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const result = await query(
      'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== Partner Pharmacies =====

router.get('/pharmacies', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      page = 1,
      limit = 10,
      search,
      city,
      region,
      isActive
    } = req.query;

    const filters = [];
    const params = [];
    let idx = 1;

    if (search) {
      filters.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx += 1;
    }

    if (city) {
      filters.push(`city ILIKE $${idx}`);
      params.push(`%${city}%`);
      idx += 1;
    }

    if (region) {
      filters.push(`region ILIKE $${idx}`);
      params.push(`%${region}%`);
      idx += 1;
    }

    if (typeof isActive !== 'undefined') {
      filters.push(`is_active = $${idx}`);
      params.push(isActive === 'true');
      idx += 1;
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const listQuery = `
      SELECT
        id,
        name,
        address,
        city,
        region,
        country,
        latitude,
        longitude,
        phone,
        email,
        website,
        services,
        operating_hours,
        delivery_options,
        accepts_insurance,
        insurance_providers,
        coverage_radius_km,
        is_active,
        rating,
        total_reviews,
        created_at,
        updated_at
      FROM partner_pharmacies
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM partner_pharmacies
      ${whereClause}
    `;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [pharmaciesResult, countResult] = await Promise.all([
      query(listQuery, [...params, limit, offset]),
      query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    const items = pharmaciesResult.rows.map((pharmacy) => ({
      ...pharmacy,
      address: parseJSONField(pharmacy.address),
      services: toTextArray(pharmacy.services),
      operating_hours: parseJSONField(pharmacy.operating_hours),
      delivery_options: toTextArray(pharmacy.delivery_options),
      insurance_providers: toTextArray(pharmacy.insurance_providers)
    }));

    res.json({
      success: true,
      data: {
        items,
        meta: buildPaginationMeta(total, page, limit)
      }
    });
  } catch (error) {
    console.error('Get pharmacies error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new pharmacy
router.post('/pharmacies', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can create pharmacies.'
      });
    }

    // Basic validation
    if (!req.body.name || !req.body.address || !req.body.city || !req.body.region) {
      return res.status(400).json({
        success: false,
        message: 'Name, address, city, and region are required'
      });
    }

    const {
      name,
      address,
      city,
      region,
      country = 'Ghana',
      latitude,
      longitude,
      phone,
      email,
      website,
      services = [],
      operating_hours = {},
      delivery_options = [],
      accepts_insurance = false,
      insurance_providers = [],
      coverage_radius_km,
      is_active = true
    } = req.body;

    const result = await query(`
      INSERT INTO partner_pharmacies (
        name, address, city, region, country, latitude, longitude,
        phone, email, website, services, operating_hours, delivery_options,
        accepts_insurance, insurance_providers, coverage_radius_km, is_active,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      name, JSON.stringify(address), city, region, country, latitude, longitude,
      phone, email, website, services, JSON.stringify(operating_hours), delivery_options,
      accepts_insurance, insurance_providers, coverage_radius_km, is_active,
      req.user.id, req.user.id
    ]);

    res.status(201).json({
      success: true,
      message: 'Pharmacy created successfully',
      data: {
        ...result.rows[0],
        address: parseJSONField(result.rows[0].address),
        services: toTextArray(result.rows[0].services),
        operating_hours: parseJSONField(result.rows[0].operating_hours),
        delivery_options: toTextArray(result.rows[0].delivery_options),
        insurance_providers: toTextArray(result.rows[0].insurance_providers)
      }
    });
  } catch (error) {
    console.error('Create pharmacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===== Insurance Partners =====

router.get('/insurance-partners', auth, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      page = 1,
      limit = 10,
      search,
      coverageArea,
      isActive
    } = req.query;

    const filters = [];
    const params = [];
    let idx = 1;

    if (search) {
      filters.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx += 1;
    }

    if (coverageArea) {
      filters.push(`$${idx} = ANY(coverage_areas)`);
      params.push(coverageArea);
      idx += 1;
    }

    if (typeof isActive !== 'undefined') {
      filters.push(`is_active = $${idx}`);
      params.push(isActive === 'true');
      idx += 1;
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const listQuery = `
      SELECT
        id,
        name,
        description,
        logo_url,
        coverage_areas,
        contact_person,
        phone,
        email,
        website,
        plans,
        is_active,
        created_at,
        updated_at
      FROM insurance_partners
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM insurance_partners
      ${whereClause}
    `;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [partnersResult, countResult] = await Promise.all([
      query(listQuery, [...params, limit, offset]),
      query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    const items = partnersResult.rows.map((partner) => ({
      ...partner,
      coverage_areas: toTextArray(partner.coverage_areas),
      contact_person: parseJSONField(partner.contact_person),
      plans: parseJSONField(partner.plans)
    }));

    res.json({
      success: true,
      data: {
        items,
        meta: buildPaginationMeta(total, page, limit)
      }
    });
  } catch (error) {
    console.error('Get insurance partners error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new insurance partner
router.post('/insurance-partners', auth, [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional().isString(),
  body('logo_url').optional().isURL(),
  body('coverage_areas').isArray().withMessage('Coverage areas must be an array'),
  body('contact_person').isObject().withMessage('Contact person must be an object'),
  body('phone').optional().isMobilePhone(),
  body('email').optional().isEmail(),
  body('website').optional().isURL(),
  body('plans').optional().isObject(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can create insurance partners.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      logo_url,
      coverage_areas,
      contact_person,
      phone,
      email,
      website,
      plans = {},
      is_active = true
    } = req.body;

    const result = await query(`
      INSERT INTO insurance_partners (
        name, description, logo_url, coverage_areas, contact_person,
        phone, email, website, plans, is_active, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      name, description, logo_url, coverage_areas, JSON.stringify(contact_person),
      phone, email, website, JSON.stringify(plans), is_active,
      req.user.id, req.user.id
    ]);

    res.status(201).json({
      success: true,
      message: 'Insurance partner created successfully',
      data: {
        ...result.rows[0],
        coverage_areas: toTextArray(result.rows[0].coverage_areas),
        contact_person: parseJSONField(result.rows[0].contact_person),
        plans: parseJSONField(result.rows[0].plans)
      }
    });
  } catch (error) {
    console.error('Create insurance partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new lab center
router.post('/labs', auth, [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional().isString(),
  body('address').isObject().withMessage('Address must be an object'),
  body('city').notEmpty().withMessage('City is required'),
  body('region').notEmpty().withMessage('Region is required'),
  body('phone').optional().isMobilePhone(),
  body('email').optional().isEmail(),
  body('website').optional().isURL(),
  body('services').optional().isArray(),
  body('operating_hours').optional().isObject(),
  body('coverage_radius_km').optional().isNumeric(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can create lab centers.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      address,
      city,
      region,
      country = 'Ghana',
      latitude,
      longitude,
      phone,
      email,
      website,
      services = [],
      operating_hours = {},
      coverage_radius_km,
      is_active = true
    } = req.body;

    const result = await query(`
      INSERT INTO lab_centers (
        name, description, address, city, region, country, latitude, longitude,
        phone, email, website, services, operating_hours, coverage_radius_km, is_active,
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      name, description, JSON.stringify(address), city, region, country, latitude, longitude,
      phone, email, website, services, JSON.stringify(operating_hours), coverage_radius_km, is_active,
      req.user.id, req.user.id
    ]);

    res.status(201).json({
      success: true,
      message: 'Lab center created successfully',
      data: {
        ...result.rows[0],
        address: parseJSONField(result.rows[0].address),
        services: toTextArray(result.rows[0].services),
        operating_hours: parseJSONField(result.rows[0].operating_hours)
      }
    });
  } catch (error) {
    console.error('Create lab center error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;