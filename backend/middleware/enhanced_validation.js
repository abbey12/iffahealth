const { body, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Patient profile validation
const validatePatientProfile = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('bloodType')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(value);
    })
    .withMessage('Please provide a valid blood type'),
  
  body('height')
    .optional()
    .isFloat({ min: 50, max: 250 })
    .withMessage('Height must be between 50 and 250 cm'),
  
  body('weight')
    .optional()
    .isFloat({ min: 20, max: 300 })
    .withMessage('Weight must be between 20 and 300 kg'),
  
  body('maritalStatus')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      return ['single', 'married', 'divorced', 'widowed', 'other'].includes(value);
    })
    .withMessage('Please provide a valid marital status'),
  
  body('insuranceType')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      return ['primary', 'secondary', 'tertiary'].includes(value);
    })
    .withMessage('Insurance type must be primary, secondary, or tertiary'),
  
  body('preferredDoctorGender')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      return ['male', 'female', 'no-preference'].includes(value);
    })
    .withMessage('Preferred doctor gender must be male, female, or no-preference'),
  
  body('preferredAppointmentTime')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      return ['morning', 'afternoon', 'evening', 'any'].includes(value);
    })
    .withMessage('Preferred appointment time must be morning, afternoon, evening, or any'),
  
  body('consentToTelehealth')
    .optional()
    .isBoolean()
    .withMessage('Consent to telehealth must be a boolean value'),
  
  body('consentToDataSharing')
    .optional()
    .isBoolean()
    .withMessage('Consent to data sharing must be a boolean value'),
  
  handleValidationErrors
];

// Doctor profile validation
const validateDoctorProfile = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('specialty')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialty must be between 2 and 100 characters'),
  
  body('licenseNumber')
    .optional()
    .isLength({ min: 5, max: 50 })
    .withMessage('License number must be between 5 and 50 characters'),
  
  body('graduationYear')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .withMessage('Graduation year must be a valid year'),
  
  body('consultationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a positive number'),
  
  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience years must be between 0 and 50'),
  
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('Availability must be a boolean value'),
  
  handleValidationErrors
];

// Prescription validation
const validatePrescription = [
  body('patient_id')
    .notEmpty()
    .isUUID()
    .withMessage('Valid patient ID is required'),
  
  body('doctor_id')
    .notEmpty()
    .isUUID()
    .withMessage('Valid doctor ID is required'),
  
  body('prescription_date')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid prescription date is required'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  
  body('follow_up_date')
    .optional()
    .isISO8601()
    .withMessage('Follow-up date must be a valid date'),
  
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Items must be an array with at least one item'),
  
  body('items.*.medicationName')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Medication name must be between 2 and 200 characters'),
  
  body('items.*.dosage')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Dosage must be between 1 and 100 characters'),
  
  body('items.*.frequency')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Frequency must be between 1 and 100 characters'),
  
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  handleValidationErrors
];

// Lab test validation
const validateLabTest = [
  body('patient_id')
    .notEmpty()
    .isUUID()
    .withMessage('Valid patient ID is required'),
  
  body('test_name')
    .notEmpty()
    .isLength({ min: 2, max: 200 })
    .withMessage('Test name must be between 2 and 200 characters'),
  
  body('test_type')
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('Test type must be between 2 and 100 characters'),
  
  body('ordered_by')
    .notEmpty()
    .isUUID()
    .withMessage('Valid doctor ID is required'),
  
  body('test_date')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid test date is required'),
  
  body('test_time')
    .notEmpty()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Test time must be in HH:MM format'),
  
  body('location')
    .notEmpty()
    .isLength({ min: 2, max: 200 })
    .withMessage('Location must be between 2 and 200 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  
  handleValidationErrors
];

// Medical record validation
const validateMedicalRecord = [
  body('patient_id')
    .notEmpty()
    .isUUID()
    .withMessage('Valid patient ID is required'),
  
  body('type')
    .notEmpty()
    .isIn(['consultation', 'diagnosis', 'treatment', 'procedure', 'vaccination', 'lab_result', 'prescription'])
    .withMessage('Valid record type is required'),
  
  body('title')
    .notEmpty()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  
  body('record_date')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid record date is required'),
  
  body('doctor_id')
    .optional()
    .isUUID()
    .withMessage('Valid doctor ID is required'),
  
  body('hospital_id')
    .optional()
    .isUUID()
    .withMessage('Valid hospital ID is required'),
  
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  
  handleValidationErrors
];

// Appointment validation
const validateAppointment = [
  body('patient_id')
    .notEmpty()
    .isUUID()
    .withMessage('Valid patient ID is required'),
  
  body('doctor_id')
    .notEmpty()
    .isUUID()
    .withMessage('Valid doctor ID is required'),
  
  body('appointment_date')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid appointment date is required'),
  
  body('appointment_time')
    .notEmpty()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Appointment time must be in HH:MM format'),
  
  body('type')
    .notEmpty()
    .isIn(['video', 'in-person'])
    .withMessage('Appointment type must be video or in-person'),
  
  body('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid appointment status'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  
  body('meeting_link')
    .optional()
    .isURL()
    .withMessage('Meeting link must be a valid URL'),
  
  handleValidationErrors
];

// Medication validation
const validateMedication = [
  body('patient_id')
    .notEmpty()
    .isUUID()
    .withMessage('Valid patient ID is required'),
  
  body('name')
    .notEmpty()
    .isLength({ min: 2, max: 200 })
    .withMessage('Medication name must be between 2 and 200 characters'),
  
  body('dosage')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Dosage must be between 1 and 100 characters'),
  
  body('frequency')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Frequency must be between 1 and 100 characters'),
  
  body('start_date')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  body('prescribed_by')
    .optional()
    .isUUID()
    .withMessage('Valid doctor ID is required'),
  
  body('instructions')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Instructions must not exceed 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'paused', 'completed', 'discontinued'])
    .withMessage('Invalid medication status'),
  
  body('side_effects')
    .optional()
    .isArray()
    .withMessage('Side effects must be an array'),
  
  handleValidationErrors
];

// Payout request validation
const validatePayoutRequest = [
  body('doctor_id')
    .notEmpty()
    .isUUID()
    .withMessage('Valid doctor ID is required'),
  
  body('amount')
    .notEmpty()
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
  
  body('method')
    .notEmpty()
    .isIn(['mobile_money', 'bank_transfer', 'paypal'])
    .withMessage('Valid payout method is required'),
  
  body('account_details')
    .notEmpty()
    .isObject()
    .withMessage('Account details must be an object'),
  
  handleValidationErrors
];

// Notification validation
const validateNotification = [
  body('user_id')
    .notEmpty()
    .isUUID()
    .withMessage('Valid user ID is required'),
  
  body('type')
    .notEmpty()
    .isIn(['appointment', 'prescription', 'lab_result', 'payment', 'general'])
    .withMessage('Valid notification type is required'),
  
  body('title')
    .notEmpty()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  
  body('message')
    .notEmpty()
    .isLength({ min: 2, max: 1000 })
    .withMessage('Message must be between 2 and 1000 characters'),
  
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  body('query')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// File upload validation
const validateFileUpload = [
  body('fileUrl')
    .notEmpty()
    .isURL()
    .withMessage('Valid file URL is required'),
  
  body('fileName')
    .notEmpty()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be between 1 and 255 characters'),
  
  body('fileType')
    .notEmpty()
    .isIn(['image', 'document', 'video', 'audio'])
    .withMessage('Valid file type is required'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validatePatientProfile,
  validateDoctorProfile,
  validatePrescription,
  validateLabTest,
  validateMedicalRecord,
  validateAppointment,
  validateMedication,
  validatePayoutRequest,
  validateNotification,
  validateSearch,
  validateFileUpload
};
