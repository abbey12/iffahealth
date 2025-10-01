/*
  Script: Clear ALL data from database
  - Deletes ALL rows from ALL tables
  - No exceptions - everything gets wiped
  - Use with extreme caution!
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

console.log('🗄️  DB config for FULL cleanup:', {
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
    console.log('🔥 Starting FULL database cleanup - ALL DATA WILL BE DELETED!');
    await client.query('BEGIN');

    // Get all tables in dependency order (children first)
    const tables = [
      'prescription_items',
      'payment_transactions', 
      'doctor_earnings',
      'payout_requests',
      'medical_records',
      'lab_tests',
      'prescriptions',
      'appointments',
      'video_call_sessions',
      'emergency_alerts',
      'notifications',
      'patients',
      'doctors',
      'users',
      'hospitals',
      'lab_centers',
      'partner_pharmacies',
      'insurance_partners'
    ];

    const summary = [];

    // Delete from each table
    for (const table of tables) {
      if (await tableExists(client, table)) {
        const count = await safeDelete(client, `DELETE FROM ${table}`);
        summary.push([table, count]);
        console.log(`🗑️  Deleted ${count} rows from ${table}`);
      } else {
        console.log(`⚠️  Table ${table} does not exist, skipping`);
      }
    }

    // Reset sequences for tables with auto-incrementing IDs
    const sequences = [
      'users_id_seq',
      'patients_id_seq', 
      'doctors_id_seq',
      'appointments_id_seq',
      'medications_id_seq',
      'prescriptions_id_seq',
      'prescription_items_id_seq',
      'lab_tests_id_seq',
      'health_records_id_seq',
      'doctor_earnings_id_seq',
      'payout_requests_id_seq',
      'notifications_id_seq',
      'emergency_alerts_id_seq',
      'video_call_sessions_id_seq',
      'payment_transactions_id_seq',
      'hospitals_id_seq',
      'lab_centers_id_seq',
      'partner_pharmacies_id_seq',
      'insurance_partners_id_seq'
    ];

    for (const seq of sequences) {
      try {
        await client.query(`SELECT setval('${seq}', 1, false)`);
        console.log(`🔄 Reset sequence ${seq}`);
      } catch (err) {
        // Sequence might not exist, ignore
      }
    }

    await client.query('COMMIT');
    console.log('✅ FULL cleanup completed - ALL DATA DELETED!');
    console.log('\n📊 Summary of deleted rows:');
    console.table(summary.map(([table, count]) => ({ table, deleted: count })));
    
    const totalDeleted = summary.reduce((sum, [, count]) => sum + count, 0);
    console.log(`\n🔥 Total rows deleted: ${totalDeleted}`);
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Full cleanup failed:', err);
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