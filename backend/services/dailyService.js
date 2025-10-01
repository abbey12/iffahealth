/**
 * Daily.co Video Service
 * Handles video room creation and management using Daily.co API
 */

const axios = require('axios');

class DailyService {
  constructor() {
    this.apiKey = process.env.DAILY_API_KEY || 'e37e1b06e7fce26db40624e12fe963082e04f3a1748cdb4a87f0c4b2b4895fc7';
    this.baseUrl = 'https://api.daily.co/v1';
    this.domain = process.env.DAILY_DOMAIN || 'iffahealth.daily.co';
  }

  /**
   * Create a new video room for an appointment
   */
  async createRoom(appointmentData) {
    try {
      const {
        appointmentId,
        doctorId,
        patientId,
        doctorName,
        patientName,
        appointmentDate,
        appointmentTime,
        duration = 60 // minutes
      } = appointmentData;

      // Generate unique room name
      const roomName = `appointment-${appointmentId.slice(-8)}-${Date.now()}`;
      
      console.log('🎥 Creating room for appointment:', appointmentId);

      const roomConfig = {
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: 2,
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: false,
          enable_knocking: false,
          enable_prejoin_ui: true,
          start_video_off: false,
          start_audio_off: false
        }
      };

      console.log('🎥 Creating Daily.co room:', roomName);

      const response = await axios.post(`${this.baseUrl}/rooms`, roomConfig, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const room = response.data;
      
      console.log('✅ Daily.co room created successfully:', room.name);

      return {
        success: true,
        room: {
          id: room.id,
          name: room.name,
          url: room.url,
          meetingId: room.name,
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          createdAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error creating Daily.co room:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw new Error(`Failed to create video room: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Generate meeting token for secure room access
   */
  async generateMeetingToken(roomName, userRole, userId, userName) {
    try {
      const tokenConfig = {
        properties: {
          room_name: roomName,
          user_id: userId,
          user_name: userName,
          is_owner: userRole === 'doctor', // Doctor is the room owner
          exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
        }
      };

      console.log('🔑 Generating meeting token for:', { roomName, userRole, userId });

      const response = await axios.post(`${this.baseUrl}/meeting-tokens`, tokenConfig, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const tokenData = response.data;
      
      console.log('✅ Meeting token generated successfully');
      
      // Daily's response may not include properties.exp back; fall back to +1h
      const expSeconds = (tokenData && tokenData.properties && tokenData.properties.exp)
        ? tokenData.properties.exp
        : Math.floor(Date.now() / 1000) + (60 * 60);
      const tokenString = tokenData?.token ?? tokenData;
      
      return {
        success: true,
        token: tokenString,
        expiresAt: new Date(expSeconds * 1000).toISOString()
      };

    } catch (error) {
      console.error('❌ Error generating meeting token:', error.response?.data || error.message);
      throw new Error(`Failed to generate meeting token: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get room information
   */
  async getRoom(roomName) {
    try {
      const response = await axios.get(`${this.baseUrl}/rooms/${roomName}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return {
        success: true,
        room: response.data
      };

    } catch (error) {
      console.error('❌ Error getting room info:', error.response?.data || error.message);
      throw new Error(`Failed to get room information: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomName) {
    try {
      await axios.delete(`${this.baseUrl}/rooms/${roomName}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.log('✅ Room deleted successfully:', roomName);
      return { success: true };

    } catch (error) {
      console.error('❌ Error deleting room:', error.response?.data || error.message);
      throw new Error(`Failed to delete room: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get room participants
   */
  async getRoomParticipants(roomName) {
    try {
      const response = await axios.get(`${this.baseUrl}/rooms/${roomName}/participants`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return {
        success: true,
        participants: response.data
      };

    } catch (error) {
      console.error('❌ Error getting room participants:', error.response?.data || error.message);
      throw new Error(`Failed to get room participants: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Create a complete room setup for an appointment
   */
  async createAppointmentRoom(appointmentData) {
    try {
      // Create the room
      const roomResult = await this.createRoom(appointmentData);
      
      if (!roomResult.success) {
        throw new Error('Failed to create room');
      }

      const room = roomResult.room;

      // Generate secure meeting tokens for doctor and patient
      const [doctorTokenRes, patientTokenRes] = await Promise.all([
        this.generateMeetingToken(
          room.name,
          'doctor',
          appointmentData.doctorId,
          appointmentData.doctorName
        ),
        this.generateMeetingToken(
          room.name,
          'patient',
          appointmentData.patientId,
          appointmentData.patientName
        )
      ]);

      return {
        success: true,
        room: {
          ...room,
          doctorToken: doctorTokenRes.token,
          patientToken: patientTokenRes.token,
          doctorTokenExpiresAt: doctorTokenRes.expiresAt,
          patientTokenExpiresAt: patientTokenRes.expiresAt
        }
      };

    } catch (error) {
      console.error('❌ Error creating appointment room:', error);
      throw error;
    }
  }
}

module.exports = new DailyService();
