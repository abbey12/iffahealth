const { query } = require('../config/database');

async function clearEarningsData() {
  try {
    console.log('🧹 Clearing earnings data from database...');

    // Get the doctor ID from the sample data
    const doctorId = '7ef371ba-e494-4251-8cc6-a68eaf856d2b';

    // First, let's see what earnings data exists
    const existingEarnings = await query(`
      SELECT COUNT(*) as count, 
             COALESCE(SUM(amount), 0) as total_amount,
             COALESCE(SUM(net_amount), 0) as total_net_amount
      FROM doctor_earnings 
      WHERE doctor_id = $1
    `, [doctorId]);

    console.log('📊 Current earnings data:', existingEarnings.rows[0]);

    // Clear all earnings data for this doctor
    const deleteResult = await query(`
      DELETE FROM doctor_earnings 
      WHERE doctor_id = $1
    `, [doctorId]);

    console.log('✅ Earnings data cleared successfully');
    console.log('📊 Rows deleted:', deleteResult.rowCount);

    // Verify the data is cleared
    const verifyResult = await query(`
      SELECT COUNT(*) as count 
      FROM doctor_earnings 
      WHERE doctor_id = $1
    `, [doctorId]);

    console.log('🔍 Verification - remaining earnings records:', verifyResult.rows[0].count);

    // Also clear any payout requests for this doctor
    const payoutRequestsResult = await query(`
      DELETE FROM payout_requests 
      WHERE doctor_id = $1
    `, [doctorId]);

    console.log('✅ Payout requests cleared successfully');
    console.log('📊 Payout request rows deleted:', payoutRequestsResult.rowCount);

    // Verify payout requests are cleared
    const verifyPayoutsResult = await query(`
      SELECT COUNT(*) as count 
      FROM payout_requests 
      WHERE doctor_id = $1
    `, [doctorId]);

    console.log('🔍 Verification - remaining payout requests:', verifyPayoutsResult.rows[0].count);

    console.log('🎉 All earnings and payout data has been cleared successfully!');

  } catch (error) {
    console.error('❌ Error clearing earnings data:', error);
  } finally {
    process.exit();
  }
}

clearEarningsData();
