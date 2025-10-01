const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Only log queries in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Query executed', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    // Always log errors, but with different levels
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Query error:', error);
    } else {
      console.error('Database query error:', error.message);
    }
    throw error;
  }
};

// Helper function to get a client from the pool
const getClient = async () => {
  return await pool.connect();
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down database connection pool...');
  await pool.end();
  process.exit(0);
});

module.exports = {
  pool,
  query,
  getClient
};
