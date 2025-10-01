const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const { specialty, hospital_id } = req.query;
    
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    let paramCount = 1;
    
    if (specialty) {
      whereClause += ` AND specialty ILIKE $${paramCount}`;
      queryParams.push(`%${specialty}%`);
      paramCount++;
    }
    
    if (hospital_id) {
      whereClause += ` AND hospital_id = $${paramCount}`;
      queryParams.push(hospital_id);
      paramCount++;
    }
    
    const result = await query(`
      SELECT d.id, d.first_name, d.last_name, d.email, d.phone, d.specialty,
             d.license_number, d.experience_years, d.bio, d.profile_image_url,
             d.created_at, h.name as hospital_name
      FROM doctors d
      LEFT JOIN hospitals h ON d.hospital_id = h.id
      ${whereClause}
      ORDER BY d.first_name, d.last_name
    `, queryParams);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      error: error.message
    });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT d.id, d.first_name, d.last_name, d.email, d.phone, d.specialty,
             d.license_number, d.experience_years, d.bio, d.profile_image_url,
             d.created_at, h.name as hospital_name, h.address as hospital_address
      FROM doctors d
      LEFT JOIN hospitals h ON d.hospital_id = h.id
      WHERE d.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor',
      error: error.message
    });
  }
});

module.exports = router;
