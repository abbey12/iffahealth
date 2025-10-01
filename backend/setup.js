#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
};

async function setupDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔄 Creating database schema...');
    
    // Execute schema
    await pool.query(schema);
    console.log('✅ Database schema created successfully');
    
    // Test with sample data
    console.log('🔄 Testing with sample data...');
    const testResult = await pool.query('SELECT COUNT(*) FROM patients');
    console.log(`✅ Found ${testResult.rows[0].count} patients in database`);
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your .env file with the correct database credentials');
    console.log('2. Run: npm install');
    console.log('3. Run: npm run dev');
    console.log('4. Test API at: http://localhost:3000/health');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
