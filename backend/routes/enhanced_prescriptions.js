const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validatePrescription } = require('../middleware/enhanced_validation');

const router = express.Router();

// Create new prescription
router.post('/', authenticateToken, validatePrescription, async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      prescription_date,
      notes,
      follow_up_date,
      items
    } = req.body;
    
    // Start transaction
    await query('BEGIN');
    
    // Create prescription
    const prescriptionResult = await query(`
      INSERT INTO prescriptions (
        patient_id, doctor_id, prescription_date, notes, follow_up_date, status
      ) VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id, patient_id, doctor_id, prescription_date, status, notes, follow_up_date, created_at, updated_at
    `, [patient_id, doctor_id, prescription_date, notes, follow_up_date]);
    
    const prescription = prescriptionResult.rows[0];
    
    // Add prescription items
    if (items && items.length > 0) {
      for (const item of items) {
        await query(`
          INSERT INTO prescription_items (
            prescription_id, medication_name, dosage, frequency, quantity, instructions
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          prescription.id,
          item.medicationName,
          item.dosage,
          item.frequency,
          item.quantity,
          item.instructions
        ]);
      }
    }
    
    // Commit transaction
    await query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: prescription
    });
    
  } catch (error) {
    // Rollback transaction
    await query('ROLLBACK');
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message
    });
  }
});

// Get prescription by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get prescription details
    const prescriptionResult = await query(`
      SELECT 
        p.id,
        p.patient_id,
        p.doctor_id,
        p.prescription_date,
        p.status,
        p.notes,
        p.follow_up_date,
        p.created_at,
        p.updated_at,
        pt.first_name as patient_first_name,
        pt.last_name as patient_last_name,
        pt.phone as patient_phone,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty as doctor_specialty
      FROM prescriptions p
      JOIN patients pt ON p.patient_id = pt.id
      JOIN doctors d ON p.doctor_id = d.id
      WHERE p.id = $1
    `, [id]);
    
    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    const prescription = prescriptionResult.rows[0];
    
    // Get prescription items
    const itemsResult = await query(`
      SELECT 
        id,
        medication_name,
        dosage,
        frequency,
        quantity,
        instructions,
        created_at
      FROM prescription_items
      WHERE prescription_id = $1
      ORDER BY created_at ASC
    `, [id]);
    
    const items = itemsResult.rows.map(item => ({
      id: item.id,
      medicationName: item.medication_name,
      dosage: item.dosage,
      frequency: item.frequency,
      quantity: item.quantity,
      instructions: item.instructions,
      createdAt: item.created_at
    }));
    
    res.json({
      success: true,
      data: {
        id: prescription.id,
        patientId: prescription.patient_id,
        doctorId: prescription.doctor_id,
        patientName: `${prescription.patient_first_name} ${prescription.patient_last_name}`,
        patientPhone: prescription.patient_phone,
        doctorName: `${prescription.doctor_first_name} ${prescription.doctor_last_name}`,
        doctorSpecialty: prescription.doctor_specialty,
        prescriptionDate: prescription.prescription_date,
        status: prescription.status,
        notes: prescription.notes,
        followUpDate: prescription.follow_up_date,
        items,
        createdAt: prescription.created_at,
        updatedAt: prescription.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update prescription
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, follow_up_date } = req.body;
    
    const result = await query(`
      UPDATE prescriptions 
      SET 
        status = COALESCE($2, status),
        notes = COALESCE($3, notes),
        follow_up_date = COALESCE($4, follow_up_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, status, notes, follow_up_date]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Prescription updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get prescriptions by patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE p.patient_id = $1';
    let queryParams = [patientId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND p.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM prescriptions p 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        p.id,
        p.prescription_date,
        p.status,
        p.notes,
        p.follow_up_date,
        p.created_at,
        p.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty as doctor_specialty
      FROM prescriptions p
      JOIN doctors d ON p.doctor_id = d.id
      ${whereClause}
      ORDER BY p.prescription_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const prescriptions = dataResult.rows.map(row => ({
      id: row.id,
      patientId: patientId,
      doctorName: `${row.doctor_first_name} ${row.doctor_last_name}`,
      doctorSpecialty: row.doctor_specialty,
      prescriptionDate: row.prescription_date,
      status: row.status,
      notes: row.notes,
      followUpDate: row.follow_up_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get prescriptions by doctor
router.get('/doctor/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE p.doctor_id = $1';
    let queryParams = [doctorId];
    let paramCount = 2;
    
    if (status) {
      whereClause += ` AND p.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM prescriptions p 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        p.id,
        p.patient_id,
        p.prescription_date,
        p.status,
        p.notes,
        p.follow_up_date,
        p.created_at,
        p.updated_at,
        pt.first_name as patient_first_name,
        pt.last_name as patient_last_name,
        pt.phone as patient_phone
      FROM prescriptions p
      JOIN patients pt ON p.patient_id = pt.id
      ${whereClause}
      ORDER BY p.prescription_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const prescriptions = dataResult.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: `${row.patient_first_name} ${row.patient_last_name}`,
      patientPhone: row.patient_phone,
      prescriptionDate: row.prescription_date,
      status: row.status,
      notes: row.notes,
      followUpDate: row.follow_up_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add item to prescription
router.post('/:id/items', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { medicationName, dosage, frequency, quantity, instructions } = req.body;
    
    // Check if prescription exists
    const prescriptionCheck = await query('SELECT id FROM prescriptions WHERE id = $1', [id]);
    if (prescriptionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }
    
    const result = await query(`
      INSERT INTO prescription_items (
        prescription_id, medication_name, dosage, frequency, quantity, instructions
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, medicationName, dosage, frequency, quantity, instructions]);
    
    res.status(201).json({
      success: true,
      message: 'Item added to prescription successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error adding prescription item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update prescription item
router.put('/:id/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { medicationName, dosage, frequency, quantity, instructions } = req.body;
    
    const result = await query(`
      UPDATE prescription_items 
      SET 
        medication_name = COALESCE($3, medication_name),
        dosage = COALESCE($4, dosage),
        frequency = COALESCE($5, frequency),
        quantity = COALESCE($6, quantity),
        instructions = COALESCE($7, instructions)
      WHERE id = $1 AND prescription_id = $2
      RETURNING *
    `, [itemId, id, medicationName, dosage, frequency, quantity, instructions]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Prescription item updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating prescription item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete prescription item
router.delete('/:id/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { id, itemId } = req.params;
    
    const result = await query(`
      DELETE FROM prescription_items 
      WHERE id = $1 AND prescription_id = $2
      RETURNING *
    `, [itemId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Prescription item deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting prescription item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get prescription items
router.get('/:id/items', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        id,
        medication_name,
        dosage,
        frequency,
        quantity,
        instructions,
        created_at
      FROM prescription_items
      WHERE prescription_id = $1
      ORDER BY created_at ASC
    `, [id]);
    
    const items = result.rows.map(item => ({
      id: item.id,
      medicationName: item.medication_name,
      dosage: item.dosage,
      frequency: item.frequency,
      quantity: item.quantity,
      instructions: item.instructions,
      createdAt: item.created_at
    }));
    
    res.json({
      success: true,
      data: items
    });
    
  } catch (error) {
    console.error('Error fetching prescription items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search medications
router.get('/medications/search', authenticateToken, async (req, res) => {
  try {
    const { query: searchQuery, limit = 20 } = req.query;
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }
    
    // This would typically search a medications database
    // For now, we'll return a mock response
    const mockMedications = [
      { id: '1', name: 'Paracetamol', dosage: '500mg', form: 'Tablet' },
      { id: '2', name: 'Ibuprofen', dosage: '400mg', form: 'Tablet' },
      { id: '3', name: 'Amoxicillin', dosage: '250mg', form: 'Capsule' },
      { id: '4', name: 'Metformin', dosage: '500mg', form: 'Tablet' },
      { id: '5', name: 'Lisinopril', dosage: '10mg', form: 'Tablet' }
    ].filter(med => 
      med.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, limit);
    
    res.json({
      success: true,
      data: mockMedications
    });
    
  } catch (error) {
    console.error('Error searching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get prescription statistics
router.get('/stats/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND p.prescription_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND p.prescription_date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND p.prescription_date >= CURRENT_DATE - INTERVAL '365 days'";
        break;
    }
    
    const statsResult = await query(`
      SELECT 
        COUNT(p.id) as total_prescriptions,
        COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_prescriptions,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_prescriptions,
        COUNT(pi.id) as total_medications_prescribed,
        COUNT(DISTINCT p.patient_id) as unique_patients
      FROM prescriptions p
      LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
      WHERE p.doctor_id = $1 ${dateFilter}
    `, [doctorId]);
    
    const stats = statsResult.rows[0];
    
    res.json({
      success: true,
      data: {
        totalPrescriptions: parseInt(stats.total_prescriptions),
        activePrescriptions: parseInt(stats.active_prescriptions),
        completedPrescriptions: parseInt(stats.completed_prescriptions),
        totalMedicationsPrescribed: parseInt(stats.total_medications_prescribed),
        uniquePatients: parseInt(stats.unique_patients)
      }
    });
    
  } catch (error) {
    console.error('Error fetching prescription stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
