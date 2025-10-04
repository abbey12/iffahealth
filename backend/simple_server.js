const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 80;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/iffahealth',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Production security middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com', 'https://www.your-domain.com'] 
    : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'IFFAHEALTH API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    
    res.json({
      success: true,
      message: 'Database connection successful',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Basic auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token: 'dummy-token-for-testing'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Setup database on startup
const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up database...');
    const client = await pool.connect();
    
    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "firstName" VARCHAR(50) NOT NULL,
        "lastName" VARCHAR(50) NOT NULL,
        phone VARCHAR(15) NOT NULL,
        "dateOfBirth" DATE NOT NULL,
        gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL DEFAULT 'Ghana',
        "emergencyContact" VARCHAR(100) NOT NULL,
        "emergencyPhone" VARCHAR(15) NOT NULL,
        "isVerified" BOOLEAN DEFAULT false,
        role VARCHAR(10) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'nurse', 'admin')),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Check if admin user exists
    const adminCheck = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      ['admin']
    );
    
    if (parseInt(adminCheck.rows[0].count) === 0) {
      console.log('👤 Creating admin user...');
      const adminPassword = await bcrypt.hash('password123', 12);
      
      await client.query(`
        INSERT INTO users (
          email, password, "firstName", "lastName", phone, 
          "dateOfBirth", gender, address, city, country, 
          "emergencyContact", "emergencyPhone", role, "isVerified"
        ) VALUES (
          'admin@iffahealth.com', $1, 'Admin', 'User', '+233555000000',
          '1990-01-01', 'other', 'Admin Address', 'Accra', 'Ghana',
          'Emergency Contact', '+233555000001', 'admin', true
        )
      `, [adminPassword]);
      
      console.log('✅ Admin user created: admin@iffahealth.com / password123');
    } else {
      console.log('👤 Admin user already exists');
    }
    
    client.release();
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    // Don't exit, let the server start
  }
};

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } else {
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 IFFAHEALTH API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Setup database after server starts
  setupDatabase();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

module.exports = app;
