/**
 * Time utility functions for handling appointment times and timezone conversions
 */

/**
 * Format appointment time for display
 * @param timeString - Time string from database (e.g., "09:00:00")
 * @param dateInput - Date from database (can be string or Date object)
 * @returns Formatted time string for display
 */
export const formatAppointmentTime = (timeString: string, dateInput?: string | Date): string => {
  if (!timeString) return 'N/A';
  
  try {
    // If we have both date and time, create a proper UTC datetime
    if (dateInput) {
      let dateString: string;
      
      // Handle both Date objects and strings
      if (dateInput instanceof Date) {
        // Convert Date object to ISO string and extract date part
        dateString = dateInput.toISOString().split('T')[0];
      } else {
        // Handle string input - extract date part if it contains time
        dateString = dateInput.split('T')[0];
      }
      
      const utcDateTime = new Date(`${dateString}T${timeString}Z`);
      return utcDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
    
    // If we only have time, assume it's in UTC and convert to local
    const [hours, minutes] = timeString.split(':');
    const utcTime = new Date();
    utcTime.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return utcTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch (error) {
    console.error('Error formatting appointment time:', error);
    return timeString; // Fallback to original string
  }
};

/**
 * Format appointment date for display
 * @param dateInput - Date from database (can be string or Date object)
 * @returns Formatted date string for display
 */
export const formatAppointmentDate = (dateInput: string | Date): string => {
  if (!dateInput) return 'N/A';
  
  try {
    let date: Date;
    
    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch (error) {
    console.error('Error formatting appointment date:', error);
    return String(dateInput); // Fallback to original string
  }
};

/**
 * Format appointment date and time together
 * @param dateInput - Date from database (can be string or Date object)
 * @param timeString - Time string from database
 * @returns Formatted date and time string
 */
export const formatAppointmentDateTime = (dateInput: string | Date, timeString: string): string => {
  if (!dateInput || !timeString) return 'N/A';
  
  try {
    let dateString: string;
    
    // Handle both Date objects and strings
    if (dateInput instanceof Date) {
      dateString = dateInput.toISOString().split('T')[0];
    } else {
      dateString = dateInput.split('T')[0];
    }
    
    const utcDateTime = new Date(`${dateString}T${timeString}Z`);
    return utcDateTime.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch (error) {
    console.error('Error formatting appointment datetime:', error);
    return `${dateInput} ${timeString}`; // Fallback
  }
};

/**
 * Check if an appointment is in the past
 * @param dateInput - Date from database (can be string or Date object)
 * @param timeString - Time string from database
 * @returns True if appointment is in the past
 */
export const isAppointmentInPast = (dateInput: string | Date, timeString: string): boolean => {
  if (!dateInput || !timeString) return false;
  
  try {
    let dateString: string;
    
    // Handle both Date objects and strings
    if (dateInput instanceof Date) {
      dateString = dateInput.toISOString().split('T')[0];
    } else {
      dateString = dateInput.split('T')[0];
    }
    
    const utcDateTime = new Date(`${dateString}T${timeString}Z`);
    const now = new Date();
    return utcDateTime < now;
  } catch (error) {
    console.error('Error checking if appointment is in past:', error);
    return false;
  }
};

/**
 * Get time until appointment
 * @param dateInput - Date from database (can be string or Date object)
 * @param timeString - Time string from database
 * @returns Time difference in minutes (negative if in past)
 */
export const getTimeUntilAppointment = (dateInput: string | Date, timeString: string): number => {
  if (!dateInput || !timeString) return 0;
  
  try {
    let dateString: string;
    
    // Handle both Date objects and strings
    if (dateInput instanceof Date) {
      dateString = dateInput.toISOString().split('T')[0];
    } else {
      dateString = dateInput.split('T')[0];
    }
    
    const utcDateTime = new Date(`${dateString}T${timeString}Z`);
    const now = new Date();
    return Math.round((utcDateTime.getTime() - now.getTime()) / (1000 * 60));
  } catch (error) {
    console.error('Error calculating time until appointment:', error);
    return 0;
  }
};
