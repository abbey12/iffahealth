import express from 'express';
import { body, validationResult } from 'express-validator';
import { Appointment } from '../models/Appointment';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get user's appointments
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { status, type, page = 1, limit = 10 } = req.query;

  const whereClause: any = {
    [req.user?.role === 'patient' ? 'patientId' : 'doctorId']: userId,
  };

  if (status) whereClause.status = status;
  if (type) whereClause.type = type;

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows: appointments } = await Appointment.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      },
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'specialty'],
      },
    ],
    limit: Number(limit),
    offset,
    order: [['appointmentDate', 'ASC']],
  });

  res.json({
    success: true,
    data: {
      appointments,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit)),
      },
    },
  });
}));

// Get appointment by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const appointment = await Appointment.findOne({
    where: {
      id,
      [req.user?.role === 'patient' ? 'patientId' : 'doctorId']: userId,
    },
    include: [
      {
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      },
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'specialty'],
      },
    ],
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  res.json({
    success: true,
    data: { appointment },
  });
}));

// Create new appointment
router.post('/', [
  body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').notEmpty().withMessage('Appointment time is required'),
  body('type').isIn(['video', 'in-person']).withMessage('Type must be video or in-person'),
  body('specialty').notEmpty().withMessage('Specialty is required'),
  body('reason').notEmpty().withMessage('Reason for appointment is required'),
  body('duration').optional().isInt({ min: 15, max: 120 }).withMessage('Duration must be between 15 and 120 minutes'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const {
    doctorId,
    appointmentDate,
    appointmentTime,
    type,
    specialty,
    reason,
    symptoms,
    duration = 30,
  } = req.body;

  // Verify doctor exists
  const doctor = await User.findOne({
    where: { id: doctorId, role: 'doctor' },
  });

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
  }

  // Generate meeting link for video appointments
  let meetingLink = null;
  let roomId = null;
  if (type === 'video') {
    roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    meetingLink = `${process.env.CLIENT_URL}/video-call/${roomId}`;
  }

  const appointment = await Appointment.create({
    patientId: req.user?.id,
    doctorId,
    appointmentDate,
    appointmentTime,
    type,
    specialty,
    reason,
    symptoms,
    duration,
    meetingLink,
    roomId,
  });

  res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    data: { appointment },
  });
}));

// Update appointment
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const appointment = await Appointment.findOne({
    where: {
      id,
      [req.user?.role === 'patient' ? 'patientId' : 'doctorId']: userId,
    },
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  // Only allow certain fields to be updated based on user role
  const allowedFields = req.user?.role === 'patient' 
    ? ['symptoms', 'reason'] 
    : ['status', 'notes', 'diagnosis', 'prescription', 'followUpRequired', 'followUpDate'];

  const updateData = Object.keys(req.body)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {} as any);

  await appointment.update(updateData);

  res.json({
    success: true,
    message: 'Appointment updated successfully',
    data: { appointment },
  });
}));

// Cancel appointment
router.patch('/:id/cancel', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const appointment = await Appointment.findOne({
    where: {
      id,
      [req.user?.role === 'patient' ? 'patientId' : 'doctorId']: userId,
    },
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }

  if (appointment.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel completed appointment',
    });
  }

  await appointment.update({ status: 'cancelled' });

  res.json({
    success: true,
    message: 'Appointment cancelled successfully',
    data: { appointment },
  });
}));

export default router;
