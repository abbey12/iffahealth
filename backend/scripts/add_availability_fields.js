const { query } = require('../config/database');

async function addAvailabilityFields() {
  try {
    console.log('Adding availability fields to doctors table...');

    // Add availability fields to doctors table
    await query(`
      ALTER TABLE doctors 
      ADD COLUMN IF NOT EXISTS availability_schedule JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS working_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}',
      ADD COLUMN IF NOT EXISTS break_times JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS appointment_duration INTEGER DEFAULT 30,
      ADD COLUMN IF NOT EXISTS max_appointments_per_day INTEGER DEFAULT 20,
      ADD COLUMN IF NOT EXISTS advance_booking_days INTEGER DEFAULT 30,
      ADD COLUMN IF NOT EXISTS emergency_availability BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC'
    `);

    console.log('✅ Availability fields added successfully to doctors table');

    // Update existing doctors with default availability settings
    await query(`
      UPDATE doctors 
      SET 
        availability_schedule = '{
          "monday": {"start": "09:00", "end": "17:00", "breaks": []},
          "tuesday": {"start": "09:00", "end": "17:00", "breaks": []},
          "wednesday": {"start": "09:00", "end": "17:00", "breaks": []},
          "thursday": {"start": "09:00", "end": "17:00", "breaks": []},
          "friday": {"start": "09:00", "end": "17:00", "breaks": []},
          "saturday": {"start": "09:00", "end": "13:00", "breaks": []},
          "sunday": {"start": null, "end": null, "breaks": []}
        }',
        working_days = ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        working_hours = '{"start": "09:00", "end": "17:00"}',
        break_times = '[]',
        appointment_duration = 30,
        max_appointments_per_day = 20,
        advance_booking_days = 30,
        emergency_availability = true,
        timezone = 'UTC'
      WHERE availability_schedule IS NULL OR availability_schedule = '{}'
    `);

    console.log('✅ Default availability settings applied to existing doctors');

    console.log('🎉 Availability fields setup completed successfully!');

  } catch (error) {
    console.error('❌ Error adding availability fields:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addAvailabilityFields()
    .then(() => {
      console.log('Availability fields setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = addAvailabilityFields;
