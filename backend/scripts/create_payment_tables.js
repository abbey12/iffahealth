const { query } = require('../config/database');

async function createPaymentTables() {
  try {
    console.log('🔄 Creating payment tables...');
    
    // Create payment_transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'GHS',
        reference VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'paystack',
        paystack_reference VARCHAR(255),
        paystack_response JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    console.log('✅ payment_transactions table created');
    
    // Create index for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_patient_id 
      ON payment_transactions(patient_id)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_appointment_id 
      ON payment_transactions(appointment_id)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference 
      ON payment_transactions(reference)
    `);
    
    console.log('✅ Payment table indexes created');
    
    // Add payment_status column to appointments table if it doesn't exist
    await query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'
    `);
    
    console.log('✅ payment_status column added to appointments table');
    
    console.log('🎉 Payment tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating payment tables:', error);
    throw error;
  }
}

// Run the migration
createPaymentTables()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
