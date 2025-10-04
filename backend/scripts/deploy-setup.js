const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/iffahealth',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database setup for deployment...');
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📋 Users table does not exist. Creating...');
      // Create users table with password column nullable initially
      await client.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255),
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
          "bloodType" VARCHAR(5) CHECK ("bloodType" IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
          allergies TEXT[] DEFAULT '{}',
          "medicalConditions" TEXT[] DEFAULT '{}',
          medications TEXT[] DEFAULT '{}',
          "isVerified" BOOLEAN DEFAULT false,
          role VARCHAR(10) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'nurse', 'admin')),
          "profileImage" VARCHAR(500),
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Users table created successfully');
    } else {
      console.log('📋 Users table already exists');
      
      // Check if password column exists
      const columnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'password'
        );
      `);
      
      if (!columnCheck.rows[0].exists) {
        console.log('🔧 Adding password column...');
        await client.query('ALTER TABLE users ADD COLUMN password VARCHAR(255)');
        console.log('✅ Password column added');
      }
      
      // Check for null passwords and fix them
      const nullCheck = await client.query(`
        SELECT COUNT(*) as null_count 
        FROM users 
        WHERE password IS NULL
      `);
      
      const nullCount = parseInt(nullCheck.rows[0].null_count);
      
      if (nullCount > 0) {
        console.log(`🔧 Found ${nullCount} users with null passwords. Fixing...`);
        
        // Set default passwords for users with null passwords
        const defaultPassword = 'TempPassword123!';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);
        
        await client.query(
          'UPDATE users SET password = $1 WHERE password IS NULL',
          [hashedPassword]
        );
        
        console.log('✅ Default passwords set for users with null passwords');
        console.log(`📧 Default password: ${defaultPassword}`);
      }
      
      // Make password column NOT NULL
      console.log('🔧 Making password column NOT NULL...');
      await client.query('ALTER TABLE users ALTER COLUMN password SET NOT NULL');
      console.log('✅ Password column is now NOT NULL');
    }
    
    // Create admin user if it doesn't exist
    const adminCheck = await client.query(`
      SELECT COUNT(*) as admin_count 
      FROM users 
      WHERE role = 'admin'
    `);
    
    if (parseInt(adminCheck.rows[0].admin_count) === 0) {
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
    
    console.log('🎉 Database setup completed successfully');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('🚀 Ready to start the server');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
