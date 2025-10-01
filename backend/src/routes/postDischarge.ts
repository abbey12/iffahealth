import express from 'express';
import { body, validationResult } from 'express-validator';
import { PostDischargeCare } from '../models/PostDischargeCare';
import { CarePlanTask } from '../models/CarePlanTask';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { requireDoctorOrNurse } from '../middleware/auth';

const router = express.Router();

// Get user's post-discharge care plan
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  const carePlan = await PostDischargeCare.findOne({
    where: { patientId: userId, status: 'active' },
    include: [
      {
        model: User,
        as: 'assignedNurse',
        attributes: ['id', 'firstName', 'lastName', 'phone', 'specialty'],
      },
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'specialty'],
      },
    ],
  });

  if (!carePlan) {
    return res.status(404).json({
      success: false,
      message: 'No active post-discharge care plan found',
    });
  }

  // Get care plan tasks
  const tasks = await CarePlanTask.findAll({
    where: { postDischargeCareId: carePlan.id },
    order: [['dueDate', 'ASC']],
  });

  res.json({
    success: true,
    data: {
      carePlan,
      tasks,
    },
  });
}));

// Get care plan tasks
router.get('/tasks', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { status, priority, category } = req.query;

  // First get the active care plan
  const carePlan = await PostDischargeCare.findOne({
    where: { patientId: userId, status: 'active' },
  });

  if (!carePlan) {
    return res.status(404).json({
      success: false,
      message: 'No active post-discharge care plan found',
    });
  }

  const whereClause: any = { postDischargeCareId: carePlan.id };
  if (status) whereClause.status = status;
  if (priority) whereClause.priority = priority;
  if (category) whereClause.category = category;

  const tasks = await CarePlanTask.findAll({
    where: whereClause,
    order: [['dueDate', 'ASC']],
  });

  res.json({
    success: true,
    data: { tasks },
  });
}));

// Update task status
router.patch('/tasks/:id/complete', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verify the task belongs to the user's care plan
  const carePlan = await PostDischargeCare.findOne({
    where: { patientId: userId, status: 'active' },
  });

  if (!carePlan) {
    return res.status(404).json({
      success: false,
      message: 'No active care plan found',
    });
  }

  const task = await CarePlanTask.findOne({
    where: { id, postDischargeCareId: carePlan.id },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  await task.update({ 
    status: 'completed',
    completedAt: new Date(),
  });

  res.json({
    success: true,
    message: 'Task marked as completed',
    data: { task },
  });
}));

// Add notes to task
router.patch('/tasks/:id/notes', [
  body('notes').notEmpty().withMessage('Notes are required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const { notes } = req.body;
  const userId = req.user?.id;

  // Verify the task belongs to the user's care plan
  const carePlan = await PostDischargeCare.findOne({
    where: { patientId: userId, status: 'active' },
  });

  if (!carePlan) {
    return res.status(404).json({
      success: false,
      message: 'No active care plan found',
    });
  }

  const task = await CarePlanTask.findOne({
    where: { id, postDischargeCareId: carePlan.id },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  await task.update({ notes });

  res.json({
    success: true,
    message: 'Notes added successfully',
    data: { task },
  });
}));

// Create new post-discharge care plan (for doctors/nurses)
router.post('/', requireDoctorOrNurse, [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('assignedNurseId').isUUID().withMessage('Valid nurse ID is required'),
  body('dischargeDate').isISO8601().withMessage('Valid discharge date is required'),
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('treatment').notEmpty().withMessage('Treatment is required'),
  body('medications').isArray().withMessage('Medications must be an array'),
  body('careInstructions').notEmpty().withMessage('Care instructions are required'),
  body('followUpDate').isISO8601().withMessage('Valid follow-up date is required'),
  body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Priority must be high, medium, or low'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const {
    patientId,
    assignedNurseId,
    dischargeDate,
    diagnosis,
    treatment,
    medications,
    careInstructions,
    followUpDate,
    priority = 'medium',
  } = req.body;

  // Verify patient exists
  const patient = await User.findOne({
    where: { id: patientId, role: 'patient' },
  });

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  // Verify nurse exists
  const nurse = await User.findOne({
    where: { id: assignedNurseId, role: 'nurse' },
  });

  if (!nurse) {
    return res.status(404).json({
      success: false,
      message: 'Nurse not found',
    });
  }

  // Create care plan
  const carePlan = await PostDischargeCare.create({
    patientId,
    assignedNurseId,
    doctorId: req.user?.id,
    dischargeDate,
    diagnosis,
    treatment,
    medications,
    careInstructions,
    followUpDate,
    priority,
  });

  // Create initial tasks based on care instructions
  const tasks = await createInitialTasks(carePlan.id, careInstructions, medications);

  res.status(201).json({
    success: true,
    message: 'Post-discharge care plan created successfully',
    data: {
      carePlan,
      tasks,
    },
  });
}));

// Add task to care plan (for doctors/nurses)
router.post('/:carePlanId/tasks', requireDoctorOrNurse, [
  body('title').notEmpty().withMessage('Task title is required'),
  body('description').notEmpty().withMessage('Task description is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Priority must be high, medium, or low'),
  body('category').optional().isIn(['medication', 'exercise', 'diet', 'appointment', 'other']).withMessage('Invalid category'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { carePlanId } = req.params;
  const { title, description, dueDate, priority = 'medium', category = 'other' } = req.body;

  // Verify care plan exists
  const carePlan = await PostDischargeCare.findByPk(carePlanId);
  if (!carePlan) {
    return res.status(404).json({
      success: false,
      message: 'Care plan not found',
    });
  }

  const task = await CarePlanTask.create({
    postDischargeCareId: carePlanId,
    title,
    description,
    dueDate,
    priority,
    category,
  });

  res.status(201).json({
    success: true,
    message: 'Task added successfully',
    data: { task },
  });
}));

// Helper function to create initial tasks
async function createInitialTasks(carePlanId: string, careInstructions: string, medications: string[]): Promise<CarePlanTask[]> {
  const tasks: any[] = [];

  // Add medication tasks
  medications.forEach((medication, index) => {
    tasks.push({
      postDischargeCareId: carePlanId,
      title: `Take ${medication}`,
      description: `Take prescribed medication: ${medication}`,
      dueDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000), // Next few days
      priority: 'high',
      category: 'medication',
    });
  });

  // Add follow-up appointment task
  tasks.push({
    postDischargeCareId: carePlanId,
    title: 'Follow-up Appointment',
    description: 'Schedule and attend follow-up appointment with doctor',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    priority: 'high',
    category: 'appointment',
  });

  // Add general care task
  tasks.push({
    postDischargeCareId: carePlanId,
    title: 'Follow Care Instructions',
    description: careInstructions,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    priority: 'medium',
    category: 'other',
  });

  return await CarePlanTask.bulkCreate(tasks);
}

export default router;
