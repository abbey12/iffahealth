const { query } = require('../config/database');

async function clearAllAppointments() {
  try {
    console.log('🗑️  Starting to clear all appointments from database...');
    
    // First, let's see how many appointments exist
    const countResult = await query('SELECT COUNT(*) as count FROM appointments');
    const appointmentCount = parseInt(countResult.rows[0].count);
    console.log(`📊 Found ${appointmentCount} appointments in the database`);
    
    if (appointmentCount === 0) {
      console.log('✅ No appointments found. Database is already clean.');
      return;
    }
    
    // First, clear payment transactions (they reference appointments)
    const paymentCountResult = await query('SELECT COUNT(*) as count FROM payment_transactions');
    const paymentCount = parseInt(paymentCountResult.rows[0].count);
    
    if (paymentCount > 0) {
      const deletePaymentsResult = await query('DELETE FROM payment_transactions');
      console.log(`✅ Successfully deleted ${paymentCount} payment transactions`);
    }
    
    // Then clear all appointments
    const deleteResult = await query('DELETE FROM appointments');
    console.log(`✅ Successfully deleted ${appointmentCount} appointments`);
    
    // Verify the database is clean
    const verifyResult = await query('SELECT COUNT(*) as count FROM appointments');
    const remainingAppointments = parseInt(verifyResult.rows[0].count);
    
    if (remainingAppointments === 0) {
      console.log('🎉 Database successfully cleared! No appointments remain.');
    } else {
      console.log(`⚠️  Warning: ${remainingAppointments} appointments still remain in the database`);
    }
    
  } catch (error) {
    console.error('❌ Error clearing appointments:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  clearAllAppointments()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { clearAllAppointments };
