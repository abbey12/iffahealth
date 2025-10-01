/**
 * Video Calling Routes
 * Handles Daily.co video room creation and management
 */

const express = require('express');
const router = express.Router();
const dailyService = require('../services/dailyService');
const { authenticateToken } = require('../middleware/auth');

/**
 * Create a video room for an appointment
 * POST /api/video/create-room
 */
router.post('/create-room', async (req, res) => {
  try {
    const {
      appointmentId,
      doctorId,
      patientId,
      doctorName,
      patientName,
      appointmentDate,
      appointmentTime,
      duration = 60
    } = req.body;

    // Validate required fields
    if (!appointmentId || !doctorId || !patientId || !doctorName || !patientName || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: appointmentId, doctorId, patientId, doctorName, patientName, appointmentDate, appointmentTime'
      });
    }

    console.log('🎥 Creating video room for appointment:', appointmentId);

    const result = await dailyService.createAppointmentRoom({
      appointmentId,
      doctorId,
      patientId,
      doctorName,
      patientName,
      appointmentDate,
      appointmentTime,
      duration
    });

    if (result.success) {
      console.log('✅ Video room created successfully:', result.room.name);
      res.json({
        success: true,
        data: result.room
      });
    } else {
      throw new Error('Failed to create video room');
    }

  } catch (error) {
    console.error('❌ Error creating video room:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create video room'
    });
  }
});

/**
 * Get room information
 * GET /api/video/room/:roomName
 */
router.get('/room/:roomName', authenticateToken, async (req, res) => {
  try {
    const { roomName } = req.params;

    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required'
      });
    }

    const result = await dailyService.getRoom(roomName);

    if (result.success) {
      res.json({
        success: true,
        data: result.room
      });
    } else {
      throw new Error('Failed to get room information');
    }

  } catch (error) {
    console.error('❌ Error getting room info:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get room information'
    });
  }
});

/**
 * Get room participants
 * GET /api/video/room/:roomName/participants
 */
router.get('/room/:roomName/participants', authenticateToken, async (req, res) => {
  try {
    const { roomName } = req.params;

    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required'
      });
    }

    const result = await dailyService.getRoomParticipants(roomName);

    if (result.success) {
      res.json({
        success: true,
        data: result.participants
      });
    } else {
      throw new Error('Failed to get room participants');
    }

  } catch (error) {
    console.error('❌ Error getting room participants:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get room participants'
    });
  }
});

/**
 * Generate meeting token for room access
 * POST /api/video/meeting-token
 */
router.post('/meeting-token', authenticateToken, async (req, res) => {
  try {
    const {
      roomName,
      userRole,
      userId,
      userName
    } = req.body;

    // Validate required fields
    if (!roomName || !userRole || !userId || !userName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: roomName, userRole, userId, userName'
      });
    }

    // Validate user role
    if (!['doctor', 'patient'].includes(userRole)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user role. Must be "doctor" or "patient"'
      });
    }

    console.log('🔑 Generating meeting token for:', { roomName, userRole, userId });

    const result = await dailyService.generateMeetingToken(roomName, userRole, userId, userName);

    if (result.success) {
      res.json({
        success: true,
        data: {
          token: result.token,
          expiresAt: result.expiresAt
        }
      });
    } else {
      throw new Error('Failed to generate meeting token');
    }

  } catch (error) {
    console.error('❌ Error generating meeting token:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate meeting token'
    });
  }
});

/**
 * Delete a room
 * DELETE /api/video/room/:roomName
 */
router.delete('/room/:roomName', authenticateToken, async (req, res) => {
  try {
    const { roomName } = req.params;

    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required'
      });
    }

    const result = await dailyService.deleteRoom(roomName);

    if (result.success) {
      res.json({
        success: true,
        message: 'Room deleted successfully'
      });
    } else {
      throw new Error('Failed to delete room');
    }

  } catch (error) {
    console.error('❌ Error deleting room:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete room'
    });
  }
});

module.exports = router;
