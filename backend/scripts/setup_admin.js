const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
  try {
    console.log('Setting up admin users table...');

    // Create admin_users table
    await query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        permissions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    console.log('Admin users table created successfully');

    // Create default admin user
    const adminEmail = 'admin@iffahealth.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Check if admin already exists
    const existingAdmin = await query(
      'SELECT id FROM admin_users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length === 0) {
      await query(`
        INSERT INTO admin_users (email, password, name, role, permissions)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        adminEmail,
        hashedPassword,
        'System Administrator',
        'super_admin',
        JSON.stringify([
          'users:read',
          'users:write',
          'users:delete',
          'doctors:read',
          'doctors:write',
          'doctors:delete',
          'patients:read',
          'patients:write',
          'patients:delete',
          'appointments:read',
          'appointments:write',
          'appointments:delete',
          'analytics:read',
          'settings:read',
          'settings:write'
        ])
      ]);

      console.log('Default admin user created:');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
    } else {
      console.log('Admin user already exists');
    }

    console.log('Admin setup completed successfully!');

  } catch (error) {
    console.error('Error setting up admin:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  setupAdmin()
    .then(() => {
      console.log('Admin setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Admin setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupAdmin;
