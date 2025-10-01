const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateMedicalRecord } = require('../middleware/enhanced_validation');

const router = express.Router();

// Create new medical record
router.post('/', authenticateToken, validateMedicalRecord, async (req, res) => {
  try {
    const {
      patient_id,
      type,
      title,
      description,
      record_date,
      doctor_id,
      hospital_id,
      attachments
    } = req.body;
    
    const result = await query(`
      INSERT INTO health_records (
        patient_id, type, title, description, record_date, doctor_id, hospital_id, attachments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, patient_id, type, title, description, record_date, doctor_id, hospital_id, attachments, created_at, updated_at
    `, [patient_id, type, title, description, record_date, doctor_id, hospital_id, attachments || []]);
    
    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create medical record',
      error: error.message
    });
  }
});

// Get medical record by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        hr.id,
        hr.patient_id,
        hr.type,
        hr.title,
        hr.description,
        hr.record_date,
        hr.doctor_id,
        hr.hospital_id,
        hr.attachments,
        hr.created_at,
        hr.updated_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty as doctor_specialty,
        h.name as hospital_name
      FROM health_records hr
      JOIN patients p ON hr.patient_id = p.id
      LEFT JOIN doctors d ON hr.doctor_id = d.id
      LEFT JOIN hospitals h ON hr.hospital_id = h.id
      WHERE hr.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }
    
    const medicalRecord = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: medicalRecord.id,
        patientId: medicalRecord.patient_id,
        patientName: `${medicalRecord.patient_first_name} ${medicalRecord.patient_last_name}`,
        patientPhone: medicalRecord.patient_phone,
        type: medicalRecord.type,
        title: medicalRecord.title,
        description: medicalRecord.description,
        recordDate: medicalRecord.record_date,
        doctorId: medicalRecord.doctor_id,
        doctorName: medicalRecord.doctor_first_name && medicalRecord.doctor_last_name 
          ? `${medicalRecord.doctor_first_name} ${medicalRecord.doctor_last_name}` 
          : null,
        doctorSpecialty: medicalRecord.doctor_specialty,
        hospitalId: medicalRecord.hospital_id,
        hospitalName: medicalRecord.hospital_name,
        attachments: medicalRecord.attachments || [],
        createdAt: medicalRecord.created_at,
        updatedAt: medicalRecord.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error fetching medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update medical record
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, record_date, attachments } = req.body;
    
    const result = await query(`
      UPDATE health_records 
      SET 
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        record_date = COALESCE($4, record_date),
        attachments = COALESCE($5, attachments),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, title, description, record_date, attachments ? JSON.stringify(attachments) : null]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete medical record
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      DELETE FROM health_records 
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get medical records by patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE hr.patient_id = $1';
    let queryParams = [patientId];
    let paramCount = 2;
    
    if (type) {
      whereClause += ` AND hr.type = $${paramCount}`;
      queryParams.push(type);
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM health_records hr 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        hr.id,
        hr.type,
        hr.title,
        hr.description,
        hr.record_date,
        hr.attachments,
        hr.created_at,
        hr.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty as doctor_specialty,
        h.name as hospital_name
      FROM health_records hr
      LEFT JOIN doctors d ON hr.doctor_id = d.id
      LEFT JOIN hospitals h ON hr.hospital_id = h.id
      ${whereClause}
      ORDER BY hr.record_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const medicalRecords = dataResult.rows.map(row => ({
      id: row.id,
      patientId: patientId,
      type: row.type,
      title: row.title,
      description: row.description,
      recordDate: row.record_date,
      attachments: row.attachments || [],
      doctor: row.doctor_first_name && row.doctor_last_name 
        ? `${row.doctor_first_name} ${row.doctor_last_name}` 
        : null,
      doctorSpecialty: row.doctor_specialty,
      hospital: row.hospital_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: medicalRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching patient medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get recent medical records for patient
router.get('/patient/:patientId/recent', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 10 } = req.query;
    
    const result = await query(`
      SELECT 
        hr.id,
        hr.type,
        hr.title,
        hr.description,
        hr.record_date,
        hr.attachments,
        hr.created_at,
        hr.updated_at,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialty as doctor_specialty,
        h.name as hospital_name
      FROM health_records hr
      LEFT JOIN doctors d ON hr.doctor_id = d.id
      LEFT JOIN hospitals h ON hr.hospital_id = h.id
      WHERE hr.patient_id = $1 
        AND hr.record_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY hr.record_date DESC
      LIMIT $2
    `, [patientId, limit]);
    
    const medicalRecords = result.rows.map(row => ({
      id: row.id,
      patientId: patientId,
      type: row.type,
      title: row.title,
      description: row.description,
      recordDate: row.record_date,
      attachments: row.attachments || [],
      doctor: row.doctor_first_name && row.doctor_last_name 
        ? `${row.doctor_first_name} ${row.doctor_last_name}` 
        : null,
      doctorSpecialty: row.doctor_specialty,
      hospital: row.hospital_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: medicalRecords
    });
    
  } catch (error) {
    console.error('Error fetching recent medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get medical records by doctor
router.get('/doctor/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE hr.doctor_id = $1';
    let queryParams = [doctorId];
    let paramCount = 2;
    
    if (type) {
      whereClause += ` AND hr.type = $${paramCount}`;
      queryParams.push(type);
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM health_records hr 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        hr.id,
        hr.patient_id,
        hr.type,
        hr.title,
        hr.description,
        hr.record_date,
        hr.attachments,
        hr.created_at,
        hr.updated_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        h.name as hospital_name
      FROM health_records hr
      JOIN patients p ON hr.patient_id = p.id
      LEFT JOIN hospitals h ON hr.hospital_id = h.id
      ${whereClause}
      ORDER BY hr.record_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const medicalRecords = dataResult.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: `${row.patient_first_name} ${row.patient_last_name}`,
      patientPhone: row.patient_phone,
      type: row.type,
      title: row.title,
      description: row.description,
      recordDate: row.record_date,
      attachments: row.attachments || [],
      hospital: row.hospital_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: medicalRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching doctor medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search medical records
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { 
      query: searchQuery, 
      patient_id, 
      doctor_id, 
      type, 
      date_from, 
      date_to, 
      page = 1, 
      limit = 10 
    } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    let paramCount = 1;
    
    if (searchQuery) {
      whereClause += ` AND (hr.title ILIKE $${paramCount} OR hr.description ILIKE $${paramCount})`;
      queryParams.push(`%${searchQuery}%`);
      paramCount++;
    }
    
    if (patient_id) {
      whereClause += ` AND hr.patient_id = $${paramCount}`;
      queryParams.push(patient_id);
      paramCount++;
    }
    
    if (doctor_id) {
      whereClause += ` AND hr.doctor_id = $${paramCount}`;
      queryParams.push(doctor_id);
      paramCount++;
    }
    
    if (type) {
      whereClause += ` AND hr.type = $${paramCount}`;
      queryParams.push(type);
      paramCount++;
    }
    
    if (date_from) {
      whereClause += ` AND hr.record_date >= $${paramCount}`;
      queryParams.push(date_from);
      paramCount++;
    }
    
    if (date_to) {
      whereClause += ` AND hr.record_date <= $${paramCount}`;
      queryParams.push(date_to);
      paramCount++;
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM health_records hr 
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        hr.id,
        hr.patient_id,
        hr.type,
        hr.title,
        hr.description,
        hr.record_date,
        hr.attachments,
        hr.created_at,
        hr.updated_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        h.name as hospital_name
      FROM health_records hr
      LEFT JOIN patients p ON hr.patient_id = p.id
      LEFT JOIN doctors d ON hr.doctor_id = d.id
      LEFT JOIN hospitals h ON hr.hospital_id = h.id
      ${whereClause}
      ORDER BY hr.record_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams),
      query(dataQuery, [...queryParams, limit, offset])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    const medicalRecords = dataResult.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_first_name && row.patient_last_name 
        ? `${row.patient_first_name} ${row.patient_last_name}` 
        : null,
      type: row.type,
      title: row.title,
      description: row.description,
      recordDate: row.record_date,
      attachments: row.attachments || [],
      doctor: row.doctor_first_name && row.doctor_last_name 
        ? `${row.doctor_first_name} ${row.doctor_last_name}` 
        : null,
      hospital: row.hospital_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: medicalRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error searching medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get medical record types
router.get('/types/list', authenticateToken, async (req, res) => {
  try {
    const medicalRecordTypes = [
      { id: 'consultation', name: 'Consultation', description: 'Medical consultation notes' },
      { id: 'diagnosis', name: 'Diagnosis', description: 'Medical diagnosis and findings' },
      { id: 'treatment', name: 'Treatment', description: 'Treatment plans and procedures' },
      { id: 'procedure', name: 'Procedure', description: 'Medical procedures and surgeries' },
      { id: 'vaccination', name: 'Vaccination', description: 'Vaccination records' },
      { id: 'lab_result', name: 'Lab Result', description: 'Laboratory test results' },
      { id: 'prescription', name: 'Prescription', description: 'Medication prescriptions' },
      { id: 'imaging', name: 'Imaging', description: 'X-rays, CT scans, MRIs' },
      { id: 'pathology', name: 'Pathology', description: 'Pathology reports' },
      { id: 'discharge', name: 'Discharge Summary', description: 'Hospital discharge summaries' },
      { id: 'emergency', name: 'Emergency Visit', description: 'Emergency room visits' },
      { id: 'follow_up', name: 'Follow-up', description: 'Follow-up visit notes' }
    ];
    
    res.json({
      success: true,
      data: medicalRecordTypes
    });
    
  } catch (error) {
    console.error('Error fetching medical record types:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get medical record statistics
router.get('/stats/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND hr.record_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND hr.record_date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND hr.record_date >= CURRENT_DATE - INTERVAL '365 days'";
        break;
    }
    
    const statsResult = await query(`
      SELECT 
        COUNT(hr.id) as total_records,
        COUNT(CASE WHEN hr.type = 'consultation' THEN 1 END) as consultations,
        COUNT(CASE WHEN hr.type = 'diagnosis' THEN 1 END) as diagnoses,
        COUNT(CASE WHEN hr.type = 'treatment' THEN 1 END) as treatments,
        COUNT(CASE WHEN hr.type = 'procedure' THEN 1 END) as procedures,
        COUNT(CASE WHEN hr.type = 'lab_result' THEN 1 END) as lab_results,
        COUNT(DISTINCT hr.patient_id) as unique_patients
      FROM health_records hr
      WHERE hr.doctor_id = $1 ${dateFilter}
    `, [doctorId]);
    
    const stats = statsResult.rows[0];
    
    res.json({
      success: true,
      data: {
        totalRecords: parseInt(stats.total_records),
        consultations: parseInt(stats.consultations),
        diagnoses: parseInt(stats.diagnoses),
        treatments: parseInt(stats.treatments),
        procedures: parseInt(stats.procedures),
        labResults: parseInt(stats.lab_results),
        uniquePatients: parseInt(stats.unique_patients)
      }
    });
    
  } catch (error) {
    console.error('Error fetching medical record stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload file attachment
router.post('/:id/attachments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fileUrl, fileName, fileType } = req.body;
    
    // Get current attachments
    const currentResult = await query('SELECT attachments FROM health_records WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }
    
    const currentAttachments = currentResult.rows[0].attachments || [];
    const newAttachment = {
      url: fileUrl,
      name: fileName,
      type: fileType,
      uploadedAt: new Date().toISOString()
    };
    
    const updatedAttachments = [...currentAttachments, newAttachment];
    
    const result = await query(`
      UPDATE health_records 
      SET 
        attachments = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, JSON.stringify(updatedAttachments)]);
    
    res.json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove file attachment
router.delete('/:id/attachments/:attachmentIndex', authenticateToken, async (req, res) => {
  try {
    const { id, attachmentIndex } = req.params;
    const index = parseInt(attachmentIndex);
    
    // Get current attachments
    const currentResult = await query('SELECT attachments FROM health_records WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }
    
    const currentAttachments = currentResult.rows[0].attachments || [];
    
    if (index < 0 || index >= currentAttachments.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attachment index'
      });
    }
    
    const updatedAttachments = currentAttachments.filter((_, i) => i !== index);
    
    const result = await query(`
      UPDATE health_records 
      SET 
        attachments = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, JSON.stringify(updatedAttachments)]);
    
    res.json({
      success: true,
      message: 'Attachment removed successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error removing attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
