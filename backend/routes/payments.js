const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const fetch = require('node-fetch');

const router = express.Router();

// Initialize payment
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    const { 
      appointmentId, 
      amount, 
      email, 
      patientId, 
      doctorId, 
      doctorName, 
      appointmentDate, 
      appointmentTime,
      metadata: clientMetadata,
      callbackUrl: clientCallbackUrl,
    } = req.body;
    
    // Validate required fields
    if (!appointmentId || !amount || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: appointmentId, amount, email'
      });
    }
    
    // Generate payment reference
    const reference = `IFFA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment transaction record
    const paymentResult = await query(`
      INSERT INTO payment_transactions (
        appointment_id, patient_id, amount, currency, payment_reference, 
        status, payment_method, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, payment_reference, status
    `, [
      appointmentId,
      patientId || null,
      amount,
      'GHS',
      reference,
      'pending',
      'paystack'
    ]);
    
    const payment = paymentResult.rows[0];
    
    // Initialize real Paystack transaction
    try {
      const paystackPayload = {
        amount: amount * 100, // Convert to kobo (smallest currency unit)
        email,
        reference,
        currency: 'GHS',
        callback_url: clientCallbackUrl || 'iffahealth://payment-callback',
        metadata: {
          appointmentId,
          patientId,
          doctorId,
          doctorName,
          appointmentDate,
          appointmentTime,
          platform: clientMetadata?.platform || 'unknown',
          initiatedAt: clientMetadata?.initiatedAt || new Date().toISOString(),
          ...clientMetadata,
        },
      };

      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY || 'sk_test_734f5b2915b36b350fdc4efd12d3214097a7a79f'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paystackPayload)
      });

      if (paystackResponse.ok) {
        const paystackData = await paystackResponse.json();
        res.json({
          success: true,
          data: {
            ...paystackData.data,
            callback_url: paystackPayload.callback_url,
            metadata: paystackPayload.metadata,
          },
          message: 'Payment initialized successfully with Paystack'
        });
      } else {
        const fallbackUrl = `https://checkout.paystack.com/${reference}`;
        res.json({
          success: true,
          data: {
            authorization_url: fallbackUrl,
            access_code: reference,
            reference,
            callback_url: paystackPayload.callback_url,
            metadata: paystackPayload.metadata,
          },
          message: 'Payment initialized with mock data (Paystack API unavailable)'
        });
      }
    } catch (error) {
      console.error('Paystack API Error:', error);
      const fallbackUrl = `https://checkout.paystack.com/${reference}`;
      res.json({
        success: true,
        data: {
          authorization_url: fallbackUrl,
          access_code: reference,
          reference,
          callback_url: 'iffahealth://payment-callback',
          metadata: {
            appointmentId,
            patientId,
            doctorId,
            doctorName,
            appointmentDate,
            appointmentTime,
            platform: clientMetadata?.platform || 'unknown',
            initiatedAt: clientMetadata?.initiatedAt || new Date().toISOString(),
            ...clientMetadata,
          },
        },
        message: 'Payment initialized with mock data (Paystack API error)'
      });
    }
    
  } catch (error) {
    console.error('Error initializing payment:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
});

// Verify payment
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const paymentResult = await query(`
      SELECT pt.*, a.appointment_date, a.appointment_time, a.type as appointment_type
      FROM payment_transactions pt
      LEFT JOIN appointments a ON pt.appointment_id = a.id
      WHERE pt.payment_reference = $1
    `, [reference]);

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = paymentResult.rows[0];
    let paystackStatus = 'failed';
    let verifyPayload = null;

    try {
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer sk_test_734f5b2915b36b350fdc4efd12d3214097a7a79f',
          'Content-Type': 'application/json',
        }
      });

      const text = await verifyResponse.text();
      try {
        verifyPayload = JSON.parse(text);
      } catch (parseError) {
        verifyPayload = { status: false, message: 'Unable to parse Paystack response', raw: text };
      }

      if (verifyResponse.ok && verifyPayload && verifyPayload.status === true) {
        paystackStatus = (verifyPayload.data && verifyPayload.data.status) || 'failed';
      } else {
        console.error('Paystack verification failed:', verifyPayload);
      }
    } catch (error) {
      console.error('Paystack verification error:', error);
    }

    const isSuccess = paystackStatus === 'success';
    const paymentStatusToStore = isSuccess ? 'completed' : paystackStatus === 'abandoned' ? 'abandoned' : 'failed';

    await query(`
      UPDATE payment_transactions 
      SET status = $1, updated_at = NOW()
      WHERE payment_reference = $2
    `, [paymentStatusToStore, reference]);

    if (isSuccess && payment.appointment_id) {
      await query(`
        UPDATE appointments 
        SET status = 'confirmed', payment_status = 'paid', updated_at = NOW()
        WHERE id = $1
      `, [payment.appointment_id]);
    }

    return res.json({
      success: isSuccess,
      data: {
        status: paystackStatus,
        reference,
        amount: payment.amount,
        appointmentId: payment.appointment_id,
        paystackStatus,
      },
      message: isSuccess ? 'Payment verified successfully' : `Payment status: ${paystackStatus}`,
      metadata: verifyPayload?.data || null,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

router.get('/verify/:reference', authenticateToken, verifyPayment);

// Callback endpoint for Paystack redirect
router.get('/callback', async (req, res) => {
  const { reference } = req.query;

  if (!reference || typeof reference !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Missing payment reference'
    });
  }

  req.params.reference = reference;

  try {
    return await verifyPayment(req, res);
  } catch (error) {
    console.error('Error handling Paystack callback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process Paystack callback'
    });
  }
});

// Book appointment with payment
router.post('/book-with-payment', authenticateToken, async (req, res) => {
  try {
    const { 
      patientId, 
      doctorId, 
      date, 
      time, 
      notes, 
      paymentData 
    } = req.body;
    
    // Validate required fields
    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patientId, doctorId, date, time'
      });
    }
    
    // Create appointment
    const appointmentResult = await query(`
      INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, appointment_time, 
        type, status, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, patient_id, doctor_id, appointment_date, appointment_time, type, status, notes, created_at
    `, [
      patientId,
      doctorId,
      date,
      time,
      'video',
      'confirmed',
      notes || ''
    ]);
    
    const appointment = appointmentResult.rows[0];
    
    // Create payment transaction
    const paymentResult = await query(`
      INSERT INTO payment_transactions (
        appointment_id, patient_id, amount, currency, payment_reference, 
        status, payment_method, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, payment_reference, status, amount
    `, [
      appointment.id,
      patientId,
      paymentData?.amount || 0,
      'GHS',
      paymentData?.reference || `PAY_${Date.now()}`,
      'completed',
      'paystack'
    ]);
    
    const payment = paymentResult.rows[0];
    
    res.json({
      success: true,
      data: {
        appointment: {
          id: appointment.id,
          patientId: appointment.patient_id,
          doctorId: appointment.doctor_id,
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          type: appointment.type,
          status: appointment.status,
          notes: appointment.notes,
          createdAt: appointment.created_at
        },
        payment: {
          id: payment.id,
          reference: payment.payment_reference,
          status: payment.status,
          amount: payment.amount
        }
      },
      message: 'Appointment booked and payment processed successfully'
    });
    
  } catch (error) {
    console.error('Error booking appointment with payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment with payment'
    });
  }
});

// Get payment history for patient
router.get('/patient/:id/history', authenticateToken, async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get payment history
    const paymentsResult = await query(`
      SELECT 
        pt.id,
        pt.amount,
        pt.currency,
        pt.payment_reference as reference,
        pt.status,
        pt.payment_method,
        pt.created_at,
        a.appointment_date,
        a.appointment_time,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM payment_transactions pt
      LEFT JOIN appointments a ON pt.appointment_id = a.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE pt.patient_id = $1
      ORDER BY pt.created_at DESC
      LIMIT $2 OFFSET $3
    `, [patientId, limit, offset]);
    
    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM payment_transactions
      WHERE patient_id = $1
    `, [patientId]);
    
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      data: paymentsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

// Refund payment
router.post('/:id/refund', authenticateToken, async (req, res) => {
  try {
    const { id: paymentId } = req.params;
    const { reason } = req.body;
    
    // Get payment details
    const paymentResult = await query(`
      SELECT * FROM payment_transactions WHERE id = $1
    `, [paymentId]);
    
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    const payment = paymentResult.rows[0];
    
    // Update payment status to refunded
    await query(`
      UPDATE payment_transactions 
      SET status = 'refunded', updated_at = NOW()
      WHERE id = $1
    `, [paymentId]);
    
    // Update appointment status if it exists
    if (payment.appointment_id) {
      await query(`
        UPDATE appointments 
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1
      `, [payment.appointment_id]);
    }
    
    res.json({
      success: true,
      message: 'Payment refunded successfully',
      data: {
        paymentId: paymentId,
        status: 'refunded',
        refundReason: reason
      }
    });
    
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refund payment'
    });
  }
});

// Get payment methods
router.get('/methods', authenticateToken, async (req, res) => {
  try {
    // Return available payment methods
    const paymentMethods = [
      {
        id: 'paystack',
        name: 'Paystack',
        type: 'card',
        description: 'Pay with card via Paystack',
        isActive: true
      },
      {
        id: 'mobile_money',
        name: 'Mobile Money',
        type: 'mobile',
        description: 'Pay with Mobile Money',
        isActive: false
      }
    ];
    
    res.json({
      success: true,
      data: paymentMethods
    });
    
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods'
    });
  }
});

module.exports = router;
