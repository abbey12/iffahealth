# Google Meet Integration

This document describes the Google Meet integration for video consultations in the Iffa Health mobile application.

## Overview

The Google Meet integration replaces the problematic Agora SDK with a more reliable web-based video calling solution. This approach provides better compatibility, easier maintenance, and professional-quality video calls.

## Features

- **Automatic Meeting Link Generation**: Unique Google Meet links are generated for each appointment
- **Cross-Platform Compatibility**: Works on all devices (iOS, Android, Web)
- **Recording Support**: Built-in recording capabilities through Google Meet
- **Calendar Integration**: Automatic calendar event creation with meeting links
- **Share Functionality**: Easy sharing of meeting links via various methods

## Architecture

### Components

1. **GoogleMeetService** (`/src/services/googleMeetService.ts`)
   - Generates unique meeting links
   - Validates Google Meet URLs
   - Creates calendar events
   - Provides meeting instructions

2. **GoogleMeetVideoCallScreen** (`/src/screens/GoogleMeetVideoCallScreen.tsx`)
   - User interface for joining meetings
   - Meeting instructions and details
   - Action buttons (Join, Copy Link, Share, Add to Calendar)

3. **Integration Points**
   - `BookAppointmentScreen`: Generates meeting links during appointment creation
   - `PaymentScreen`: Navigates to Google Meet after successful payment
   - `DoctorDashboardScreen`: Starts consultations via Google Meet
   - `DoctorAppointmentsScreen`: Joins meetings from appointment list

### Data Flow

```
Appointment Creation → Google Meet Link Generation → Database Storage → Payment → Video Call
```

## Implementation Details

### Meeting Link Generation

```typescript
const meetConfig: GoogleMeetConfig = {
  appointmentId: 'appointment-123',
  doctorId: 'doctor-456',
  patientId: 'patient-789',
  doctorName: 'Dr. John Doe',
  patientName: 'Jane Smith',
  appointmentDate: '2025-09-27',
  appointmentTime: '10:00',
};

const meetLink = googleMeetService.generateMeetLink(meetConfig);
// Result: {
//   meetingUrl: 'https://meet.google.com/iffa-appointment-123-abc123',
//   meetingId: 'iffa-appointment-123-abc123',
//   joinUrl: 'https://meet.google.com/iffa-appointment-123-abc123?appointment-id=...',
//   recordingEnabled: true
// }
```

### Database Storage

Meeting links are stored in the `appointments` table:

```sql
ALTER TABLE appointments ADD COLUMN meeting_link VARCHAR(500);
```

### Navigation Flow

1. **Patient Flow**:
   ```
   Book Appointment → Generate Meet Link → Payment → Google Meet Screen
   ```

2. **Doctor Flow**:
   ```
   Dashboard/Appointments → Start Consultation → Google Meet Screen
   ```

## User Experience

### For Patients

1. Book an appointment with a doctor
2. Complete payment process
3. Automatically redirected to Google Meet screen
4. Click "Join Meeting" to start video consultation
5. Meeting opens in default browser/app

### For Doctors

1. View upcoming appointments
2. Click "Start Consultation" on any appointment
3. Navigate to Google Meet screen
4. Click "Join Meeting" to start video consultation

## Features

### Meeting Instructions

The app provides clear instructions for both doctors and patients:

- Meeting ID and URL
- Step-by-step joining process
- Recording information
- Technical requirements

### Action Buttons

- **Join Meeting**: Opens Google Meet in browser/app
- **Copy Link**: Copies meeting URL to clipboard
- **Share**: Shares meeting link via system share sheet
- **Add to Calendar**: Creates Google Calendar event

### Error Handling

- Fallback to manual link sharing if automatic opening fails
- Clear error messages for troubleshooting
- Retry mechanisms for failed operations

## Benefits

### Compared to Agora SDK

✅ **No SDK Installation**: Just web links
✅ **Better Compatibility**: Works on all devices
✅ **Easier Maintenance**: No native dependencies
✅ **Professional Quality**: Google's infrastructure
✅ **Recording Support**: Built-in recording capabilities
✅ **Calendar Integration**: Seamless scheduling

### Technical Advantages

- No complex native module setup
- No platform-specific compilation issues
- Automatic updates through Google's service
- Better error handling and user feedback
- Reduced app size and complexity

## Testing

### Unit Tests

Run the test suite to verify Google Meet service functionality:

```bash
npm test googleMeetService.test.ts
```

### Integration Testing

1. Create a test appointment
2. Verify meeting link generation
3. Test meeting link opening
4. Verify calendar event creation
5. Test sharing functionality

## Future Enhancements

### Potential Improvements

1. **Google Meet API Integration**: Use official Google Meet API for advanced features
2. **Meeting Analytics**: Track meeting duration, attendance, etc.
3. **Custom Meeting Rooms**: Create branded meeting rooms
4. **Advanced Recording**: Cloud storage integration for recordings
5. **Meeting Templates**: Pre-configured meeting settings

### Recording Integration

```typescript
// Future implementation for recording management
const handleRecordingComplete = async (appointmentId: string, recordingUrl: string) => {
  await apiService.updateAppointment(appointmentId, {
    recording_url: recordingUrl,
    recording_status: 'completed',
    recording_created_at: new Date()
  });
};
```

## Troubleshooting

### Common Issues

1. **Cannot Open Meeting Link**
   - Check if Google Meet app is installed
   - Verify internet connection
   - Use copy link fallback

2. **Meeting Link Not Generated**
   - Check appointment creation process
   - Verify Google Meet service configuration
   - Check for network connectivity

3. **Calendar Event Not Created**
   - Verify calendar permissions
   - Check Google account authentication
   - Use manual calendar creation

### Debug Information

Enable debug logging to troubleshoot issues:

```typescript
console.log('🔗 Generated Google Meet link:', meetLink);
console.log('📅 Calendar URL:', calendarUrl);
console.log('📱 Meeting instructions:', instructions);
```

## Security Considerations

- Meeting links are unique and time-based
- No sensitive data in meeting URLs
- Automatic meeting expiration
- Secure link sharing mechanisms

## Performance

- Lightweight service implementation
- Minimal memory footprint
- Fast meeting link generation
- Efficient URL validation

---

This integration provides a robust, reliable, and user-friendly video consultation experience for the Iffa Health platform.
