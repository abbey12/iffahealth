/*
  Script: List all data in database
  - Shows row counts and sample data from all tables
  - Helps verify what data exists after cleanup
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

console.log('🗄️  DB config for data listing:', {
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

async function getTableData(client, table) {
  try {
    // Get count
    const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
    const count = parseInt(countResult.rows[0].count);
    
    if (count === 0) {
      return { count: 0, sample: [] };
    }
    
    // Get sample data (first 3 rows)
    const sampleResult = await client.query(`SELECT * FROM ${table} LIMIT 3`);
    return { count, sample: sampleResult.rows };
  } catch (err) {
    return { count: 0, sample: [], error: err.message };
  }
}

async function run() {
  const client = await pool.connect();
  try {
    console.log('📊 Listing all data in database...\n');
    
    // Get all tables
    const tables = [
      'users',
      'patients', 
      'doctors',
      'appointments',
      'medications',
      'prescriptions',
      'prescription_items',
      'lab_tests',
      'health_records',
      'doctor_earnings',
      'payout_requests',
      'notifications',
      'emergency_alerts',
      'video_call_sessions',
      'payment_transactions',
      'hospitals',
      'lab_centers',
      'partner_pharmacies',
      'insurance_partners'
    ];
    
    const results = [];
    let totalRows = 0;
    
    for (const table of tables) {
      if (await tableExists(client, table)) {
        const data = await getTableData(client, table);
        results.push({ table, ...data });
        totalRows += data.count;
        
        console.log(`📋 ${table.toUpperCase()}`);
        console.log(`   Count: ${data.count} rows`);
        
        if (data.error) {
          console.log(`   Error: ${data.error}`);
        } else if (data.count > 0) {
          console.log(`   Sample data:`);
          data.sample.forEach((row, index) => {
            console.log(`     Row ${index + 1}:`, JSON.stringify(row, null, 2).substring(0, 200) + '...');
          });
        } else {
          console.log(`   (empty)`);
        }
        console.log('');
      } else {
        console.log(`⚠️  Table ${table} does not exist\n`);
      }
    }
    
    console.log('='.repeat(50));
    console.log(`📊 SUMMARY:`);
    console.log(`Total tables checked: ${tables.length}`);
    console.log(`Total rows across all tables: ${totalRows}`);
    console.log('='.repeat(50));
    
    // Show summary table
    console.log('\n📋 Table Summary:');
    console.table(results.map(r => ({
      table: r.table,
      count: r.count,
      hasError: !!r.error
    })));
    
  } catch (err) {
    console.error('❌ Data listing failed:', err);
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
