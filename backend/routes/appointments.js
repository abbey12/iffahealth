const express = require('express');
const { query } = require('../config/database');
const { validateAppointment } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all appointments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, patient_id, doctor_id, status, upcoming } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    let paramCount = 1;
    
    if (patient_id) {
      whereClause += ` AND a.patient_id = $${paramCount}`;
      queryParams.push(patient_id);
      paramCount++;
    }
    
    if (doctor_id) {
      whereClause += ` AND a.doctor_id = $${paramCount}`;
      queryParams.push(doctor_id);
      paramCount++;
    }
    
    if (status) {
      // Handle multiple status values (comma-separated)
      const statusList = status.split(',').map(s => s.trim());
      if (statusList.length === 1) {
        whereClause += ` AND a.status = $${paramCount}`;
        queryParams.push(statusList[0]);
        paramCount++;
      } else {
        const placeholders = statusList.map((_, index) => `$${paramCount + index}`).join(',');
        whereClause += ` AND a.status IN (${placeholders})`;
        queryParams.push(...statusList);
        paramCount += statusList.length;
      }
    }

    // Upcoming filter: exclude past appointments using date and time
    // Rules:
    //  - Keep any rows where appointment_date is in the future
    //  - If appointment_date is today, keep rows with time >= now
    //  - Works whether appointment_time is stored as 'HH12:MI AM' or 'HH24:MI'
    if (String(upcoming).toLowerCase() === 'true') {
      whereClause += ` AND (
        (a.appointment_date::date > CURRENT_DATE) OR
        (a.appointment_date::date = CURRENT_DATE AND (
          CASE 
            WHEN a.appointment_time::text ~* '^[0-9]{1,2}:[0-9]{2}\\s*(AM|PM)$' THEN to_timestamp(a.appointment_time::text, 'HH12:MI AM')::time
            WHEN a.appointment_time::text ~ '^[0-9]{1,2}:[0-9]{2}$' THEN to_timestamp(a.appointment_time::text, 'HH24:MI')::time
            ELSE NULL
          END
        ) >= CURRENT_TIME)
      )`;
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM appointments a 
      ${whereClause}
    `;
    
    // Order: for upcoming, show earliest first; otherwise keep default (latest first)
    const orderClause = (String(upcoming).toLowerCase() === 'true')
      ? `ORDER BY a.appointment_date ASC, (
            CASE 
              WHEN a.appointment_time::text ~* '^[0-9]{1,2}:[0-9]{2}\\s*(AM|PM)$' THEN to_timestamp(a.appointment_time::text, 'HH12:MI AM')::time
              WHEN a.appointment_time::text ~ '^[0-9]{1,2}:[0-9]{2}$' THEN to_timestamp(a.appointment_time::text, 'HH24:MI')::time
              ELSE NULL
            END
         ) ASC`
      : `ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

    const dataQuery = `
      SELECT a.id,
             a.patient_id AS patient_id,
             a.doctor_id AS doctor_id,
             a.appointment_date,
             a.appointment_time,
             a.type,
             a.status,
             a.notes,
             a.meeting_link,
             a.created_at,
             p.first_name AS patient_first_name,
             p.last_name AS patient_last_name,
             d.first_name AS doctor_first_name,
             d.last_name AS doctor_last_name,
             d.specialty AS doctor_specialty
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      ${whereClause}
      ${orderClause}
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
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
});

// Create new appointment
router.post('/', authenticateToken, validateAppointment, async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      type,
      status = 'scheduled',
      notes,
      meeting_link
    } = req.body;
    
    const result = await query(`
      INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, appointment_time, 
        type, status, notes, meeting_link
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, patient_id, doctor_id, appointment_date, appointment_time,
                type, status, notes, meeting_link, created_at, updated_at
    `, [
      patient_id, doctor_id, appointment_date, appointment_time,
      type, status, notes, meeting_link
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
});

// Update appointment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      appointment_date, 
      appointment_time, 
      type, 
      status, 
      notes, 
      meeting_link,
      payment_status,
      amount 
    } = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (appointment_date !== undefined) {
      updateFields.push(`appointment_date = $${paramCount}`);
      values.push(appointment_date);
      paramCount++;
    }
    if (appointment_time !== undefined) {
      updateFields.push(`appointment_time = $${paramCount}`);
      values.push(appointment_time);
      paramCount++;
    }
    if (type !== undefined) {
      updateFields.push(`type = $${paramCount}`);
      values.push(type);
      paramCount++;
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`);
      values.push(notes);
      paramCount++;
    }
    if (meeting_link !== undefined) {
      updateFields.push(`meeting_link = $${paramCount}`);
      values.push(meeting_link);
      paramCount++;
    }
    if (payment_status !== undefined) {
      updateFields.push(`payment_status = $${paramCount}`);
      values.push(payment_status);
      paramCount++;
    }
    if (amount !== undefined) {
      updateFields.push(`amount = $${paramCount}`);
      values.push(amount);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const updateQuery = `
      UPDATE appointments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, patient_id, doctor_id, appointment_date, appointment_time,
                type, status, notes, meeting_link, payment_status, amount,
                created_at, updated_at
    `;

    const result = await query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
});

module.exports = router;
