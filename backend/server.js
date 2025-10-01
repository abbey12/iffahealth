const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const patientRoutes = require('./routes/enhanced_patients');
const appointmentRoutes = require('./routes/appointments');
const medicationRoutes = require('./routes/medications');
const labTestRoutes = require('./routes/labTests');
const healthRecordRoutes = require('./routes/healthRecords');
const doctorRoutes = require('./routes/enhanced_doctors');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const testPaymentRoutes = require('./routes/test-payments');
const videoRoutes = require('./routes/video');

// Import database connection
const { query } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  }
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
    'http://localhost:3000', 
    'http://localhost:8081',
    'http://192.168.1.108:3000',
    'http://192.168.1.108:8081',
    'http://10.45.177.148:3000',
    'http://10.45.177.148:8081'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

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
      message: 'IFFAHEALTH API is running',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/lab-tests', labTestRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/test-payments', testPaymentRoutes);
app.use('/api/video', videoRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to IFFAHEALTH API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚀 IFFAHEALTH API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Health check: http://192.168.1.108:${PORT}/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
  } else {
    console.log(`IFFAHEALTH API server started on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  }
});

module.exports = app;
