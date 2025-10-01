# IFFA Health API Documentation

## Overview
This document provides comprehensive documentation for the IFFA Health mobile application API endpoints. The API follows RESTful conventions and uses JSON for data exchange.

## Base URL
- **Development**: `http://10.45.177.148:3000/api`
- **Production**: `https://api.iffahealth.com/api`

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this standard format:
```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string
}
```

## Error Handling
- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Invalid or missing token
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **500**: Internal Server Error - Server error

---

## Authentication Endpoints

### POST /auth/login
**Description**: Authenticate user and return JWT token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "patient"
    }
  }
}
```

### POST /auth/register
**Description**: Register new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "role": "patient"
}
```

### POST /auth/logout
**Description**: Logout user and invalidate token

### POST /auth/refresh
**Description**: Refresh JWT token

---

## Patient Management

### GET /patients/:id
**Description**: Get patient profile

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "patient-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "address": {
      "street": "123 Main St",
      "city": "Accra",
      "region": "Greater Accra",
      "country": "Ghana",
      "postalCode": "00233"
    },
    "emergencyContact": {
      "name": "Jane Doe",
      "phone": "+1234567891",
      "relationship": "Spouse"
    },
    "medicalHistory": ["Hypertension"],
    "allergies": ["Penicillin"],
    "currentMedications": ["Metformin"]
  }
}
```

### PUT /patients/:id
**Description**: Update patient profile

### POST /patients/:id/complete-profile
**Description**: Complete patient profile with additional information

**Request Body**:
```json
{
  "address": {
    "street": "123 Main St",
    "city": "Accra",
    "region": "Greater Accra",
    "country": "Ghana",
    "postalCode": "00233"
  },
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+1234567891",
    "relationship": "Spouse"
  },
  "medicalHistory": ["Hypertension", "Diabetes"],
  "allergies": ["Penicillin"],
  "currentMedications": ["Metformin", "Lisinopril"]
}
```

---

## Appointments

### GET /appointments
**Description**: Get appointments with filtering

**Query Parameters**:
- `patient_id`: Filter by patient ID
- `status`: Filter by status (scheduled, confirmed, completed, cancelled)

### GET /patients/:id/appointments
**Description**: Get patient's appointments with pagination

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### POST /appointments
**Description**: Create new appointment

**Request Body**:
```json
{
  "patientId": "patient-id",
  "doctorId": "doctor-id",
  "date": "2024-01-20",
  "time": "10:00",
  "type": "video",
  "notes": "Follow-up consultation"
}
```

### DELETE /appointments/:id
**Description**: Cancel appointment

---

## Doctors

### GET /doctors
**Description**: Get list of doctors with filtering

**Query Parameters**:
- `specialty`: Filter by medical specialty
- `search`: Search by name or specialty

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-001",
      "firstName": "Dr. Sarah",
      "lastName": "Mensah",
      "specialty": "General Medicine",
      "rating": 4.8,
      "experience": 8,
      "consultationFee": 150,
      "availableSlots": ["09:00", "10:00", "14:00"],
      "profileImage": "https://example.com/doctor.jpg",
      "bio": "Experienced general practitioner",
      "languages": ["English", "Twi"],
      "education": "MBChB, University of Ghana",
      "certifications": ["Ghana Medical Association"]
    }
  ]
}
```

### GET /doctors/:id
**Description**: Get detailed doctor profile

### GET /doctors/:id/availability
**Description**: Get doctor's available time slots for a specific date

**Query Parameters**:
- `date`: Date in YYYY-MM-DD format

### GET /doctors/:id/reviews
**Description**: Get doctor's reviews and ratings

---

## Video Calls

### POST /video-calls/session
**Description**: Create video call session for appointment

**Request Body**:
```json
{
  "appointmentId": "apt-001"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "session-123",
    "channelName": "appointment_apt-001",
    "token": "agora-token-here",
    "agoraAppId": "ae1121fddf60428c90b4533d20b00557"
  }
}
```

### POST /video-calls/:id/join
**Description**: Join existing video call session

### POST /video-calls/:id/end
**Description**: End video call session

### GET /video-calls/patient/:id/history
**Description**: Get patient's video call history

---

## Medications

### GET /medications/patient/:id
**Description**: Get patient's medications

**Query Parameters**:
- `status`: Filter by status (active, paused, completed)

### POST /medications
**Description**: Add new medication

**Request Body**:
```json
{
  "patientId": "patient-id",
  "name": "Metformin",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "startDate": "2024-01-01",
  "endDate": "2024-06-01",
  "prescribedBy": "Dr. Sarah Mensah",
  "instructions": "Take with food",
  "status": "active"
}
```

### PATCH /medications/:id/status
**Description**: Update medication status

---

## Lab Tests

### GET /lab-tests/patient/:id
**Description**: Get patient's lab tests

**Query Parameters**:
- `status`: Filter by status (scheduled, pending, completed, cancelled)

### POST /lab-tests
**Description**: Book new lab test

---

## Health Records

### GET /health-records/patient/:id
**Description**: Get patient's health records

### POST /health-records
**Description**: Upload new health record

---

## File Management

### POST /files/upload
**Description**: Upload file (health records, prescriptions, etc.)

**Request**: Multipart form data
- `file`: File to upload
- `type`: File type (health-record, prescription, lab-result)

**Response**:
```json
{
  "success": true,
  "data": {
    "fileUrl": "https://example.com/uploaded-file.pdf",
    "fileId": "file-123"
  }
}
```

### DELETE /files/:id
**Description**: Delete uploaded file

---

## Notifications

### GET /notifications/patient/:id
**Description**: Get patient's notifications

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-001",
      "title": "Appointment Reminder",
      "message": "Your appointment is in 1 hour",
      "type": "appointment",
      "isRead": false,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### PATCH /notifications/:id/read
**Description**: Mark notification as read

### PUT /notifications/patient/:id/preferences
**Description**: Update notification preferences

---

## Search

### GET /search/doctors
**Description**: Search doctors by name or specialty

**Query Parameters**:
- `query`: Search term
- `specialty`: Filter by specialty

### GET /search/medications
**Description**: Search medications

**Query Parameters**:
- `query`: Search term

---

## Payments

### POST /payments/create-intent
**Description**: Create payment intent for appointment

**Request Body**:
```json
{
  "appointmentId": "apt-001",
  "amount": 150
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_client_secret_here"
  }
}
```

### POST /payments/confirm
**Description**: Confirm payment

### GET /payments/patient/:id/history
**Description**: Get payment history

---

## Emergency Services

### POST /emergency/alert
**Description**: Send emergency alert

**Request Body**:
```json
{
  "patientId": "patient-id",
  "location": "123 Main St, Accra",
  "message": "Emergency situation",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### GET /emergency/patient/:id/contacts
**Description**: Get emergency contacts

---

## Analytics

### GET /analytics/patient/:id/health
**Description**: Get health analytics for patient

**Query Parameters**:
- `period`: Time period (week, month, year)

**Response**:
```json
{
  "success": true,
  "data": {
    "period": "month",
    "metrics": {
      "appointmentsCompleted": 5,
      "medicationsActive": 2,
      "labTestsCompleted": 3,
      "healthScore": 85
    }
  }
}
```

---

## Utility Endpoints

### GET /health
**Description**: Health check endpoint

**Response**:
```json
{
  "success": true,
  "message": "IFFAHEALTH Mock API is running",
  "timestamp": "2024-01-15T10:00:00Z",
  "database": "mock"
}
```

### GET /app/version
**Description**: Get app version information

**Response**:
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "updateRequired": false
  }
}
```

---

## Rate Limiting
- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **File upload endpoints**: 20 requests per minute

## CORS
The API supports CORS for the following origins:
- `http://localhost:3000`
- `http://localhost:8081`
- `http://10.45.177.148:3000`
- `http://10.45.177.148:8081`

## WebSocket Support
Real-time features (notifications, video calls) will be supported via WebSocket connections in future versions.

---

## Changelog

### Version 2.0.0 (Current)
- Added comprehensive video call management
- Added file upload capabilities
- Added notification system
- Added search functionality
- Added payment integration
- Added analytics endpoints
- Enhanced doctor management
- Improved error handling

### Version 1.0.0
- Initial API release
- Basic CRUD operations
- Authentication system
- Appointment management
- Patient profile management
