const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/iffahealth',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixPasswordColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting password column fix...');
    
    // Check if password column exists and has null values
    const checkQuery = `
      SELECT COUNT(*) as null_count 
      FROM users 
      WHERE password IS NULL
    `;
    
    const result = await client.query(checkQuery);
    const nullCount = parseInt(result.rows[0].null_count);
    
    console.log(`📊 Found ${nullCount} users with null passwords`);
    
    if (nullCount > 0) {
      // First, make password column nullable temporarily
      console.log('🔧 Making password column nullable temporarily...');
      await client.query('ALTER TABLE users ALTER COLUMN password DROP NOT NULL');
      
      // Set default passwords for users with null passwords
      console.log('🔧 Setting default passwords for users with null passwords...');
      const defaultPassword = 'TempPassword123!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      await client.query(
        'UPDATE users SET password = $1 WHERE password IS NULL',
        [hashedPassword]
      );
      
      // Make password column NOT NULL again
      console.log('🔧 Making password column NOT NULL again...');
      await client.query('ALTER TABLE users ALTER COLUMN password SET NOT NULL');
      
      console.log('✅ Password column fix completed successfully');
      console.log(`📧 Users with null passwords now have default password: ${defaultPassword}`);
      console.log('⚠️  Please ask these users to reset their passwords on first login');
    } else {
      console.log('✅ No users with null passwords found. Database is ready.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing password column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixPasswordColumn()
  .then(() => {
    console.log('🎉 Database migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
