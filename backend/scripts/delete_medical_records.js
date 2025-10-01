const { query } = require('../config/database');

async function deleteMedicalRecords() {
  try {
    console.log('🗑️ Deleting all medical records from database...');

    // First, let's see what records exist
    const countResult = await query(`
      SELECT COUNT(*) as count
      FROM health_records
    `);
    console.log('📊 Current medical records count:', countResult.rows[0].count);

    // Get the records before deletion for logging
    const recordsResult = await query(`
      SELECT id, title, type, record_date
      FROM health_records
      ORDER BY created_at DESC
    `);
    
    if (recordsResult.rows.length > 0) {
      console.log('📋 Records to be deleted:');
      recordsResult.rows.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.title} (${record.type}) - ${record.record_date}`);
      });
    }

    // Delete all medical records
    const deleteResult = await query(`
      DELETE FROM health_records
    `);

    console.log('✅ Medical records deleted successfully!');
    console.log('📊 Rows deleted:', deleteResult.rowCount);

    // Verify deletion
    const verifyResult = await query(`
      SELECT COUNT(*) as count
      FROM health_records
    `);
    console.log('🔍 Verification - remaining records:', verifyResult.rows[0].count);

    if (verifyResult.rows[0].count === '0') {
      console.log('🎉 All medical records have been successfully deleted!');
    } else {
      console.log('⚠️ Some records may still exist. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Error deleting medical records:', error);
  } finally {
    // process.exit(); // Exit the script after execution
  }
}

if (require.main === module) {
  deleteMedicalRecords();
}

module.exports = deleteMedicalRecords;
