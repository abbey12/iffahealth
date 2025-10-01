import express from 'express';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { requireDoctorOrNurse } from '../middleware/auth';

const router = express.Router();

// Get all users (for doctors/nurses)
router.get('/', requireDoctorOrNurse, asyncHandler(async (req, res) => {
  const { role, specialty, page = 1, limit = 10 } = req.query;
  
  const whereClause: any = {};
  if (role) whereClause.role = role;
  if (specialty) whereClause.specialty = specialty;

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    limit: Number(limit),
    offset,
    order: [['createdAt', 'DESC']],
  });

  res.json({
    success: true,
    data: {
      users: users.map(user => user.toJSON()),
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit)),
      },
    },
  });
}));

// Get user by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    data: {
      user: user.toJSON(),
    },
  });
}));

// Update user
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Don't allow updating password through this route
  const { password, ...updateData } = req.body;
  
  await user.update(updateData);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: user.toJSON(),
    },
  });
}));

// Delete user (soft delete by updating isVerified to false)
router.delete('/:id', requireDoctorOrNurse, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  await user.update({ isVerified: false });

  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
}));

export default router;
