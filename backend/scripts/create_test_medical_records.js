const { query } = require('../config/database');

async function createTestMedicalRecords() {
  try {
    console.log('📋 Creating test medical records...');

    // Get the test doctor ID
    const doctorResult = await query(`
      SELECT id FROM doctors 
      WHERE user_id = (
        SELECT id FROM users WHERE email = 'dr.new@iffahealth.com'
      )
    `);

    if (doctorResult.rows.length === 0) {
      console.log('❌ Test doctor not found. Please run the enhanced database setup first.');
      return;
    }

    const doctorId = doctorResult.rows[0].id;
    console.log('👨‍⚕️ Found doctor ID:', doctorId);

    // Get some patient IDs
    const patientsResult = await query(`
      SELECT id, first_name, last_name FROM patients LIMIT 3
    `);

    if (patientsResult.rows.length === 0) {
      console.log('❌ No patients found. Please run the enhanced database setup first.');
      return;
    }

    const patients = patientsResult.rows;
    console.log('👥 Found patients:', patients.length);

    // Create test medical records
    const testRecords = [
      {
        patient_id: patients[0].id,
        type: 'consultation',
        title: 'Hypertension Follow-up',
        description: 'Patient reports good blood pressure control with current medication. No side effects noted. BP: 120/80 mmHg.',
        record_date: new Date().toISOString().split('T')[0],
        doctor_id: doctorId,
        hospital_id: null,
        attachments: '{"bp_chart.pdf", "ecg_001.jpg"}'
      },
      {
        patient_id: patients[1]?.id || patients[0].id,
        type: 'lab_result',
        title: 'Complete Blood Count',
        description: 'CBC results show all values within normal range. Hemoglobin: 14.2 g/dL, WBC: 7.5 K/μL.',
        record_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        doctor_id: doctorId,
        hospital_id: null,
        attachments: '{"cbc_results.pdf"}'
      },
      {
        patient_id: patients[0].id,
        type: 'prescription',
        title: 'Metformin Prescription',
        description: 'Prescribed Metformin 500mg twice daily for diabetes management. Patient to monitor blood sugar levels.',
        record_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        doctor_id: doctorId,
        hospital_id: null,
        attachments: '{}'
      },
      {
        patient_id: patients[2]?.id || patients[0].id,
        type: 'diagnosis',
        title: 'Chest Pain Assessment',
        description: 'Initial assessment for chest pain. ECG and chest X-ray ordered. Patient reports pain level 6/10.',
        record_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        doctor_id: doctorId,
        hospital_id: null,
        attachments: '{"ecg_002.jpg", "chest_xray.jpg"}'
      },
      {
        patient_id: patients[1]?.id || patients[0].id,
        type: 'treatment',
        title: 'Prenatal Care Plan',
        description: 'Comprehensive prenatal care plan established. Regular checkups scheduled every 4 weeks.',
        record_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        doctor_id: doctorId,
        hospital_id: null,
        attachments: '{"prenatal_plan.pdf"}'
      },
      {
        patient_id: patients[0].id,
        type: 'consultation',
        title: 'Diabetes Management Review',
        description: 'Quarterly diabetes review. HbA1c: 6.8%. Patient maintaining good control with current regimen.',
        record_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        doctor_id: doctorId,
        hospital_id: null,
        attachments: '{"hba1c_results.pdf"}'
      }
    ];

    // Insert test records
    for (const record of testRecords) {
      await query(`
        INSERT INTO health_records (
          patient_id, type, title, description, record_date, doctor_id, hospital_id, attachments
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          record.patient_id,
          record.type,
          record.title,
          record.description,
          record.record_date,
          record.doctor_id,
          record.hospital_id,
          record.attachments
        ]);
    }

    console.log('✅ Test medical records created successfully!');
    console.log(`📊 Created ${testRecords.length} medical records for doctor ${doctorId}`);

    // Verify the records were created
    const countResult = await query(`
      SELECT COUNT(*) as count 
      FROM health_records 
      WHERE doctor_id = $1
    `, [doctorId]);

    console.log(`🔍 Verification - Total records for doctor: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error creating test medical records:', error);
  }
}

createTestMedicalRecords();
