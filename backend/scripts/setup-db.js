const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function setupDatabase() {
  try {
    console.log('🚀 Setting up IFFAHEALTH database...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../sql/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await query(schema);
    
    console.log('✅ Database schema created successfully!');
    
    // Only insert sample data in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Development mode detected - inserting sample data...');
      await insertSampleData();
      console.log('✅ Sample data inserted successfully!');
    } else {
      console.log('🚀 Production mode - skipping sample data insertion');
    }
    
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

async function insertSampleData() {
  try {
    // Insert sample users
    const users = [
      {
        email: 'patient@iffahealth.com',
        password_hash: '$2b$10$rQZ8K9XvY2wE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3zA4bC5dE6f', // password: patient123
        role: 'patient'
      },
      {
        email: 'doctor@iffahealth.com',
        password_hash: '$2b$10$rQZ8K9XvY2wE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3zA4bC5dE6f', // password: doctor123
        role: 'doctor'
      }
    ];
    
    for (const user of users) {
      await query(
        'INSERT INTO users (email, password_hash, role, email_verified) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
        [user.email, user.password_hash, user.role, true]
      );
    }
    
    // Get the user IDs
    const patientUser = await query('SELECT id FROM users WHERE email = $1', ['patient@iffahealth.com']);
    const doctorUser = await query('SELECT id FROM users WHERE email = $1', ['doctor@iffahealth.com']);
    
    if (patientUser.rows.length > 0 && doctorUser.rows.length > 0) {
      const patientUserId = patientUser.rows[0].id;
      const doctorUserId = doctorUser.rows[0].id;
      
      // Insert sample patient
      await query(`
        INSERT INTO patients (user_id, first_name, last_name, phone, date_of_birth, gender, address, emergency_contact, medical_history, allergies, current_medications)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `, [
        patientUserId,
        'Kwame',
        'Asante',
        '+233 24 123 4567',
        '1985-06-15',
        'male',
        JSON.stringify({
          street: '123 Independence Avenue',
          city: 'Accra',
          region: 'Greater Accra',
          country: 'Ghana',
          postalCode: 'GA-123-4567'
        }),
        JSON.stringify({
          name: 'Ama Asante',
          phone: '+233 24 987 6543',
          relationship: 'Spouse'
        }),
        ['Hypertension', 'Type 2 Diabetes'],
        ['Penicillin', 'Shellfish'],
        ['Metformin', 'Lisinopril']
      ]);
      
      // Insert sample doctor
      await query(`
        INSERT INTO doctors (user_id, first_name, last_name, specialty, license_number, phone, hospital_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [
        doctorUserId,
        'Dr. Akua',
        'Mensah',
        'General Practitioner',
        'GPMD-12345',
        '+233 20 111 2222',
        'iffa-health-accra'
      ]);
      
      // Get patient and doctor IDs
      const patient = await query('SELECT id FROM patients WHERE user_id = $1', [patientUserId]);
      const doctor = await query('SELECT id FROM doctors WHERE user_id = $1', [doctorUserId]);
      
      if (patient.rows.length > 0 && doctor.rows.length > 0) {
        const patientId = patient.rows[0].id;
        const doctorId = doctor.rows[0].id;
        
        // Insert sample appointment
        await query(`
          INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, status, notes, meeting_link)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `, [
          patientId,
          doctorId,
          '2024-07-25',
          '10:00:00',
          'video',
          'confirmed',
          'Follow-up on blood pressure',
          'https://meet.google.com/apt-001-abc'
        ]);
        
        // Insert sample medication
        await query(`
          INSERT INTO medications (patient_id, prescribed_by, name, dosage, frequency, instructions, start_date, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `, [
          patientId,
          doctorId,
          'Metformin',
          '500mg',
          'Twice daily',
          'Take with food',
          '2024-01-01',
          'active'
        ]);
        
        // Insert sample lab test
        await query(`
          INSERT INTO lab_tests (patient_id, ordered_by, test_name, test_type, test_date, test_time, location, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `, [
          patientId,
          doctorId,
          'Fasting Blood Sugar',
          'Blood Test',
          '2024-07-28',
          '07:00:00',
          'Accra Lab Services',
          'scheduled'
        ]);
      }
    }
    
  } catch (error) {
    console.error('Error inserting sample data:', error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✅ Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
