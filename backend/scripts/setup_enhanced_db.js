const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupEnhancedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up IFFAHEALTH Enhanced Database...');
    
    // Read the enhanced schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../database/enhanced_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Drop existing tables if they exist (in correct order due to foreign keys)
    console.log('🗑️ Dropping existing tables...');
    const dropTables = [
      'DROP TABLE IF EXISTS insurance_partners CASCADE;',
      'DROP TABLE IF EXISTS partner_pharmacies CASCADE;',
      'DROP TABLE IF EXISTS lab_centers CASCADE;',
      'DROP TABLE IF EXISTS payment_transactions CASCADE;',
      'DROP TABLE IF EXISTS video_call_sessions CASCADE;',
      'DROP TABLE IF EXISTS emergency_alerts CASCADE;',
      'DROP TABLE IF EXISTS notifications CASCADE;',
      'DROP TABLE IF EXISTS payout_requests CASCADE;',
      'DROP TABLE IF EXISTS doctor_earnings CASCADE;',
      'DROP TABLE IF EXISTS health_records CASCADE;',
      'DROP TABLE IF EXISTS lab_tests CASCADE;',
      'DROP TABLE IF EXISTS prescription_items CASCADE;',
      'DROP TABLE IF EXISTS prescriptions CASCADE;',
      'DROP TABLE IF EXISTS medications CASCADE;',
      'DROP TABLE IF EXISTS appointments CASCADE;',
      'DROP TABLE IF EXISTS doctors CASCADE;',
      'DROP TABLE IF EXISTS patients CASCADE;',
      'DROP TABLE IF EXISTS hospitals CASCADE;',
      'DROP TABLE IF EXISTS users CASCADE;',
      'DROP TYPE IF EXISTS notification_status CASCADE;',
      'DROP TYPE IF EXISTS notification_type CASCADE;',
      'DROP TYPE IF EXISTS prescription_status CASCADE;',
      'DROP TYPE IF EXISTS payout_method CASCADE;',
      'DROP TYPE IF EXISTS payout_status CASCADE;',
      'DROP TYPE IF EXISTS health_record_type CASCADE;',
      'DROP TYPE IF EXISTS lab_test_status CASCADE;',
      'DROP TYPE IF EXISTS medication_status CASCADE;',
      'DROP TYPE IF EXISTS appointment_status CASCADE;',
      'DROP TYPE IF EXISTS appointment_type CASCADE;',
      'DROP TYPE IF EXISTS user_role CASCADE;',
      'DROP TYPE IF EXISTS gender_type CASCADE;'
    ];
    
    for (const dropQuery of dropTables) {
      try {
        await client.query(dropQuery);
      } catch (error) {
        // Ignore errors for non-existent tables
        console.log(`⚠️ Warning: ${error.message}`);
      }
    }
    
    // Execute the schema
    console.log('📋 Creating enhanced database schema...');
    await client.query(schema);
    
    console.log('✅ Enhanced database schema created successfully!');
    
    // Insert sample data
    console.log('📊 Inserting sample data...');
    
    // Insert sample hospitals
    await client.query(`
      INSERT INTO hospitals (name, address, phone, email, website, license_number) VALUES
      ('Korle-Bu Teaching Hospital', '{"street": "Korle-Bu", "city": "Accra", "region": "Greater Accra", "country": "Ghana", "postalCode": "GA-184"}', '+233 302 665 401', 'info@kbth.gov.gh', 'https://kbth.gov.gh', 'HOSP-001'),
      ('37 Military Hospital', '{"street": "37 Military Hospital", "city": "Accra", "region": "Greater Accra", "country": "Ghana", "postalCode": "GA-184"}', '+233 302 777 777', 'info@37military.gov.gh', 'https://37military.gov.gh', 'HOSP-002'),
      ('Komfo Anokye Teaching Hospital', '{"street": "Komfo Anokye", "city": "Kumasi", "region": "Ashanti", "country": "Ghana", "postalCode": "AK-002"}', '+233 322 229 229', 'info@kath.gov.gh', 'https://kath.gov.gh', 'HOSP-003')
      ;
    `);
    
    console.log('✅ Sample hospitals inserted');
    
    // Insert sample lab centers
    await client.query(`
      INSERT INTO lab_centers (
        name, description, address, city, region, country, latitude, longitude,
        phone, email, website, services, operating_hours, coverage_radius_km, rating, total_reviews
      ) VALUES
      (
        'Accra Advanced Diagnostics',
        'Full-service diagnostic laboratory specializing in imaging and pathology.',
        '{"street": "12 Labone Crescent", "city": "Accra", "region": "Greater Accra", "country": "Ghana", "postalCode": "GA-107"}',
        'Accra',
        'Greater Accra',
        'Ghana',
        5.587170,
        -0.173530,
        '+233 302 555 123',
        'info@accraadvanceddiagnostics.com',
        'https://accraadvanceddiagnostics.com',
        '{"Blood Tests", "MRI", "CT Scan", "Ultrasound"}',
        '{"monday_friday": {"open": "07:00", "close": "18:00"}, "saturday": {"open": "08:00", "close": "14:00"}}',
        15.0,
        4.8,
        128
      ),
      (
        'Kumasi Medical Labs',
        'Regional lab with comprehensive test coverage and mobile phlebotomy services.',
        '{"street": "45 Clinic Road", "city": "Kumasi", "region": "Ashanti", "country": "Ghana", "postalCode": "AK-104"}',
        'Kumasi',
        'Ashanti',
        'Ghana',
        6.700070,
        -1.617889,
        '+233 322 204 567',
        'support@kumasimedlabs.com',
        'https://kumasimedlabs.com',
        '{"Blood Tests", "COVID-19 PCR", "X-Ray"}',
        '{"monday_friday": {"open": "07:30", "close": "17:30"}, "saturday": {"open": "09:00", "close": "13:00"}}',
        20.0,
        4.6,
        86
      )
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('✅ Sample lab centers inserted');

    // Insert sample partner pharmacies
    await client.query(`
      INSERT INTO partner_pharmacies (
        name, description, address, city, region, country, latitude, longitude,
        phone, email, website, services, operating_hours, delivery_options,
        accepts_insurance, insurance_providers, coverage_radius_km, rating, total_reviews
      ) VALUES
      (
        'Iffa Pharmacy East Legon',
        'Community pharmacy offering prescription fulfillment and chronic care support.',
        '{"street": "18 Boundary Road", "city": "Accra", "region": "Greater Accra", "country": "Ghana", "postalCode": "GA-225"}',
        'Accra',
        'Greater Accra',
        'Ghana',
        5.630390,
        -0.173980,
        '+233 302 668 900',
        'eastlegon@iffapharmacy.com',
        'https://iffapharmacy.com/east-legon',
        '{"Prescription Refill", "Health Screening", "Vaccinations"}',
        '{"monday_friday": {"open": "08:00", "close": "21:00"}, "weekend": {"open": "09:00", "close": "20:00"}}',
        '{"in-store", "home-delivery"}',
        true,
        '{"NHIS", "AIG"}',
        12.0,
        4.7,
        204
      ),
      (
        'Tamale Wellness Pharmacy',
        'Partner pharmacy focusing on chronic care medication management and counseling.',
        '{"street": "65 Sakasaka Road", "city": "Tamale", "region": "Northern", "country": "Ghana", "postalCode": "NR-101"}',
        'Tamale',
        'Northern',
        'Ghana',
        9.435090,
        -0.819438,
        '+233 372 202 345',
        'info@tamalewellnesspharmacy.com',
        'https://tamalewellnesspharmacy.com',
        '{"Prescription Refill", "Medication Therapy Management"}',
        '{"monday_friday": {"open": "08:30", "close": "19:00"}, "saturday": {"open": "09:30", "close": "17:00"}}',
        '{"in-store"}',
        true,
        '{"NHIS"}',
        25.0,
        4.5,
        58
      )
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('✅ Sample partner pharmacies inserted');

    // Insert sample insurance partners
    await client.query(`
      INSERT INTO insurance_partners (
        name, description, logo_url, coverage_areas, contact_person, phone, email, website, plans
      ) VALUES
      (
        'National Health Insurance Scheme',
        'Government-backed health insurance providing coverage for essential primary and secondary care.',
        'https://nhis.gov.gh/logo.png',
        '{"Greater Accra", "Ashanti", "Northern"}',
        '{"name": "Kwabena Mensah", "email": "kmensah@nhis.gov.gh", "phone": "+233 302 662 662"}',
        '+233 302 662 662',
        'support@nhis.gov.gh',
        'https://nhis.gov.gh',
        '{"Standard", "Premium"}'
      ),
      (
        'Acacia Health Insurance',
        'Private insurance provider offering comprehensive outpatient and inpatient coverage.',
        'https://acaciahealthinsurance.com/logo.png',
        '{"Greater Accra", "Ashanti"}',
        '{"name": "Akosua Owusu", "email": "aowusu@acaciahealth.com", "phone": "+233 302 400 800"}',
        '+233 302 400 800',
        'info@acaciahealth.com',
        'https://acaciahealthinsurance.com',
        '{"Silver", "Gold", "Corporate"}'
      )
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('✅ Sample insurance partners inserted');

    // Insert sample users and doctors
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Insert sample users
    await client.query(`
      INSERT INTO users (email, password_hash, role, is_verified) VALUES
      ('doctor1@iffahealth.com', $1, 'doctor', true),
      ('doctor2@iffahealth.com', $1, 'doctor', true),
      ('doctor3@iffahealth.com', $1, 'doctor', true),
      ('patient1@iffahealth.com', $1, 'patient', true),
      ('patient2@iffahealth.com', $1, 'patient', true),
      ('patient3@iffahealth.com', $1, 'patient', true)
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);
    
    // Get user IDs
    const userResult = await client.query(`
      SELECT id, email FROM users WHERE email IN (
        'doctor1@iffahealth.com', 'doctor2@iffahealth.com', 'doctor3@iffahealth.com',
        'patient1@iffahealth.com', 'patient2@iffahealth.com', 'patient3@iffahealth.com'
      )
    `);
    
    const users = {};
    userResult.rows.forEach(row => {
      users[row.email] = row.id;
    });
    
    // Get hospital IDs
    const hospitalResult = await client.query('SELECT id FROM hospitals LIMIT 3');
    const hospitals = hospitalResult.rows.map(row => row.id);
    
    // Insert sample doctors
    await client.query(`
      INSERT INTO doctors (
        user_id, first_name, last_name, phone, specialty, license_number,
        medical_school, graduation_year, hospital_affiliation, practice_address,
        city, consultation_fee, bio, languages, experience_years,
        is_verified, is_profile_complete, is_available
      ) VALUES
      ($1, 'Dr. Kwame', 'Asante', '+233 24 123 4567', 'Cardiology', 'LIC-001',
       'University of Ghana Medical School', 2015, 'Korle-Bu Teaching Hospital',
       '{"street": "123 Medical Center", "city": "Accra", "region": "Greater Accra", "country": "Ghana", "postalCode": "GA-184"}',
       'Accra', 150.00, 'Experienced cardiologist with expertise in interventional procedures.', 
       '{"English", "French"}', 8, true, true, true),
      ($2, 'Dr. Ama', 'Osei', '+233 24 234 5678', 'Pediatrics', 'LIC-002',
       'Kwame Nkrumah University of Science and Technology', 2018, '37 Military Hospital',
       '{"street": "456 Children Hospital", "city": "Accra", "region": "Greater Accra", "country": "Ghana", "postalCode": "GA-184"}',
       'Accra', 120.00, 'Dedicated pediatrician with special interest in child development.',
       '{"English", "Twi"}', 5, true, true, true),
      ($3, 'Dr. Kofi', 'Mensah', '+233 24 345 6789', 'Dermatology', 'LIC-003',
       'University of Ghana Medical School', 2012, 'Komfo Anokye Teaching Hospital',
       '{"street": "789 Skin Clinic", "city": "Kumasi", "region": "Ashanti", "country": "Ghana", "postalCode": "AK-002"}',
       'Kumasi', 100.00, 'Specialist in dermatology and cosmetic procedures.',
       '{"English", "Twi", "Hausa"}', 11, true, true, true)
      ON CONFLICT (license_number) DO NOTHING;
    `, [users['doctor1@iffahealth.com'], users['doctor2@iffahealth.com'], users['doctor3@iffahealth.com']]);
    
    console.log('✅ Sample doctors inserted');
    
    // Insert sample patients
    await client.query(`
      INSERT INTO patients (
        user_id, first_name, last_name, phone, date_of_birth, gender,
        address, emergency_contact, medical_history, allergies, current_medications,
        blood_type, height, weight, marital_status, occupation, employer,
        preferred_language, preferred_doctor_gender, preferred_appointment_time,
        consent_to_telehealth, consent_to_data_sharing, is_profile_complete
      ) VALUES
      ($1, 'John', 'Doe', '+233 24 456 7890', '1990-05-15', 'male',
       '{"street": "123 Main Street", "city": "Accra", "region": "Greater Accra", "country": "Ghana", "postalCode": "GA-184"}',
       '{"name": "Jane Doe", "phone": "+233 24 456 7891", "relationship": "Sister"}',
       '{"Hypertension", "Diabetes Type 2"}', '{"Penicillin", "Shellfish"}', '{"Metformin", "Lisinopril"}',
       'O+', 175.5, 80.2, 'married', 'Software Engineer', 'Tech Corp',
       'English', 'no-preference', 'morning', true, true, true),
      ($2, 'Mary', 'Johnson', '+233 24 567 8901', '1985-08-22', 'female',
       '{"street": "456 Oak Avenue", "city": "Kumasi", "region": "Ashanti", "country": "Ghana", "postalCode": "AK-002"}',
       '{"name": "Peter Johnson", "phone": "+233 24 567 8902", "relationship": "Husband"}',
       '{"Asthma"}', '{"Dust", "Pollen"}', '{"Albuterol"}',
       'A+', 162.0, 65.5, 'married', 'Teacher', 'Ghana Education Service',
       'English', 'female', 'afternoon', true, true, true),
      ($3, 'David', 'Smith', '+233 24 678 9012', '1992-12-03', 'male',
       '{"street": "789 Pine Street", "city": "Tema", "region": "Greater Accra", "country": "Ghana", "postalCode": "GA-184"}',
       '{"name": "Sarah Smith", "phone": "+233 24 678 9013", "relationship": "Mother"}',
       '{}', '{}', '{}',
       'B+', 180.0, 75.0, 'single', 'Student', 'University of Ghana',
       'English', 'male', 'evening', true, true, true)
      ;
    `, [users['patient1@iffahealth.com'], users['patient2@iffahealth.com'], users['patient3@iffahealth.com']]);
    
    console.log('✅ Sample patients inserted');
    
    // Get doctor and patient IDs
    const doctorResult = await client.query('SELECT id, first_name, last_name, specialty FROM doctors LIMIT 3');
    const patientResult = await client.query('SELECT id, first_name, last_name FROM patients LIMIT 3');
    
    const doctors = doctorResult.rows;
    const patients = patientResult.rows;
    
    // Insert sample appointments
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    await client.query(`
      INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, appointment_time, type, status, notes, amount
      ) VALUES
      ($1, $2, $3, '09:00:00', 'video', 'confirmed', 'Regular checkup', 150.00),
      ($4, $5, $6, '14:00:00', 'video', 'scheduled', 'Follow-up consultation', 120.00),
      ($7, $8, $9, '10:30:00', 'video', 'confirmed', 'Initial consultation', 100.00)
      ;
    `, [
      patients[0].id, doctors[0].id, tomorrow.toISOString().split('T')[0],
      patients[1].id, doctors[1].id, nextWeek.toISOString().split('T')[0],
      patients[2].id, doctors[2].id, tomorrow.toISOString().split('T')[0]
    ]);
    
    console.log('✅ Sample appointments inserted');
    
    // Insert sample medications
    await client.query(`
      INSERT INTO medications (
        patient_id, name, dosage, frequency, start_date, prescribed_by, instructions, status
      ) VALUES
      ($1, 'Metformin', '500mg', 'Twice daily', $2, $3, 'Take with food', 'active'),
      ($4, 'Lisinopril', '10mg', 'Once daily', $5, $6, 'Take in the morning', 'active'),
      ($7, 'Albuterol', '90mcg', 'As needed', $8, $9, 'Use inhaler when needed', 'active')
      ;
    `, [
      patients[0].id, tomorrow.toISOString().split('T')[0], doctors[0].id,
      patients[0].id, tomorrow.toISOString().split('T')[0], doctors[0].id,
      patients[1].id, tomorrow.toISOString().split('T')[0], doctors[1].id
    ]);
    
    console.log('✅ Sample medications inserted');
    
    // Insert sample lab tests
    await client.query(`
      INSERT INTO lab_tests (
        patient_id, test_name, test_type, ordered_by, test_date, test_time, location, status
      ) VALUES
      ($1, 'Blood Sugar Test', 'Blood Test', $2, $3, '08:00:00', 'Korle-Bu Lab', 'scheduled'),
      ($4, 'Chest X-Ray', 'Radiology', $5, $6, '10:00:00', '37 Military Radiology', 'scheduled'),
      ($7, 'Skin Biopsy', 'Pathology', $8, $9, '14:00:00', 'KATH Pathology Lab', 'scheduled')
      ;
    `, [
      patients[0].id, doctors[0].id, tomorrow.toISOString().split('T')[0],
      patients[1].id, doctors[1].id, nextWeek.toISOString().split('T')[0],
      patients[2].id, doctors[2].id, tomorrow.toISOString().split('T')[0]
    ]);
    
    console.log('✅ Sample lab tests inserted');
    
    // Insert sample health records
    await client.query(`
      INSERT INTO health_records (
        patient_id, type, title, description, record_date, doctor_id, hospital_id
      ) VALUES
      ($1, 'consultation', 'Cardiology Consultation', 'Regular heart checkup and assessment', $2, $3, $4),
      ($5, 'diagnosis', 'Asthma Diagnosis', 'Confirmed asthma diagnosis based on symptoms and tests', $6, $7, $8),
      ($9, 'treatment', 'Dermatology Treatment', 'Treatment plan for skin condition', $10, $11, $12)
      ;
    `, [
      patients[0].id, tomorrow.toISOString().split('T')[0], doctors[0].id, hospitals[0],
      patients[1].id, nextWeek.toISOString().split('T')[0], doctors[1].id, hospitals[1],
      patients[2].id, tomorrow.toISOString().split('T')[0], doctors[2].id, hospitals[2]
    ]);
    
    console.log('✅ Sample health records inserted');
    
    // Insert sample prescriptions
    await client.query(`
      INSERT INTO prescriptions (
        patient_id, doctor_id, prescription_date, status, notes
      ) VALUES
      ($1, $2, $3, 'active', 'Continue current medication regimen'),
      ($4, $5, $6, 'active', 'New prescription for asthma management'),
      ($7, $8, $9, 'active', 'Topical treatment for skin condition')
      ;
    `, [
      patients[0].id, doctors[0].id, tomorrow.toISOString().split('T')[0],
      patients[1].id, doctors[1].id, nextWeek.toISOString().split('T')[0],
      patients[2].id, doctors[2].id, tomorrow.toISOString().split('T')[0]
    ]);
    
    console.log('✅ Sample prescriptions inserted');
    
    // Insert sample notifications
    const patientUserIds = [users['patient1@iffahealth.com'], users['patient2@iffahealth.com'], users['patient3@iffahealth.com']];
    
    await client.query(`
      INSERT INTO notifications (
        user_id, type, title, message, data, status
      ) VALUES
      ($1, 'appointment', 'Appointment Reminder', 'You have an appointment tomorrow at 9:00 AM', '{"appointmentId": "1"}', 'unread'),
      ($2, 'prescription', 'New Prescription', 'You have a new prescription available', '{"prescriptionId": "1"}', 'unread'),
      ($3, 'lab_result', 'Lab Results Available', 'Your lab test results are now available', '{"labTestId": "1"}', 'unread')
      ;
    `, patientUserIds);
    
    console.log('✅ Sample notifications inserted');
    
    console.log('🎉 Enhanced database setup completed successfully!');
    console.log('\n📋 Sample Data Summary:');
    console.log(`- 3 Hospitals`);
    console.log(`- 3 Doctors (Cardiology, Pediatrics, Dermatology)`);
    console.log(`- 3 Patients`);
    console.log(`- 3 Appointments`);
    console.log(`- 3 Medications`);
    console.log(`- 3 Lab Tests`);
    console.log(`- 3 Health Records`);
    console.log(`- 3 Prescriptions`);
    console.log(`- 3 Notifications`);
    console.log('\n🔑 Test Credentials:');
    console.log('Doctors: doctor1@iffahealth.com, doctor2@iffahealth.com, doctor3@iffahealth.com');
    console.log('Patients: patient1@iffahealth.com, patient2@iffahealth.com, patient3@iffahealth.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('❌ Error setting up enhanced database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  setupEnhancedDatabase()
    .then(() => {
      console.log('✅ Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupEnhancedDatabase;
