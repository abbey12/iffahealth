const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function setupPaymentMethodsTable() {
  try {
    console.log('🔧 Setting up doctor payment methods table...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create_payment_methods_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL
    await query(sql);
    
    console.log('✅ Doctor payment methods table created successfully!');
    
    // Verify the table was created
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'doctor_payment_methods'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Table verification successful');
      
      // Check if sample data was inserted
      const sampleData = await query(`
        SELECT COUNT(*) as count 
        FROM doctor_payment_methods 
        WHERE doctor_id = '7ef371ba-e494-4251-8cc6-a68eaf856d2b'
      `);
      
      console.log(`📊 Sample data count: ${sampleData.rows[0].count}`);
    }
    
  } catch (error) {
    console.error('❌ Error setting up payment methods table:', error);
  }
}

setupPaymentMethodsTable();
