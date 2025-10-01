/*
  Script: Create admin user
  - Creates admin@iffahealth.com with password123
  - Uses bcrypt to hash the password
*/

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const dbConfig = connectionString
  ? { connectionString, ssl: false }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || 'iffahealth',
      user: process.env.DB_USER || 'postgres',
      password:
        process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== null
          ? String(process.env.DB_PASSWORD)
          : undefined,
      ssl: (() => {
        const flag = String(process.env.DB_SSL || '').toLowerCase();
        if (flag === '1' || flag === 'true' || flag === 'yes') {
          return { rejectUnauthorized: false };
        }
        return false;
      })(),
    };

console.log('🗄️  DB config for admin creation:', {
  hasConnectionString: Boolean(connectionString),
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: Boolean(dbConfig.ssl),
});

const pool = new Pool(dbConfig);

async function run() {
  const client = await pool.connect();
  try {
    console.log('👑 Creating admin user...');
    
    const email = 'admin@iffahealth.com';
    const password = 'password123';
    const role = 'admin';
    
    // Check if admin already exists
    const existingAdmin = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin user already exists:', existingAdmin.rows[0]);
      return;
    }
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert admin user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, role, is_verified, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING id, email, role, created_at`,
      [email, passwordHash, role, true]
    );
    
    const admin = result.rows[0];
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Role:', admin.role);
    console.log('🆔 ID:', admin.id);
    console.log('📅 Created:', admin.created_at);
    
    // Verify the user can be found
    const verifyResult = await client.query(
      'SELECT id, email, role, is_verified FROM users WHERE email = $1',
      [email]
    );
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Verification successful - admin user found in database');
    } else {
      console.log('❌ Verification failed - admin user not found');
    }
    
  } catch (err) {
    console.error('❌ Admin creation failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
