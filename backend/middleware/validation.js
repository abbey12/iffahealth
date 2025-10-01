const Joi = require('joi');

// Patient validation schemas
const patientSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).required(),
  last_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  date_of_birth: Joi.date().max('now').required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    region: Joi.string().required(),
    country: Joi.string().required(),
    postalCode: Joi.string().optional()
  }).optional(),
  emergency_contact: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    relationship: Joi.string().required()
  }).optional(),
  medical_history: Joi.array().items(Joi.string()).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  current_medications: Joi.array().items(Joi.string()).optional()
});

const patientUpdateSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).optional(),
  last_name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  date_of_birth: Joi.date().max('now').optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    region: Joi.string().required(),
    country: Joi.string().required(),
    postalCode: Joi.string().optional()
  }).optional(),
  emergency_contact: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    relationship: Joi.string().required()
  }).optional(),
  medical_history: Joi.array().items(Joi.string()).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  current_medications: Joi.array().items(Joi.string()).optional()
});

// Appointment validation schema
const appointmentSchema = Joi.object({
  patient_id: Joi.string().uuid().required(),
  doctor_id: Joi.string().uuid().required(),
  appointment_date: Joi.date().required(),
  appointment_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  type: Joi.string().valid('video', 'in-person').required(),
  status: Joi.string().valid('scheduled', 'confirmed', 'completed', 'cancelled').optional(),
  notes: Joi.string().max(1000).optional(),
  location: Joi.string().max(200).optional(),
  meeting_link: Joi.string().uri().optional()
});

// Medication validation schema
const medicationSchema = Joi.object({
  patient_id: Joi.string().uuid().required(),
  name: Joi.string().min(2).max(200).required(),
  dosage: Joi.string().min(1).max(100).required(),
  frequency: Joi.string().min(1).max(100).required(),
  start_date: Joi.date().max('now').required(),
  end_date: Joi.date().min(Joi.ref('start_date')).optional(),
  prescribed_by: Joi.string().uuid().required(),
  instructions: Joi.string().max(500).optional(),
  status: Joi.string().valid('active', 'paused', 'completed').optional(),
  side_effects: Joi.array().items(Joi.string()).optional()
});

// Lab test validation schema
const labTestSchema = Joi.object({
  patient_id: Joi.string().uuid().required(),
  test_name: Joi.string().min(2).max(200).required(),
  test_type: Joi.string().min(2).max(100).required(),
  ordered_by: Joi.string().uuid().required(),
  test_date: Joi.date().min('now').required(),
  test_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  location: Joi.string().min(2).max(200).required(),
  status: Joi.string().valid('scheduled', 'pending', 'completed', 'cancelled').optional(),
  results: Joi.object().optional(),
  notes: Joi.string().max(1000).optional()
});

// Health record validation schema
const healthRecordSchema = Joi.object({
  patient_id: Joi.string().uuid().required(),
  type: Joi.string().valid('consultation', 'diagnosis', 'treatment', 'procedure', 'vaccination').required(),
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(2000).optional(),
  record_date: Joi.date().max('now').required(),
  doctor_id: Joi.string().uuid().optional(),
  hospital_id: Joi.string().uuid().optional(),
  attachments: Joi.array().items(Joi.string().uri()).optional()
});

// Validation middleware functions
const validatePatient = (req, res, next) => {
  const { error } = patientSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validatePatientUpdate = (req, res, next) => {
  const { error } = patientUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateAppointment = (req, res, next) => {
  const { error } = appointmentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateMedication = (req, res, next) => {
  const { error } = medicationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateLabTest = (req, res, next) => {
  const { error } = labTestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateHealthRecord = (req, res, next) => {
  const { error } = healthRecordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

module.exports = {
  validatePatient,
  validatePatientUpdate,
  validateAppointment,
  validateMedication,
  validateLabTest,
  validateHealthRecord
};
