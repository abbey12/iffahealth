#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

// Test Supabase connection
async function testConnection() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Testing Supabase connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
    
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].postgres_version);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file has correct credentials');
    console.log('2. Verify your Supabase project is active');
    console.log('3. Check if your IP is whitelisted in Supabase');
  } finally {
    await pool.end();
  }
}

testConnection();
