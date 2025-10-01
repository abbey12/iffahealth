/**
 * Daily.co Video Service
 * Handles video calling functionality using Daily.co SDK
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyConfig {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
}

export interface DailyRoomConfig {
  roomUrl: string;
  userName: string;
  userRole: 'doctor' | 'patient';
  roomId?: string;
  meetingId?: string;
  expiresAt?: string;
  token?: string;
}

class DailyService {
  private baseUrl = 'http://10.95.157.225:3000/api'; // Your backend API base URL
  
  /**
   * Create room configuration for joining using backend API
   */
  async createRoomConfig(config: DailyConfig, userRole: 'doctor' | 'patient'): Promise<DailyRoomConfig> {
    try {
      console.log('🎥 Creating Daily.co room via backend API:', config.appointmentId);
      
      // Call backend API to create room
      const response = await fetch(`${this.baseUrl}/video/create-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          appointmentId: config.appointmentId,
          doctorId: config.doctorId,
          patientId: config.patientId,
          doctorName: config.doctorName,
          patientName: config.patientName,
          appointmentDate: config.appointmentDate,
          appointmentTime: config.appointmentTime,
          duration: 60 // 1 hour
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create video room');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create video room');
      }

      const room = result.data;
      const userName = userRole === 'doctor' ? config.doctorName : config.patientName;
      
      console.log('✅ Daily.co room created successfully:', room.name);
      
      return {
        roomUrl: room.url,
        userName,
        userRole,
        roomId: room.id,
        meetingId: room.meetingId,
        expiresAt: room.expiresAt,
        token: userRole === 'doctor' ? room.doctorToken : room.patientToken
      };
    } catch (error) {
      console.error('❌ Error creating room config:', error);
      throw new Error(`Failed to create room configuration: ${error.message}`);
    }
  }

  /**
   * Get authentication token for API calls
   */
  private async getAuthToken(): Promise<string> {
    // This should get the JWT token from your auth storage
    // For now, return a placeholder - you'll need to implement this
    const token = await AsyncStorage.getItem('authToken');
    return token || '';
  }

  /**
   * Get meeting instructions based on user role
   */
  getMeetingInstructions(userRole: 'doctor' | 'patient'): string {
    if (userRole === 'doctor') {
      return `You are the host of this medical consultation. You can:
      • Start/stop video and audio
      • Share your screen to show medical records
      • Use the chat to send notes
      • Record the consultation if needed
      • End the call when consultation is complete`;
    } else {
      return `You are joining a medical consultation. You can:
      • Turn on/off your camera and microphone
      • Use the chat to ask questions
      • Wait for the doctor to start the consultation
      • Follow the doctor's instructions during the call`;
    }
  }

  /**
   * Validate if the current time is appropriate for the appointment
   */
  isAppointmentTimeValid(appointmentDate: string, appointmentTime: string): boolean {
    try {
      console.log('🕐 Time validation inputs:', {
        appointmentDate,
        appointmentTime
      });

      // Handle different date formats
      let appointmentDateTime: Date;
      
      if (appointmentDate.includes('T')) {
        // If appointmentDate is already in ISO format, extract just the date part
        const datePart = appointmentDate.split('T')[0];
        
        // Convert 12-hour time to 24-hour format
        let time24Hour = appointmentTime;
        if (appointmentTime.includes('AM') || appointmentTime.includes('PM')) {
          const [time, period] = appointmentTime.split(' ');
          const [hours, minutes] = time.split(':');
          let hour24 = parseInt(hours);
          
          if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
          } else if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
          }
          
          time24Hour = `${hour24.toString().padStart(2, '0')}:${minutes}`;
        }
        
        const combinedDateTime = `${datePart}T${time24Hour}`;
        console.log('🕐 Combined date time:', combinedDateTime);
        appointmentDateTime = new Date(combinedDateTime);
      } else if (appointmentDate.includes(',')) {
        // Handle formatted date strings like "Sun, Sep 28, 2025"
        try {
          // Try to parse the formatted date directly
          const parsedDate = new Date(appointmentDate);
          if (isNaN(parsedDate.getTime())) {
            // If direct parsing fails, try to extract date components manually
            const dateMatch = appointmentDate.match(/(\w+), (\w+) (\d+), (\d+)/);
            if (dateMatch) {
              const [, dayName, monthName, day, year] = dateMatch;
              const monthMap: { [key: string]: number } = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
              };
              const monthIndex = monthMap[monthName];
              if (monthIndex !== undefined) {
                const constructedDate = new Date(parseInt(year), monthIndex, parseInt(day));
                if (!isNaN(constructedDate.getTime())) {
                  appointmentDateTime = constructedDate;
                } else {
                  console.error('❌ Could not construct date from components:', { day, monthName, year });
                  return false;
                }
              } else {
                console.error('❌ Unknown month name:', monthName);
                return false;
              }
            } else {
              console.error('❌ Could not parse formatted date with regex:', appointmentDate);
              return false;
            }
          } else {
            appointmentDateTime = parsedDate;
          }
          
          // Get the date part in YYYY-MM-DD format
          const year = appointmentDateTime.getFullYear();
          const month = String(appointmentDateTime.getMonth() + 1).padStart(2, '0');
          const day = String(appointmentDateTime.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;
          
          // Convert 12-hour time to 24-hour format
          let time24Hour = appointmentTime;
          console.log('🕐 Original time:', appointmentTime);
          console.log('🕐 Contains AM/PM:', appointmentTime.includes('AM') || appointmentTime.includes('PM'));
          
          if (appointmentTime.includes('AM') || appointmentTime.includes('PM')) {
            // Use regex to split time and period more reliably
            const timeMatch = appointmentTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            console.log('🕐 Regex match result:', timeMatch);
            
            if (timeMatch) {
              const [, hours, minutes, period] = timeMatch;
              console.log('🕐 Extracted parts:', { hours, minutes, period });
              let hour24 = parseInt(hours);
              console.log('🕐 Parsed hour:', hour24);
              
              if (period.toUpperCase() === 'AM' && hour24 === 12) {
                hour24 = 0;
                console.log('🕐 12 AM case, hour24 = 0');
              } else if (period.toUpperCase() === 'PM' && hour24 !== 12) {
                hour24 += 12;
                console.log('🕐 PM case, hour24 += 12');
              }
              
              time24Hour = `${hour24.toString().padStart(2, '0')}:${minutes}`;
              console.log('🕐 Time conversion:', { original: appointmentTime, converted: time24Hour });
            } else {
              console.log('🕐 Regex did not match, using original time');
            }
          } else {
            console.log('🕐 No AM/PM found, using original time');
          }
          
          const combinedDateTime = `${dateString}T${time24Hour}`;
          console.log('🕐 Combined date time from formatted date:', combinedDateTime);
          appointmentDateTime = new Date(combinedDateTime);
        } catch (error) {
          console.error('❌ Error parsing formatted date:', error);
          return false;
        }
      } else {
        // If it's just a date string, combine with time
        // Convert 12-hour time to 24-hour format
        let time24Hour = appointmentTime;
        if (appointmentTime.includes('AM') || appointmentTime.includes('PM')) {
          const [time, period] = appointmentTime.split(' ');
          const [hours, minutes] = time.split(':');
          let hour24 = parseInt(hours);
          
          if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
          } else if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
          }
          
          time24Hour = `${hour24.toString().padStart(2, '0')}:${minutes}`;
        }
        
        const combinedDateTime = `${appointmentDate}T${time24Hour}`;
        console.log('🕐 Combined date time:', combinedDateTime);
        appointmentDateTime = new Date(combinedDateTime);
      }
      
      // Check if the date is valid
      if (isNaN(appointmentDateTime.getTime())) {
        console.error('❌ Invalid date created:', appointmentDateTime);
        return false;
      }
      
      const now = new Date();
      const timeDiffMinutes = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60); // minutes
      
      console.log('🕐 Time validation:', {
        appointmentDateTime: appointmentDateTime.toISOString(),
        now: now.toISOString(),
        timeDiffMinutes: timeDiffMinutes,
        isFuture: timeDiffMinutes > 0,
        isPast: timeDiffMinutes < 0
      });
      
      // For future appointments: allow joining 15 minutes before
      if (timeDiffMinutes > 0) {
        return timeDiffMinutes <= 15;
      }
      
      // For past appointments: allow joining up to 30 minutes after
      if (timeDiffMinutes < 0) {
        return Math.abs(timeDiffMinutes) <= 30;
      }
      
      // If exactly at appointment time, allow joining
      return true;
    } catch (error) {
      console.error('❌ Error validating appointment time:', error);
      return false;
    }
  }

  /**
   * Get room URL for sharing
   */
  getRoomUrl(roomUrl: string): string {
    return roomUrl;
  }

  /**
   * Create calendar event URL
   */
  createCalendarEvent(config: DailyConfig, roomUrl: string): string {
    const startTime = new Date(`${config.appointmentDate}T${config.appointmentTime}`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const title = `Medical Consultation - ${config.doctorName}`;
    const description = `Video consultation with ${config.doctorName}\nRoom URL: ${roomUrl}`;
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${startTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      details: description,
      location: roomUrl
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
}

export const dailyService = new DailyService();
export default dailyService;
