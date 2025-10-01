import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw createError('JWT_SECRET not configured', 500);
  }
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

// Register validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('dateOfBirth').isISO8601().withMessage('Please provide a valid date of birth'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('address').trim().isLength({ min: 10 }).withMessage('Address must be at least 10 characters'),
  body('city').trim().isLength({ min: 2 }).withMessage('City must be at least 2 characters'),
  body('emergencyContact').trim().isLength({ min: 2 }).withMessage('Emergency contact name is required'),
  body('emergencyPhone').isMobilePhone().withMessage('Please provide a valid emergency phone number'),
];

// Login validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register endpoint
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    dateOfBirth,
    gender,
    address,
    city,
    country = 'Ghana',
    emergencyContact,
    emergencyPhone,
    bloodType,
    allergies = [],
    medicalConditions = [],
    medications = [],
    role = 'patient',
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phone,
    dateOfBirth,
    gender,
    address,
    city,
    country,
    emergencyContact,
    emergencyPhone,
    bloodType,
    allergies,
    medicalConditions,
    medications,
    role,
  });

  // Generate token
  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      token,
    },
  });
}));

// Login endpoint
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Validate password
  const isValidPassword = await user.validatePassword(password);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Generate token
  const token = generateToken(user.id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      token,
    },
  });
}));

// Get current user profile
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw createError('JWT_SECRET not configured', 500);
  }

  const decoded = jwt.verify(token, secret) as { userId: string };
  const user = await User.findByPk(decoded.userId);

  if (!user) {
    return res.status(401).json({
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

// Update user profile
router.put('/profile', [
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone(),
  body('address').optional().trim().isLength({ min: 10 }),
  body('city').optional().trim().isLength({ min: 2 }),
  body('emergencyContact').optional().trim().isLength({ min: 2 }),
  body('emergencyPhone').optional().isMobilePhone(),
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw createError('JWT_SECRET not configured', 500);
  }

  const decoded = jwt.verify(token, secret) as { userId: string };
  const user = await User.findByPk(decoded.userId);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found',
    });
  }

  // Update user profile
  await user.update(req.body);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.toJSON(),
    },
  });
}));

export default router;
