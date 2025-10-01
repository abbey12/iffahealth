/*
  Script: Clear all data except admin users
  - Deletes ALL data except users with role='admin'
  - Preserves admin accounts and their data
  - Clears all other users, patients, doctors, appointments, etc.
*/

const { Pool } = require('pg');
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

console.log('🗄️  DB config for admin-preserving cleanup:', {
  hasConnectionString: Boolean(connectionString),
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: Boolean(dbConfig.ssl),
});

const pool = new Pool(dbConfig);

async function tableExists(client, table) {
  const res = await client.query(
    `SELECT to_regclass($1) AS exists`,
    [table]
  );
  return Boolean(res.rows[0] && res.rows[0].exists);
}

async function safeDelete(client, sql, params = []) {
  try {
    const res = await client.query(sql, params);
    return res.rowCount || 0;
  } catch (err) {
    console.warn(`⚠️  Skipped delete due to error: ${err.message}`);
    return 0;
  }
}

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔐 Starting cleanup - preserving admin data only...');
    await client.query('BEGIN');

    // 1) Identify admin users to preserve
    const adminRes = await client.query(
      `SELECT id, email FROM users WHERE role = 'admin'`
    );
    const adminIds = adminRes.rows.map(r => r.id);
    console.log(`👑 Admin users to preserve: ${adminIds.length}`);
    adminIds.forEach(admin => console.log(`   - ${admin.email} (${admin.id})`));

    if (adminIds.length === 0) {
      console.log('⚠️  No admin users found! Proceeding with full cleanup...');
    }

    // 2) Get all non-admin user IDs
    let nonAdminUserIds = [];
    try {
      const res = await client.query(
        adminIds.length > 0
          ? `SELECT id FROM users WHERE id <> ALL($1::uuid[])`
          : `SELECT id FROM users`,
        adminIds.length > 0 ? [adminIds] : []
      );
      nonAdminUserIds = res.rows.map(r => r.id);
      console.log(`🧑‍⚕️ Non-admin users to delete: ${nonAdminUserIds.length}`);
    } catch (e) {
      console.warn('⚠️  Could not fetch non-admin users; proceeding with broad deletes.');
    }

    // 3) Get patient and doctor IDs linked to non-admin users
    let patientIds = [];
    let doctorIds = [];
    try {
      if (await tableExists(client, 'patients')) {
        const pr = await client.query(
          nonAdminUserIds.length > 0
            ? `SELECT id FROM patients WHERE user_id = ANY($1::uuid[])`
            : `SELECT id FROM patients`,
          [nonAdminUserIds]
        );
        patientIds = pr.rows.map(r => r.id);
      }
      if (await tableExists(client, 'doctors')) {
        const dr = await client.query(
          nonAdminUserIds.length > 0
            ? `SELECT id FROM doctors WHERE user_id = ANY($1::uuid[])`
            : `SELECT id FROM doctors`,
          [nonAdminUserIds]
        );
        doctorIds = dr.rows.map(r => r.id);
      }
    } catch {}
    console.log(`🧑 Patients to delete: ${patientIds.length}, Doctors to delete: ${doctorIds.length}`);

    const summary = [];

    // 4) Delete from child tables first (respecting foreign keys)
    
    // Prescription items
    if (await tableExists(client, 'prescription_items')) {
      const count = await safeDelete(client,
        patientIds.length || doctorIds.length
          ? `DELETE FROM prescription_items WHERE prescription_id IN (
               SELECT id FROM prescriptions WHERE ${[
                 patientIds.length ? `patient_id = ANY($1::uuid[])` : null,
                 doctorIds.length ? `doctor_id = ANY($2::uuid[])` : null,
               ].filter(Boolean).join(' OR ')}
             )`
          : `DELETE FROM prescription_items`,
        [patientIds, doctorIds]
      );
      summary.push(['prescription_items', count]);
    }

    // Payment transactions
    if (await tableExists(client, 'payment_transactions')) {
      const count = await safeDelete(client,
        patientIds.length || doctorIds.length
          ? `DELETE FROM payment_transactions WHERE ${[
              patientIds.length ? `patient_id = ANY($1::uuid[])` : null,
              doctorIds.length ? `doctor_id = ANY($2::uuid[])` : null,
              `(appointment_id IN (SELECT id FROM appointments ${[
                 patientIds.length ? `WHERE patient_id = ANY($1::uuid[])` : null,
                 doctorIds.length ? `${patientIds.length ? 'OR ' : 'WHERE '}doctor_id = ANY($2::uuid[])` : null,
               ].filter(Boolean).join(' ') || ''}))`,
            ].filter(Boolean).join(' OR ')}`
          : `DELETE FROM payment_transactions`,
        [patientIds, doctorIds]
      );
      summary.push(['payment_transactions', count]);
    }

    // Doctor earnings
    if (await tableExists(client, 'doctor_earnings')) {
      const count = await safeDelete(client,
        doctorIds.length
          ? `DELETE FROM doctor_earnings WHERE doctor_id = ANY($1::uuid[])`
          : `DELETE FROM doctor_earnings`,
        [doctorIds]
      );
      summary.push(['doctor_earnings', count]);
    }

    // Payout requests
    if (await tableExists(client, 'payout_requests')) {
      const count = await safeDelete(client,
        doctorIds.length
          ? `DELETE FROM payout_requests WHERE doctor_id = ANY($1::uuid[])`
          : `DELETE FROM payout_requests`,
        [doctorIds]
      );
      summary.push(['payout_requests', count]);
    }

    // Medical records
    if (await tableExists(client, 'health_records')) {
      const count = await safeDelete(client,
        patientIds.length || doctorIds.length
          ? `DELETE FROM health_records WHERE ${[
              patientIds.length ? `patient_id = ANY($1::uuid[])` : null,
              doctorIds.length ? `doctor_id = ANY($2::uuid[])` : null,
            ].filter(Boolean).join(' OR ')}`
          : `DELETE FROM health_records`,
        [patientIds, doctorIds]
      );
      summary.push(['health_records', count]);
    }

    // Lab tests
    if (await tableExists(client, 'lab_tests')) {
      const count = await safeDelete(client,
        patientIds.length || doctorIds.length
          ? `DELETE FROM lab_tests WHERE ${[
              patientIds.length ? `patient_id = ANY($1::uuid[])` : null,
              doctorIds.length ? `ordered_by = ANY($2::uuid[])` : null,
            ].filter(Boolean).join(' OR ')}`
          : `DELETE FROM lab_tests`,
        [patientIds, doctorIds]
      );
      summary.push(['lab_tests', count]);
    }

    // Prescriptions
    if (await tableExists(client, 'prescriptions')) {
      const count = await safeDelete(client,
        patientIds.length || doctorIds.length
          ? `DELETE FROM prescriptions WHERE ${[
              patientIds.length ? `patient_id = ANY($1::uuid[])` : null,
              doctorIds.length ? `doctor_id = ANY($2::uuid[])` : null,
            ].filter(Boolean).join(' OR ')}`
          : `DELETE FROM prescriptions`,
        [patientIds, doctorIds]
      );
      summary.push(['prescriptions', count]);
    }

    // Appointments
    if (await tableExists(client, 'appointments')) {
      const count = await safeDelete(client,
        patientIds.length || doctorIds.length
          ? `DELETE FROM appointments WHERE ${[
              patientIds.length ? `patient_id = ANY($1::uuid[])` : null,
              doctorIds.length ? `doctor_id = ANY($2::uuid[])` : null,
            ].filter(Boolean).join(' OR ')}`
          : `DELETE FROM appointments`,
        [patientIds, doctorIds]
      );
      summary.push(['appointments', count]);
    }

    // Video sessions
    if (await tableExists(client, 'video_call_sessions')) {
      const count = await safeDelete(client,
        patientIds.length || doctorIds.length
          ? `DELETE FROM video_call_sessions WHERE appointment_id IN (
               SELECT id FROM appointments WHERE ${[
                 patientIds.length ? `patient_id = ANY($1::uuid[])` : null,
                 doctorIds.length ? `${patientIds.length ? 'OR ' : ''}doctor_id = ANY($2::uuid[])` : null,
               ].filter(Boolean).join(' ')}
             )`
          : `DELETE FROM video_call_sessions`,
        [patientIds, doctorIds]
      );
      summary.push(['video_call_sessions', count]);
    }

    // Emergency alerts
    if (await tableExists(client, 'emergency_alerts')) {
      const count = await safeDelete(client,
        patientIds.length
          ? `DELETE FROM emergency_alerts WHERE patient_id = ANY($1::uuid[])`
          : `DELETE FROM emergency_alerts`,
        [patientIds]
      );
      summary.push(['emergency_alerts', count]);
    }

    // Notifications (delete for non-admin users)
    if (await tableExists(client, 'notifications')) {
      const count = await safeDelete(client,
        nonAdminUserIds.length > 0
          ? `DELETE FROM notifications WHERE user_id = ANY($1::uuid[])`
          : `DELETE FROM notifications`,
        [nonAdminUserIds]
      );
      summary.push(['notifications', count]);
    }

    // Patients
    if (await tableExists(client, 'patients')) {
      const count = await safeDelete(client,
        nonAdminUserIds.length > 0
          ? `DELETE FROM patients WHERE user_id = ANY($1::uuid[])`
          : `DELETE FROM patients`,
        [nonAdminUserIds]
      );
      summary.push(['patients', count]);
    }

    // Doctors
    if (await tableExists(client, 'doctors')) {
      const count = await safeDelete(client,
        nonAdminUserIds.length > 0
          ? `DELETE FROM doctors WHERE user_id = ANY($1::uuid[])`
          : `DELETE FROM doctors`,
        [nonAdminUserIds]
      );
      summary.push(['doctors', count]);
    }

    // Users (delete all except admins)
    if (await tableExists(client, 'users')) {
      const count = await safeDelete(client,
        adminIds.length > 0
          ? `DELETE FROM users WHERE id <> ALL($1::uuid[])`
          : `DELETE FROM users`,
        [adminIds]
      );
      summary.push(['users(non-admin)', count]);
    }

    await client.query('COMMIT');
    console.log('✅ Cleanup completed successfully (admin data preserved).');
    console.log('\n📊 Summary of deleted rows:');
    console.table(summary.map(([table, count]) => ({ table, deleted: count })));
    
    const totalDeleted = summary.reduce((sum, [, count]) => sum + count, 0);
    console.log(`\n🔥 Total rows deleted: ${totalDeleted}`);
    console.log(`👑 Admin users preserved: ${adminIds.length}`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed:', err);
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
