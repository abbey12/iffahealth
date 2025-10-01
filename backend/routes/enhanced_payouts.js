const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create earning entry when an appointment is completed
router.post('/earnings', authenticateToken, async (req, res) => {
  try {
    const { doctor_id, appointment_id, amount } = req.body;
    if (!doctor_id || !appointment_id || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields: doctor_id, appointment_id, amount' });
    }

    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '0.15'); // 15% default
    const gross = parseFloat(amount);
    const netRaw = Math.max(gross - gross * platformFeePercent, 0);
    const net = Math.round(netRaw * 100) / 100; // round to 2dp as number

    const insertResult = await query(`
      INSERT INTO doctor_earnings (doctor_id, appointment_id, amount, net_amount, status, earned_date)
      VALUES ($1, $2, $3, $4, 'pending', CURRENT_DATE)
      RETURNING id, doctor_id, appointment_id, amount, net_amount, status, earned_date, created_at
    `, [doctor_id, appointment_id, gross, net]);

    res.status(201).json({ success: true, data: insertResult.rows[0] });
  } catch (error) {
    console.error('Error creating doctor earning:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get doctor earnings summary
router.get('/earnings/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
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
        COALESCE(SUM(CASE WHEN de.status = 'pending' THEN de.net_amount ELSE 0 END), 0) as pending_earnings,
        COALESCE(SUM(CASE WHEN de.status = 'paid' THEN de.net_amount ELSE 0 END), 0) as paid_earnings,
        COUNT(de.id) as total_appointments,
        COALESCE(AVG(de.amount), 0) as average_earning_per_appointment
      FROM doctor_earnings de
      WHERE de.doctor_id = $1 ${dateFilter}
    `, [doctorId]);
    
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
    `, [doctorId]);
    
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
          pendingEarnings: parseFloat(summary.pending_earnings),
          paidEarnings: parseFloat(summary.paid_earnings),
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

// Create payout request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const {
      doctor_id,
      amount,
      method,
      account_details
    } = req.body;
    
    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }
    
    // Check if doctor has enough pending earnings
    const earningsResult = await query(`
      SELECT COALESCE(SUM(net_amount), 0) as available_earnings
      FROM doctor_earnings
      WHERE doctor_id = $1 AND status = 'pending'
    `, [doctor_id]);
    
    const availableEarnings = parseFloat(earningsResult.rows[0].available_earnings);
    
    if (amount > availableEarnings) {
      return res.status(400).json({
        success: false,
        message: `Insufficient earnings. Available: ${availableEarnings}`
      });
    }
    
    // Check for pending payout requests
    const pendingRequestResult = await query(`
      SELECT id FROM payout_requests
      WHERE doctor_id = $1 AND status IN ('pending', 'processing')
    `, [doctor_id]);
    
    if (pendingRequestResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending payout request'
      });
    }
    
    // Create payout request
    const result = await query(`
      INSERT INTO payout_requests (
        doctor_id, amount, method, account_details, status, request_date
      ) VALUES ($1, $2, $3, $4, 'pending', CURRENT_DATE)
      RETURNING *
    `, [doctor_id, amount, method, JSON.stringify(account_details)]);
    
    res.status(201).json({
      success: true,
      message: 'Payout request created successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating payout request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get payout requests for doctor
router.get('/requests/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE pr.doctor_id = $1';
    let queryParams = [doctorId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND pr.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM payout_requests pr 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        pr.id,
        pr.amount,
        pr.method,
        pr.account_details,
        pr.status,
        pr.request_date,
        pr.processed_date,
        pr.notes,
        pr.created_at,
        pr.updated_at
      FROM payout_requests pr
      ${whereClause}
      ORDER BY pr.request_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const payoutRequests = dataResult.rows.map(row => ({
      id: row.id,
      doctorId: doctorId,
      amount: parseFloat(row.amount),
      method: row.method,
      accountDetails: row.account_details,
      status: row.status,
      requestDate: row.request_date,
      processedDate: row.processed_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: payoutRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get payout request by ID
router.get('/requests/:doctorId/:requestId', authenticateToken, async (req, res) => {
  try {
    const { doctorId, requestId } = req.params;
    
    const result = await query(`
      SELECT 
        pr.id,
        pr.amount,
        pr.method,
        pr.account_details,
        pr.status,
        pr.request_date,
        pr.processed_date,
        pr.notes,
        pr.created_at,
        pr.updated_at
      FROM payout_requests pr
      WHERE pr.id = $1 AND pr.doctor_id = $2
    `, [requestId, doctorId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payout request not found'
      });
    }
    
    const payoutRequest = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: payoutRequest.id,
        doctorId: doctorId,
        amount: parseFloat(payoutRequest.amount),
        method: payoutRequest.method,
        accountDetails: payoutRequest.account_details,
        status: payoutRequest.status,
        requestDate: payoutRequest.request_date,
        processedDate: payoutRequest.processed_date,
        notes: payoutRequest.notes,
        createdAt: payoutRequest.created_at,
        updatedAt: payoutRequest.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error fetching payout request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cancel payout request
router.put('/requests/:doctorId/:requestId/cancel', authenticateToken, async (req, res) => {
  try {
    const { doctorId, requestId } = req.params;
    const { reason } = req.body;
    
    const result = await query(`
      UPDATE payout_requests 
      SET 
        status = 'cancelled',
        notes = COALESCE($3, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND doctor_id = $2 AND status = 'pending'
      RETURNING *
    `, [requestId, doctorId, reason]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payout request not found or cannot be cancelled'
      });
    }
    
    res.json({
      success: true,
      message: 'Payout request cancelled successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error cancelling payout request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get available payout method types
router.get('/methods', authenticateToken, async (req, res) => {
  try {
    const methods = [
      {
        id: 'mobile_money',
        name: 'Mobile Money',
        type: 'mobile_money',
        isActive: true,
        description: 'MTN, Airtel, Vodafone Mobile Money',
        fields: [
          { name: 'provider', label: 'Provider', type: 'select', options: ['MTN', 'Airtel', 'Vodafone'], required: true },
          { name: 'phone_number', label: 'Phone Number', type: 'tel', required: true },
          { name: 'account_name', label: 'Account Name', type: 'text', required: true }
        ]
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        type: 'bank_transfer',
        isActive: true,
        description: 'Direct bank account transfer',
        fields: [
          { name: 'bank_name', label: 'Bank Name', type: 'text', required: true },
          { name: 'account_number', label: 'Account Number', type: 'text', required: true },
          { name: 'account_name', label: 'Account Name', type: 'text', required: true },
          { name: 'routing_number', label: 'Routing Number', type: 'text', required: false }
        ]
      },
      {
        id: 'paypal',
        name: 'PayPal',
        type: 'paypal',
        isActive: false,
        description: 'PayPal account transfer',
        fields: [
          { name: 'email', label: 'PayPal Email', type: 'email', required: true }
        ]
      }
    ];
    
    res.json({
      success: true,
      data: {
        methods: methods.filter(method => method.isActive)
      }
    });
    
  } catch (error) {
    console.error('Error fetching payout methods:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get doctor's configured payment methods
router.get('/methods/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const result = await query(`
      SELECT 
        id,
        method_type,
        provider,
        account_details,
        is_default,
        is_active,
        created_at,
        updated_at
      FROM doctor_payment_methods 
      WHERE doctor_id = $1 AND is_active = true
      ORDER BY is_default DESC, created_at ASC
    `, [doctorId]);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching doctor payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add a new payment method for a doctor
router.post('/methods/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { method_type, provider, account_details, is_default = false } = req.body;
    
    // Validate required fields
    if (!method_type || !provider || !account_details) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: method_type, provider, account_details'
      });
    }
    
    // If setting as default, remove default from other methods
    if (is_default) {
      await query(`
        UPDATE doctor_payment_methods 
        SET is_default = false 
        WHERE doctor_id = $1
      `, [doctorId]);
    }
    
    // Insert new payment method
    const result = await query(`
      INSERT INTO doctor_payment_methods 
      (doctor_id, method_type, provider, account_details, is_default, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [doctorId, method_type, provider, JSON.stringify(account_details), is_default]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update a payment method
router.put('/methods/:doctorId/:methodId', authenticateToken, async (req, res) => {
  try {
    const { doctorId, methodId } = req.params;
    const { method_type, provider, account_details, is_default = false } = req.body;
    
    // If setting as default, remove default from other methods
    if (is_default) {
      await query(`
        UPDATE doctor_payment_methods 
        SET is_default = false 
        WHERE doctor_id = $1 AND id != $2
      `, [doctorId, methodId]);
    }
    
    // Update the payment method
    const result = await query(`
      UPDATE doctor_payment_methods 
      SET 
        method_type = $1,
        provider = $2,
        account_details = $3,
        is_default = $4,
        updated_at = NOW()
      WHERE id = $5 AND doctor_id = $6
      RETURNING *
    `, [method_type, provider, JSON.stringify(account_details), is_default, methodId, doctorId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete a payment method
router.delete('/methods/:doctorId/:methodId', authenticateToken, async (req, res) => {
  try {
    const { doctorId, methodId } = req.params;
    
    const result = await query(`
      UPDATE doctor_payment_methods 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND doctor_id = $2
      RETURNING *
    `, [methodId, doctorId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get payout history
router.get('/history/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE pr.doctor_id = $1';
    let queryParams = [doctorId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND pr.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM payout_requests pr 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        pr.id,
        pr.amount,
        pr.method,
        pr.account_details,
        pr.status,
        pr.request_date,
        pr.processed_date,
        pr.notes,
        pr.created_at,
        pr.updated_at
      FROM payout_requests pr
      ${whereClause}
      ORDER BY pr.request_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const payoutHistory = dataResult.rows.map(row => ({
      id: row.id,
      doctorId: doctorId,
      amount: parseFloat(row.amount),
      method: row.method,
      accountDetails: row.account_details,
      status: row.status,
      requestDate: row.request_date,
      processedDate: row.processed_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: payoutHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching payout history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get payout statistics
router.get('/stats/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND pr.request_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND pr.request_date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND pr.request_date >= CURRENT_DATE - INTERVAL '365 days'";
        break;
    }
    
    const statsResult = await query(`
      SELECT 
        COUNT(pr.id) as total_requests,
        COUNT(CASE WHEN pr.status = 'completed' THEN 1 END) as completed_requests,
        COUNT(CASE WHEN pr.status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN pr.status = 'processing' THEN 1 END) as processing_requests,
        COUNT(CASE WHEN pr.status = 'failed' THEN 1 END) as failed_requests,
        COALESCE(SUM(CASE WHEN pr.status = 'completed' THEN pr.amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN pr.status = 'pending' THEN pr.amount ELSE 0 END), 0) as pending_amount,
        COALESCE(AVG(CASE WHEN pr.status = 'completed' THEN pr.amount END), 0) as average_payout
      FROM payout_requests pr
      WHERE pr.doctor_id = $1 ${dateFilter}
    `, [doctorId]);
    
    const stats = statsResult.rows[0];
    
    res.json({
      success: true,
      data: {
        totalRequests: parseInt(stats.total_requests),
        completedRequests: parseInt(stats.completed_requests),
        pendingRequests: parseInt(stats.pending_requests),
        processingRequests: parseInt(stats.processing_requests),
        failedRequests: parseInt(stats.failed_requests),
        totalPaid: parseFloat(stats.total_paid),
        pendingAmount: parseFloat(stats.pending_amount),
        averagePayout: parseFloat(stats.average_payout)
      }
    });
    
  } catch (error) {
    console.error('Error fetching payout stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Retry payout request
router.put('/requests/:doctorId/:requestId/retry', authenticateToken, async (req, res) => {
  try {
    const { doctorId, requestId } = req.params;
    
    // Check if request exists and is failed
    const checkResult = await query(`
      SELECT id, status FROM payout_requests 
      WHERE id = $1 AND doctor_id = $2 AND status = 'failed'
    `, [requestId, doctorId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payout request not found or cannot be retried'
      });
    }
    
    // Reset status to pending for retry
    const result = await query(`
      UPDATE payout_requests 
      SET 
        status = 'pending',
        notes = COALESCE($3, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND doctor_id = $2
      RETURNING *
    `, [requestId, doctorId, 'Retried by user']);

    res.json({
      success: true,
      message: 'Payout request retried successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error retrying payout request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin: Update payout request status
router.put('/admin/requests/:requestId/status', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;
    
    // Check if user is admin (you'll need to implement this check)
    // const isAdmin = await checkAdminRole(req.user.id);
    // if (!isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Access denied. Admin role required.'
    //   });
    // }
    
    const result = await query(`
      UPDATE payout_requests 
      SET 
        status = $2,
        notes = COALESCE($3, notes),
        processed_date = CASE WHEN $2 = 'completed' THEN CURRENT_DATE ELSE processed_date END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [requestId, status, notes]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payout request not found'
      });
    }
    
    // If status is completed, update earnings status
    if (status === 'completed') {
      // This would typically involve updating the earnings records
      // and potentially triggering the actual payout process
    }
    
    res.json({
      success: true,
      message: 'Payout request status updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating payout request status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
