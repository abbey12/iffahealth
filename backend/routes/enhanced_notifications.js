const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get notifications for user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE n.user_id = $1';
    let queryParams = [userId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND n.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM notifications n 
      ${whereClause}
    `;
    
    const dataQuery = `
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
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const notifications = dataResult.rows.map(row => ({
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
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get unread notifications count
router.get('/user/:userId/unread-count', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await query(`
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = $1 AND status = 'unread'
    `, [userId]);
    
    const unreadCount = parseInt(result.rows[0].unread_count);
    
    res.json({
      success: true,
      data: {
        unreadCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      UPDATE notifications 
      SET 
        status = 'read',
        read_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark all notifications as read
router.put('/user/:userId/read-all', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await query(`
      UPDATE notifications 
      SET 
        status = 'read',
        read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND status = 'unread'
      RETURNING COUNT(*) as updated_count
    `, [userId]);
    
    const updatedCount = parseInt(result.rows[0].updated_count);
    
    res.json({
      success: true,
      message: `${updatedCount} notifications marked as read`,
      data: {
        updatedCount
      }
    });
    
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Archive notification
router.put('/:id/archive', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      UPDATE notifications 
      SET 
        status = 'archived'
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification archived',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      DELETE FROM notifications 
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create notification
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      user_id,
      type,
      title,
      message,
      data
    } = req.body;
    
    const result = await query(`
      INSERT INTO notifications (
        user_id, type, title, message, data, status
      ) VALUES ($1, $2, $3, $4, $5, 'unread')
      RETURNING *
    `, [user_id, type, title, message, JSON.stringify(data || {})]);
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get notification preferences
router.get('/preferences/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user preferences from users table or separate preferences table
    const result = await query(`
      SELECT 
        notification_preferences
      FROM users
      WHERE id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const preferences = result.rows[0].notification_preferences || {
      email: true,
      push: true,
      sms: false,
      appointment_reminders: true,
      lab_results: true,
      prescription_updates: true,
      payment_notifications: true,
      general_updates: true
    };
    
    res.json({
      success: true,
      data: preferences
    });
    
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update notification preferences
router.put('/preferences/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;
    
    const result = await query(`
      UPDATE users 
      SET 
        notification_preferences = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [userId, JSON.stringify(preferences)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: preferences
    });
    
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send appointment reminder notification
router.post('/appointment-reminder', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    // Get appointment details
    const appointmentResult = await query(`
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.type,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = $1
    `, [appointmentId]);
    
    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    const appointment = appointmentResult.rows[0];
    
    // Get patient user_id
    const patientUserResult = await query(`
      SELECT user_id FROM patients WHERE id = $1
    `, [appointment.patient_id]);
    
    if (patientUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient user not found'
      });
    }
    
    const patientUserId = patientUserResult.rows[0].user_id;
    
    // Create notification
    const notificationResult = await query(`
      INSERT INTO notifications (
        user_id, type, title, message, data, status
      ) VALUES ($1, 'appointment', 'Appointment Reminder', 
        'You have an appointment with Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name} on ${appointment.appointment_date} at ${appointment.appointment_time}',
        $2, 'unread')
      RETURNING *
    `, [patientUserId, JSON.stringify({
      appointmentId: appointment.id,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      doctorName: `${appointment.doctor_first_name} ${appointment.doctor_last_name}`,
      specialty: appointment.specialty
    })]);
    
    res.status(201).json({
      success: true,
      message: 'Appointment reminder sent successfully',
      data: notificationResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send lab result notification
router.post('/lab-result', authenticateToken, async (req, res) => {
  try {
    const { labTestId } = req.body;
    
    // Get lab test details
    const labTestResult = await query(`
      SELECT 
        lt.id,
        lt.test_name,
        lt.test_date,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM lab_tests lt
      JOIN patients p ON lt.patient_id = p.id
      LEFT JOIN doctors d ON lt.ordered_by = d.id
      WHERE lt.id = $1
    `, [labTestId]);
    
    if (labTestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }
    
    const labTest = labTestResult.rows[0];
    
    // Get patient user_id
    const patientUserResult = await query(`
      SELECT user_id FROM patients WHERE id = $1
    `, [labTest.patient_id]);
    
    if (patientUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient user not found'
      });
    }
    
    const patientUserId = patientUserResult.rows[0].user_id;
    
    // Create notification
    const notificationResult = await query(`
      INSERT INTO notifications (
        user_id, type, title, message, data, status
      ) VALUES ($1, 'lab_result', 'Lab Results Available', 
        'Your ${labTest.test_name} results are now available',
        $2, 'unread')
      RETURNING *
    `, [patientUserId, JSON.stringify({
      labTestId: labTest.id,
      testName: labTest.test_name,
      testDate: labTest.test_date,
      doctorName: labTest.doctor_first_name && labTest.doctor_last_name 
        ? `${labTest.doctor_first_name} ${labTest.doctor_last_name}` 
        : null
    })]);
    
    res.status(201).json({
      success: true,
      message: 'Lab result notification sent successfully',
      data: notificationResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error sending lab result notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send prescription notification
router.post('/prescription', authenticateToken, async (req, res) => {
  try {
    const { prescriptionId } = req.body;
    
    // Get prescription details
    const prescriptionResult = await query(`
      SELECT 
        p.id,
        p.prescription_date,
        pt.first_name as patient_first_name,
        pt.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM prescriptions p
      JOIN patients pt ON p.patient_id = pt.id
      JOIN doctors d ON p.doctor_id = d.id
      WHERE p.id = $1
    `, [prescriptionId]);
    
    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    const prescription = prescriptionResult.rows[0];
    
    // Get patient user_id
    const patientUserResult = await query(`
      SELECT user_id FROM patients WHERE id = $1
    `, [prescription.patient_id]);
    
    if (patientUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient user not found'
      });
    }
    
    const patientUserId = patientUserResult.rows[0].user_id;
    
    // Create notification
    const notificationResult = await query(`
      INSERT INTO notifications (
        user_id, type, title, message, data, status
      ) VALUES ($1, 'prescription', 'New Prescription', 
        'You have a new prescription from Dr. ${prescription.doctor_first_name} ${prescription.doctor_last_name}',
        $2, 'unread')
      RETURNING *
    `, [patientUserId, JSON.stringify({
      prescriptionId: prescription.id,
      prescriptionDate: prescription.prescription_date,
      doctorName: `${prescription.doctor_first_name} ${prescription.doctor_last_name}`
    })]);
    
    res.status(201).json({
      success: true,
      message: 'Prescription notification sent successfully',
      data: notificationResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error sending prescription notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send payment notification
router.post('/payment', authenticateToken, async (req, res) => {
  try {
    const { paymentId, status, amount } = req.body;
    
    // Get payment details
    const paymentResult = await query(`
      SELECT 
        pt.id as patient_id,
        pt.first_name as patient_first_name,
        pt.last_name as patient_last_name,
        a.appointment_date,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM payment_transactions pt
      JOIN appointments a ON pt.appointment_id = a.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE pt.id = $1
    `, [paymentId]);
    
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    const payment = paymentResult.rows[0];
    
    // Get patient user_id
    const patientUserResult = await query(`
      SELECT user_id FROM patients WHERE id = $1
    `, [payment.patient_id]);
    
    if (patientUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient user not found'
      });
    }
    
    const patientUserId = patientUserResult.rows[0].user_id;
    
    let title, message;
    if (status === 'success') {
      title = 'Payment Successful';
      message = `Your payment of GHS ${amount} for appointment with Dr. ${payment.doctor_first_name} ${payment.doctor_last_name} has been processed successfully`;
    } else if (status === 'failed') {
      title = 'Payment Failed';
      message = `Your payment of GHS ${amount} for appointment with Dr. ${payment.doctor_first_name} ${payment.doctor_last_name} has failed. Please try again`;
    } else {
      title = 'Payment Update';
      message = `Your payment of GHS ${amount} for appointment with Dr. ${payment.doctor_first_name} ${payment.doctor_last_name} is now ${status}`;
    }
    
    // Create notification
    const notificationResult = await query(`
      INSERT INTO notifications (
        user_id, type, title, message, data, status
      ) VALUES ($1, 'payment', $2, $3, $4, 'unread')
      RETURNING *
    `, [patientUserId, title, message, JSON.stringify({
      paymentId: paymentId,
      amount: amount,
      status: status,
      appointmentDate: payment.appointment_date,
      doctorName: `${payment.doctor_first_name} ${payment.doctor_last_name}`
    })]);
    
    res.status(201).json({
      success: true,
      message: 'Payment notification sent successfully',
      data: notificationResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error sending payment notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get notification types
router.get('/types/list', authenticateToken, async (req, res) => {
  try {
    const notificationTypes = [
      { id: 'appointment', name: 'Appointment', description: 'Appointment reminders and updates' },
      { id: 'prescription', name: 'Prescription', description: 'New prescriptions and medication updates' },
      { id: 'lab_result', name: 'Lab Result', description: 'Laboratory test results' },
      { id: 'payment', name: 'Payment', description: 'Payment confirmations and updates' },
      { id: 'general', name: 'General', description: 'General app updates and announcements' }
    ];
    
    res.json({
      success: true,
      data: notificationTypes
    });
    
  } catch (error) {
    console.error('Error fetching notification types:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
