const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'iffahealth',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function createTestPrescriptions() {
  try {
    console.log('🔗 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database');

    // Get doctor ID
    const doctorResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', ['0033dc2d-cba0-49f8-b23f-4e771059eaae']);
    if (doctorResult.rows.length === 0) {
      console.log('❌ Doctor not found');
      return;
    }
    const doctorId = doctorResult.rows[0].id;
    console.log('👨‍⚕️ Doctor ID:', doctorId);

    // Get patients
    const patientsResult = await pool.query('SELECT id, first_name, last_name FROM patients LIMIT 3');
    if (patientsResult.rows.length === 0) {
      console.log('❌ No patients found');
      return;
    }
    console.log('👥 Found patients:', patientsResult.rows.length);

    // Create test prescriptions
    const prescriptions = [
      {
        patient_id: patientsResult.rows[0].id,
        prescription_date: '2024-01-15',
        status: 'active',
        notes: 'Upper respiratory infection treatment',
        follow_up_date: '2024-01-22'
      },
      {
        patient_id: patientsResult.rows[1]?.id || patientsResult.rows[0].id,
        prescription_date: '2024-01-14',
        status: 'completed',
        notes: 'Diabetes management - blood sugar well controlled',
        follow_up_date: null
      },
      {
        patient_id: patientsResult.rows[2]?.id || patientsResult.rows[0].id,
        prescription_date: '2024-01-10',
        status: 'cancelled',
        notes: 'Hypertension treatment - patient requested cancellation',
        follow_up_date: null
      }
    ];

    for (const prescription of prescriptions) {
      const result = await pool.query(`
        INSERT INTO prescriptions (patient_id, doctor_id, prescription_date, status, notes, follow_up_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        prescription.patient_id,
        doctorId,
        prescription.prescription_date,
        prescription.status,
        prescription.notes,
        prescription.follow_up_date
      ]);

      const prescriptionId = result.rows[0].id;
      console.log(`✅ Created prescription ${prescriptionId} for patient ${prescription.patient_id}`);

      // Add prescription items
      const items = [
        {
          medication_name: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'Three times daily',
          quantity: 21,
          instructions: 'Take with food'
        },
        {
          medication_name: 'Ibuprofen',
          dosage: '400mg',
          frequency: 'As needed for pain',
          quantity: 15,
          instructions: 'Take with water, not more than 3 times daily'
        }
      ];

      for (const item of items) {
        await pool.query(`
          INSERT INTO prescription_items (prescription_id, medication_name, dosage, frequency, quantity, instructions)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          prescriptionId,
          item.medication_name,
          item.dosage,
          item.frequency,
          item.quantity,
          item.instructions
        ]);
      }

      console.log(`✅ Added ${items.length} items to prescription ${prescriptionId}`);
    }

    console.log('🎉 Test prescriptions created successfully!');

  } catch (error) {
    console.error('❌ Error creating test prescriptions:', error);
  } finally {
    await pool.end();
  }
}

createTestPrescriptions();
