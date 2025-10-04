const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Import enhanced routes
const enhancedPatientRoutes = require('./routes/enhanced_patients');
const enhancedDoctorRoutes = require('./routes/enhanced_doctors');
const enhancedPrescriptionRoutes = require('./routes/enhanced_prescriptions');
const enhancedPayoutRoutes = require('./routes/enhanced_payouts');
const enhancedLabTestRoutes = require('./routes/enhanced_lab_tests');
const enhancedMedicalRecordRoutes = require('./routes/enhanced_medical_records');
const enhancedNotificationRoutes = require('./routes/enhanced_notifications');
const videoCallRoutes = require('./routes/video');

// Import existing routes
const appointmentRoutes = require('./routes/appointments');
const medicationRoutes = require('./routes/medications');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');

// Import database connection
const { query } = require('./config/database');

// Run database setup before starting server
const setupDatabase = async () => {
  try {
    console.log('🔧 Running database setup...');
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    await execAsync('node scripts/deploy-setup.js');
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    // Don't exit, let the server start and handle it gracefully
  }
};

// Run database setup
setupDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting - disabled in development
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  console.log('Rate limiting enabled for production');
} else {
  console.log('Rate limiting disabled for development');
}

// CORS configuration - Simplified and working approach
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3001',
  'http://localhost:8081',
  'http://10.0.2.2:3000',  // Android emulator host
  'http://10.0.2.2:8081',  // Android emulator host
  'http://192.168.1.108:3000',
  'http://192.168.1.108:8081',
  'http://10.45.177.148:3000',
  'http://10.45.177.148:8081',
  'http://10.135.104.225:3000',
  'http://10.135.104.225:8081',
  // Host machine IP currently used by the Android app
  'http://10.95.157.225:3000',
  'http://10.95.157.225:8081'
];

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await query('SELECT NOW()');
    res.status(200).json({
      success: true,
      message: 'IFFAHEALTH Enhanced API is running',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '2.0.0',
      features: [
        'Enhanced Patient Management',
        'Enhanced Doctor Management',
        'Prescription Management',
        'Lab Test Management',
        'Medical Records Management',
        'Payout Management',
        'Notification System',
        'Payment Integration',
        'Video Call Integration'
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'IFFAHEALTH Enhanced API Documentation',
    version: '2.0.0',
    endpoints: {
      auth: {
        base: '/api/auth',
        endpoints: [
          'POST /register - Register new user',
          'POST /login - User login',
          'POST /logout - User logout',
          'POST /refresh - Refresh token',
          'POST /forgot-password - Forgot password',
          'POST /reset-password - Reset password'
        ]
      },
      patients: {
        base: '/api/patients',
        endpoints: [
          'GET /:id - Get patient profile',
          'PUT /:id - Update patient profile',
          'POST /:id/complete-profile - Complete patient profile',
          'GET /:id/appointments - Get patient appointments',
          'GET /:id/appointments/upcoming - Get upcoming appointments',
          'GET /:id/medications - Get patient medications',
          'GET /:id/medications/current - Get current medications',
          'GET /:id/lab-tests - Get patient lab tests',
          'GET /:id/lab-tests/upcoming - Get upcoming lab tests',
          'GET /:id/health-records - Get health records',
          'GET /:id/health-records/recent - Get recent health records',
          'GET /:id/prescriptions - Get patient prescriptions',
          'GET /:id/notifications - Get patient notifications'
        ]
      },
      doctors: {
        base: '/api/doctors',
        endpoints: [
          'GET /:id - Get doctor profile',
          'PUT /:id - Update doctor profile',
          'POST /:id/complete-profile - Complete doctor profile',
          'GET /:id/appointments - Get doctor appointments',
          'GET /:id/patients - Get doctor patients',
          'GET /:id/earnings - Get doctor earnings',
          'GET /:id/prescriptions - Get doctor prescriptions',
          'GET /:id/lab-tests - Get doctor lab tests',
          'GET /:id/medical-records - Get doctor medical records',
          'GET /:id/availability - Get doctor availability',
          'GET / - Search doctors'
        ]
      },
      prescriptions: {
        base: '/api/prescriptions',
        endpoints: [
          'POST / - Create prescription',
          'GET /:id - Get prescription by ID',
          'PUT /:id - Update prescription',
          'GET /patient/:patientId - Get patient prescriptions',
          'GET /doctor/:doctorId - Get doctor prescriptions',
          'POST /:id/items - Add prescription item',
          'PUT /:id/items/:itemId - Update prescription item',
          'DELETE /:id/items/:itemId - Delete prescription item',
          'GET /:id/items - Get prescription items',
          'GET /medications/search - Search medications',
          'GET /stats/:doctorId - Get prescription statistics'
        ]
      },
      labTests: {
        base: '/api/lab-tests',
        endpoints: [
          'POST / - Create lab test',
          'GET /:id - Get lab test by ID',
          'PUT /:id - Update lab test',
          'GET /patient/:patientId - Get patient lab tests',
          'GET /patient/:patientId/upcoming - Get upcoming lab tests',
          'GET /doctor/:doctorId - Get doctor lab tests',
          'POST /:id/results - Add lab test results',
          'POST /:id/notes - Add doctor notes',
          'GET /types/list - Get lab test types',
          'GET /stats/:doctorId - Get lab test statistics',
          'GET /search - Search lab tests'
        ]
      },
      medicalRecords: {
        base: '/api/medical-records',
        endpoints: [
          'POST / - Create medical record',
          'GET /:id - Get medical record by ID',
          'PUT /:id - Update medical record',
          'DELETE /:id - Delete medical record',
          'GET /patient/:patientId - Get patient medical records',
          'GET /patient/:patientId/recent - Get recent medical records',
          'GET /doctor/:doctorId - Get doctor medical records',
          'GET /search - Search medical records',
          'GET /types/list - Get medical record types',
          'GET /stats/:doctorId - Get medical record statistics',
          'POST /:id/attachments - Upload file attachment',
          'DELETE /:id/attachments/:attachmentIndex - Remove attachment'
        ]
      },
      payouts: {
        base: '/api/payouts',
        endpoints: [
          'GET /earnings/:doctorId - Get doctor earnings',
          'POST /request - Create payout request',
          'GET /requests/:doctorId - Get payout requests',
          'GET /requests/:doctorId/:requestId - Get payout request by ID',
          'PUT /requests/:doctorId/:requestId/cancel - Cancel payout request',
          'GET /methods - Get payout methods',
          'GET /history/:doctorId - Get payout history',
          'GET /stats/:doctorId - Get payout statistics',
          'PUT /admin/requests/:requestId/status - Update payout status (Admin)'
        ]
      },
      notifications: {
        base: '/api/notifications',
        endpoints: [
          'GET /user/:userId - Get user notifications',
          'GET /user/:userId/unread-count - Get unread count',
          'PUT /:id/read - Mark notification as read',
          'PUT /user/:userId/read-all - Mark all as read',
          'PUT /:id/archive - Archive notification',
          'DELETE /:id - Delete notification',
          'POST / - Create notification',
          'GET /preferences/:userId - Get notification preferences',
          'PUT /preferences/:userId - Update notification preferences',
          'POST /appointment-reminder - Send appointment reminder',
          'POST /lab-result - Send lab result notification',
          'POST /prescription - Send prescription notification',
          'POST /payment - Send payment notification',
          'GET /types/list - Get notification types'
        ]
      },
      appointments: {
        base: '/api/appointments',
        endpoints: [
          'GET / - Get appointments',
          'POST / - Create appointment',
          'PUT /:id - Update appointment',
          'DELETE /:id - Cancel appointment',
          'GET /:id - Get appointment by ID'
        ]
      },
      medications: {
        base: '/api/medications',
        endpoints: [
          'GET / - Get medications',
          'POST / - Create medication',
          'PUT /:id - Update medication',
          'DELETE /:id - Delete medication',
          'GET /:id - Get medication by ID'
        ]
      }
    },
    features: {
      authentication: 'JWT-based authentication with role-based access control',
      patientManagement: 'Comprehensive patient profile and health data management',
      doctorManagement: 'Complete doctor profile and practice management',
      appointmentScheduling: 'Video call appointment booking and management',
      prescriptionManagement: 'Digital prescription creation and management',
      labTestManagement: 'Lab test ordering, tracking, and results management',
      medicalRecords: 'Digital medical records with file attachments',
      payoutSystem: 'Doctor earnings tracking and payout management',
      notificationSystem: 'Real-time notifications for all app activities',
      paymentIntegration: 'Paystack payment processing integration',
      videoCalls: 'Agora.io video call integration for telehealth',
      searchAndFiltering: 'Advanced search and filtering capabilities',
      analytics: 'Comprehensive analytics and reporting',
      fileManagement: 'Secure file upload and management',
      mobileOptimized: 'Mobile-first responsive design'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/patients', enhancedPatientRoutes);
app.use('/api/doctors', enhancedDoctorRoutes);
app.use('/api/prescriptions', enhancedPrescriptionRoutes);
app.use('/api/payouts', enhancedPayoutRoutes);
app.use('/api/lab-tests', enhancedLabTestRoutes);
app.use('/api/medical-records', enhancedMedicalRecordRoutes);
app.use('/api/notifications', enhancedNotificationRoutes);
app.use('/api/video', videoCallRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to IFFAHEALTH Enhanced API',
    version: '2.0.0',
    documentation: '/api/docs',
    health: '/health',
    features: [
      'Enhanced Patient Management',
      'Enhanced Doctor Management', 
      'Prescription Management',
      'Lab Test Management',
      'Medical Records Management',
      'Payout Management',
      'Notification System',
      'Payment Integration',
      'Video Call Integration'
    ],
    status: 'Production Ready'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    availableEndpoints: '/api/docs'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);
  
  // Log error details
  console.error('Error Stack:', error.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('Request Headers:', req.headers);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error
    })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚀 IFFAHEALTH Enhanced API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
    console.log(`📱 CORS enabled for: http://localhost:3000, http://localhost:3001, http://localhost:8081`);
  } else {
    console.log(`IFFAHEALTH Enhanced API server started on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  }
});

module.exports = app;
