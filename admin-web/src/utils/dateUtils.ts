/**
 * Utility functions for date formatting in the admin web app
 */

/**
 * Formats an appointment date and time into a readable string
 * @param date - The appointment date (can be ISO string or date-only string)
 * @param time - The appointment time (HH:MM:SS format)
 * @returns Formatted date and time string or 'Invalid Date' if inputs are invalid
 */
export const formatAppointmentDateTime = (date: string | null | undefined, time: string | null | undefined): string => {
  if (!date || !time) return 'Invalid Date';
  
  try {
    // Extract just the date part if it's an ISO string
    const dateOnly = date.split('T')[0];
    const appointmentDate = new Date(`${dateOnly}T${time}`);
    
    // Check if the date is valid
    if (isNaN(appointmentDate.getTime())) {
      return 'Invalid Date';
    }
    
    return appointmentDate.toLocaleString();
  } catch (error) {
    console.error('Error formatting appointment date:', error);
    return 'Invalid Date';
  }
};

/**
 * Formats a date string into a readable date
 * @param dateString - The date string to format
 * @returns Formatted date string or 'Invalid Date' if input is invalid
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Invalid Date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Formats a date string into a readable date and time
 * @param dateString - The date string to format
 * @returns Formatted date and time string or 'Invalid Date' if input is invalid
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Invalid Date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleString();
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'Invalid Date';
  }
};
