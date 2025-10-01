import app from './app';
import { testConnection } from './config/database';
import { sequelize } from './config/database';
import { User } from './models/User';
import { Appointment } from './models/Appointment';
import { PostDischargeCare } from './models/PostDischargeCare';
import { CarePlanTask } from './models/CarePlanTask';

// Test database connection
testConnection();

// Define model associations
User.hasMany(Appointment, { foreignKey: 'patientId', as: 'patientAppointments' });
User.hasMany(Appointment, { foreignKey: 'doctorId', as: 'doctorAppointments' });
User.hasMany(PostDischargeCare, { foreignKey: 'patientId', as: 'patientCarePlans' });
User.hasMany(PostDischargeCare, { foreignKey: 'assignedNurseId', as: 'nurseCarePlans' });
User.hasMany(PostDischargeCare, { foreignKey: 'doctorId', as: 'doctorCarePlans' });

Appointment.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
Appointment.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

PostDischargeCare.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
PostDischargeCare.belongsTo(User, { foreignKey: 'assignedNurseId', as: 'assignedNurse' });
PostDischargeCare.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });
PostDischargeCare.hasMany(CarePlanTask, { foreignKey: 'postDischargeCareId', as: 'tasks' });

CarePlanTask.belongsTo(PostDischargeCare, { foreignKey: 'postDischargeCareId', as: 'carePlan' });

// Sync database models
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing database models:', error);
    process.exit(1);
  }
};

// Initialize database
syncDatabase();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});
