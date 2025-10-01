# IFFAHEALTH API Documentation

Comprehensive API documentation for the IFFAHEALTH telehealth platform backend.

## 📋 Table of Contents

- [Authentication](#authentication)
- [User Management](#user-management)
- [Appointments](#appointments)
- [AI Assistant](#ai-assistant)
- [Post-Discharge Care](#post-discharge-care)
- [Error Handling](#error-handling)
- [Response Format](#response-format)

## 🔐 Authentication

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+233241234567",
  "dateOfBirth": "1995-12-10",
  "gender": "male",
  "address": "123 Main Street, Accra",
  "city": "Accra",
  "country": "Ghana",
  "emergencyContact": "Jane Doe",
  "emergencyPhone": "+233241234568",
  "bloodType": "O+",
  "allergies": ["Penicillin", "Shellfish"],
  "medicalConditions": ["Diabetes", "Hypertension"],
  "medications": ["Metformin", "Lisinopril"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "isVerified": false
    },
    "token": "jwt-token"
  }
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient"
    },
    "token": "jwt-token"
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "phone": "+233241234567",
      "address": "123 Main Street, Accra",
      "city": "Accra",
      "country": "Ghana"
    }
  }
}
```

## 👥 User Management

### Get All Users (Admin/Doctor/Nurse)
```http
GET /api/users?role=patient&page=1&limit=10
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `role`: Filter by user role (patient, doctor, nurse, admin)
- `specialty`: Filter by specialty (for doctors)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "patient",
        "phone": "+233241234567",
        "city": "Accra"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <jwt-token>
```

### Update User
```http
PUT /api/users/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+233241234569",
  "address": "456 New Street, Accra",
  "city": "Accra"
}
```

## 📅 Appointments

### Get User's Appointments
```http
GET /api/appointments?status=upcoming&type=video&page=1&limit=10
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `status`: Filter by status (scheduled, confirmed, in-progress, completed, cancelled, no-show)
- `type`: Filter by type (video, in-person)
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "appointmentDate": "2024-09-25",
        "appointmentTime": "10:00 AM",
        "type": "video",
        "status": "scheduled",
        "specialty": "General Medicine",
        "reason": "Regular checkup",
        "meetingLink": "https://meet.google.com/room123",
        "patient": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "phone": "+233241234567"
        },
        "doctor": {
          "id": "uuid",
          "firstName": "Dr. Sarah",
          "lastName": "Mensah",
          "specialty": "General Medicine"
        }
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

### Create Appointment
```http
POST /api/appointments
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "doctorId": "doctor-uuid",
  "appointmentDate": "2024-09-25",
  "appointmentTime": "10:00 AM",
  "type": "video",
  "specialty": "General Medicine",
  "reason": "Regular checkup",
  "symptoms": "Mild headache and fatigue",
  "duration": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "appointment": {
      "id": "uuid",
      "patientId": "patient-uuid",
      "doctorId": "doctor-uuid",
      "appointmentDate": "2024-09-25",
      "appointmentTime": "10:00 AM",
      "type": "video",
      "status": "scheduled",
      "specialty": "General Medicine",
      "reason": "Regular checkup",
      "meetingLink": "https://meet.google.com/room123",
      "roomId": "room123"
    }
  }
}
```

### Update Appointment
```http
PUT /api/appointments/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "completed",
  "notes": "Patient showed improvement",
  "diagnosis": "Common cold",
  "prescription": "Rest and fluids",
  "followUpRequired": true,
  "followUpDate": "2024-10-02"
}
```

### Cancel Appointment
```http
PATCH /api/appointments/:id/cancel
Authorization: Bearer <jwt-token>
```

## 🤖 AI Assistant

### AI Chat
```http
POST /api/ai/chat
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "message": "I have a headache and feel dizzy",
  "context": {
    "age": 30,
    "gender": "male",
    "previousConditions": ["migraine"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Headaches can have various causes. Common triggers include stress, dehydration, lack of sleep, or tension. Try drinking water, resting in a dark room, or gentle neck stretches. If the headache is severe, persistent, or accompanied by other symptoms like fever or vision changes, please consult a healthcare provider immediately.",
    "timestamp": "2024-09-20T10:30:00Z"
  }
}
```

### Symptom Checker
```http
POST /api/ai/symptom-checker
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "symptoms": ["headache", "fever", "fatigue"],
  "age": 30,
  "gender": "male"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "possibleConditions": [
        {
          "condition": "Common Cold",
          "probability": 0.7,
          "description": "Viral infection affecting the upper respiratory tract"
        }
      ],
      "severity": "mild",
      "confidence": 0.8
    },
    "recommendations": [
      "Get plenty of rest",
      "Stay hydrated by drinking water",
      "Monitor your symptoms",
      "Consider over-the-counter medications for symptom relief",
      "Consult a healthcare provider if symptoms worsen"
    ],
    "urgency": "low",
    "timestamp": "2024-09-20T10:30:00Z"
  }
}
```

### Health Tips
```http
GET /api/ai/health-tips?category=nutrition&limit=5
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `category`: Filter by category (general, nutrition, fitness, mental-health)
- `limit`: Number of tips to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "tips": [
      {
        "id": 1,
        "title": "Eat a Balanced Diet",
        "description": "Include fruits, vegetables, whole grains, and lean proteins",
        "category": "nutrition"
      }
    ],
    "category": "nutrition"
  }
}
```

### Medication Information
```http
GET /api/ai/medication/paracetamol
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "medication": {
      "name": "Paracetamol",
      "genericName": "Acetaminophen",
      "dosage": "500-1000mg every 4-6 hours",
      "sideEffects": ["Nausea", "Rash", "Liver damage (with overdose)"],
      "interactions": ["Warfarin", "Alcohol"],
      "warnings": ["Do not exceed 4000mg per day", "Consult doctor if pregnant"]
    }
  }
}
```

## 🏥 Post-Discharge Care

### Get Care Plan
```http
GET /api/post-discharge
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "carePlan": {
      "id": "uuid",
      "patientId": "patient-uuid",
      "dischargeDate": "2024-09-20",
      "diagnosis": "Appendectomy",
      "treatment": "Laparoscopic surgery",
      "medications": ["Paracetamol", "Ibuprofen"],
      "careInstructions": "Keep wound clean and dry, avoid heavy lifting",
      "followUpDate": "2024-09-27",
      "status": "active",
      "priority": "high",
      "assignedNurse": {
        "id": "nurse-uuid",
        "firstName": "Grace",
        "lastName": "Asante",
        "phone": "+233241234571",
        "specialty": "Post-Surgical Care"
      },
      "doctor": {
        "id": "doctor-uuid",
        "firstName": "Dr. Sarah",
        "lastName": "Mensah",
        "specialty": "General Surgery"
      }
    },
    "tasks": [
      {
        "id": "task-uuid",
        "title": "Take Paracetamol",
        "description": "Take prescribed medication: Paracetamol",
        "dueDate": "2024-09-21",
        "status": "pending",
        "priority": "high",
        "category": "medication"
      }
    ]
  }
}
```

### Get Care Tasks
```http
GET /api/post-discharge/tasks?status=pending&priority=high
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `status`: Filter by status (pending, completed, overdue)
- `priority`: Filter by priority (high, medium, low)
- `category`: Filter by category (medication, exercise, diet, appointment, other)

### Complete Task
```http
PATCH /api/post-discharge/tasks/:id/complete
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Task marked as completed",
  "data": {
    "task": {
      "id": "task-uuid",
      "title": "Take Paracetamol",
      "status": "completed",
      "completedAt": "2024-09-21T08:30:00Z"
    }
  }
}
```

### Add Task Notes
```http
PATCH /api/post-discharge/tasks/:id/notes
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "notes": "Took medication as prescribed, no side effects"
}
```

## ❌ Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

### Common Error Messages
- `"Access token required"` - Missing or invalid JWT token
- `"User not found"` - User doesn't exist
- `"Validation failed"` - Request validation errors
- `"Insufficient permissions"` - User lacks required role
- `"Resource already exists"` - Duplicate resource creation

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Error message"
    }
  ]
}
```

## 🔒 Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt-token>
```

Tokens expire after 7 days and must be refreshed by logging in again.

## 📝 Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- General API endpoints: 100 requests per minute
- AI endpoints: 20 requests per minute

## 🧪 Testing

Use the provided Postman collection or curl commands to test the API:

```bash
# Test health endpoint
curl -X GET http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

**For more information, visit our documentation at https://api-docs.iffahealth.com** 📚
