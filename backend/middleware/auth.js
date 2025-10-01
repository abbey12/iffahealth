const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'iffahealth-secret-key-2024';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if this is an admin user
    if (decoded.type === 'admin') {
      // Get admin user details from admin_users table
      const adminResult = await query(
        'SELECT id, email, role, created_at FROM admin_users WHERE id = $1',
        [decoded.userId || decoded.id]
      );

      if (adminResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Admin user not found'
        });
      }

      const admin = adminResult.rows[0];

      // Add admin user info to request
      req.user = {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        type: 'admin'
      };
    } else {
      // Get regular user details from users table
      const userResult = await query(
        'SELECT id, email, role, is_verified FROM users WHERE id = $1',
        [decoded.userId || decoded.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userResult.rows[0];

      if (!user.is_verified) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        type: 'user'
      };
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};