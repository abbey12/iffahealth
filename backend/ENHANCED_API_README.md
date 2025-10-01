# IFFAHEALTH Enhanced API Documentation

## 🚀 Overview

The IFFAHEALTH Enhanced API is a comprehensive, production-ready backend system for a telehealth platform. It provides complete functionality for patient management, doctor management, appointment scheduling, prescription management, lab test management, medical records, payout systems, and real-time notifications.

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Supabase
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

### Key Features
- ✅ **Enhanced Patient Management** - Complete patient profiles with medical history
- ✅ **Enhanced Doctor Management** - Professional doctor profiles with specialties
- ✅ **Appointment Scheduling** - Video call and in-person appointments
- ✅ **Prescription Management** - Digital prescription creation and management
- ✅ **Lab Test Management** - Lab test ordering, tracking, and results
- ✅ **Medical Records** - Digital medical records with file attachments
- ✅ **Payout System** - Doctor earnings tracking and payout management
- ✅ **Notification System** - Real-time notifications for all activities
- ✅ **Payment Integration** - Paystack payment processing
- ✅ **Video Calls** - Agora.io integration for telehealth
- ✅ **Search & Filtering** - Advanced search capabilities
- ✅ **Analytics** - Comprehensive reporting and statistics
- ✅ **File Management** - Secure file upload and management
- ✅ **Mobile Optimized** - Mobile-first responsive design

## 📊 Database Schema

### Core Tables
- `users` - Authentication and user management
- `patients` - Patient profiles and medical information
- `doctors` - Doctor profiles and professional information
- `hospitals` - Hospital and clinic information
- `appointments` - Appointment scheduling and management
- `medications` - Patient medication records
- `prescriptions` - Prescription management
- `prescription_items` - Individual prescription items
- `lab_tests` - Lab test ordering and results
- `health_records` - Medical records and documentation
- `doctor_earnings` - Doctor earnings tracking
- `payout_requests` - Payout request management
- `notifications` - Real-time notification system
- `video_call_sessions` - Video call session management
- `payment_transactions` - Payment processing records

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Database Configuration
   DB_HOST=your-db-host
   DB_PORT=5432
   DB_NAME=iffahealth
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   
   # JWT Configuration
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:8081,http://localhost:3000
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Database Setup**
   ```bash
   # Run the enhanced database setup
   node scripts/setup_enhanced_db.js
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh` - Refresh token
- `POST /forgot-password` - Forgot password
- `POST /reset-password` - Reset password

### Patients (`/api/patients`)
- `GET /:id` - Get patient profile
- `PUT /:id` - Update patient profile
- `POST /:id/complete-profile` - Complete patient profile
- `GET /:id/appointments` - Get patient appointments
- `GET /:id/appointments/upcoming` - Get upcoming appointments
- `GET /:id/medications` - Get patient medications
- `GET /:id/medications/current` - Get current medications
- `GET /:id/lab-tests` - Get patient lab tests
- `GET /:id/lab-tests/upcoming` - Get upcoming lab tests
- `GET /:id/health-records` - Get health records
- `GET /:id/health-records/recent` - Get recent health records
- `GET /:id/prescriptions` - Get patient prescriptions
- `GET /:id/notifications` - Get patient notifications

### Doctors (`/api/doctors`)
- `GET /:id` - Get doctor profile
- `PUT /:id` - Update doctor profile
- `POST /:id/complete-profile` - Complete doctor profile
- `GET /:id/appointments` - Get doctor appointments
- `GET /:id/patients` - Get doctor patients
- `GET /:id/earnings` - Get doctor earnings
- `GET /:id/prescriptions` - Get doctor prescriptions
- `GET /:id/lab-tests` - Get doctor lab tests
- `GET /:id/medical-records` - Get doctor medical records
- `GET /:id/availability` - Get doctor availability
- `GET /` - Search doctors

### Prescriptions (`/api/prescriptions`)
- `POST /` - Create prescription
- `GET /:id` - Get prescription by ID
- `PUT /:id` - Update prescription
- `GET /patient/:patientId` - Get patient prescriptions
- `GET /doctor/:doctorId` - Get doctor prescriptions
- `POST /:id/items` - Add prescription item
- `PUT /:id/items/:itemId` - Update prescription item
- `DELETE /:id/items/:itemId` - Delete prescription item
- `GET /:id/items` - Get prescription items
- `GET /medications/search` - Search medications
- `GET /stats/:doctorId` - Get prescription statistics

### Lab Tests (`/api/lab-tests`)
- `POST /` - Create lab test
- `GET /:id` - Get lab test by ID
- `PUT /:id` - Update lab test
- `GET /patient/:patientId` - Get patient lab tests
- `GET /patient/:patientId/upcoming` - Get upcoming lab tests
- `GET /doctor/:doctorId` - Get doctor lab tests
- `POST /:id/results` - Add lab test results
- `POST /:id/notes` - Add doctor notes
- `GET /types/list` - Get lab test types
- `GET /stats/:doctorId` - Get lab test statistics
- `GET /search` - Search lab tests

### Medical Records (`/api/medical-records`)
- `POST /` - Create medical record
- `GET /:id` - Get medical record by ID
- `PUT /:id` - Update medical record
- `DELETE /:id` - Delete medical record
- `GET /patient/:patientId` - Get patient medical records
- `GET /patient/:patientId/recent` - Get recent medical records
- `GET /doctor/:doctorId` - Get doctor medical records
- `GET /search` - Search medical records
- `GET /types/list` - Get medical record types
- `GET /stats/:doctorId` - Get medical record statistics
- `POST /:id/attachments` - Upload file attachment
- `DELETE /:id/attachments/:attachmentIndex` - Remove attachment

### Payouts (`/api/payouts`)
- `GET /earnings/:doctorId` - Get doctor earnings
- `POST /request` - Create payout request
- `GET /requests/:doctorId` - Get payout requests
- `GET /requests/:doctorId/:requestId` - Get payout request by ID
- `PUT /requests/:doctorId/:requestId/cancel` - Cancel payout request
- `GET /methods` - Get payout methods
- `GET /history/:doctorId` - Get payout history
- `GET /stats/:doctorId` - Get payout statistics
- `PUT /admin/requests/:requestId/status` - Update payout status (Admin)

### Notifications (`/api/notifications`)
- `GET /user/:userId` - Get user notifications
- `GET /user/:userId/unread-count` - Get unread count
- `PUT /:id/read` - Mark notification as read
- `PUT /user/:userId/read-all` - Mark all as read
- `PUT /:id/archive` - Archive notification
- `DELETE /:id` - Delete notification
- `POST /` - Create notification
- `GET /preferences/:userId` - Get notification preferences
- `PUT /preferences/:userId` - Update notification preferences
- `POST /appointment-reminder` - Send appointment reminder
- `POST /lab-result` - Send lab result notification
- `POST /prescription` - Send prescription notification
- `POST /payment` - Send payment notification
- `GET /types/list` - Get notification types

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## 📝 Request/Response Format

### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Paginated Response Format
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Different access levels for patients, doctors, and admins
- **Rate Limiting** - Prevents API abuse
- **CORS Protection** - Cross-origin resource sharing protection
- **Input Validation** - Comprehensive request validation
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Cross-site scripting protection
- **Helmet Security** - Security headers

## 📊 Monitoring & Logging

- **Request Logging** - Morgan HTTP request logger
- **Error Logging** - Comprehensive error tracking
- **Health Checks** - API health monitoring
- **Performance Metrics** - Response time tracking

## 🚀 Deployment

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up monitoring and logging
6. Configure backup strategies

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

### Test the API
```bash
# Health check
curl http://localhost:3000/health

# API documentation
curl http://localhost:3000/api/docs
```

### Sample Test Data
The setup script creates sample data for testing:
- 3 Hospitals
- 3 Doctors (Cardiology, Pediatrics, Dermatology)
- 3 Patients
- Sample appointments, medications, lab tests, etc.

**Test Credentials:**
- Doctors: `doctor1@iffahealth.com`, `doctor2@iffahealth.com`, `doctor3@iffahealth.com`
- Patients: `patient1@iffahealth.com`, `patient2@iffahealth.com`, `patient3@iffahealth.com`
- Password: `password123`

## 📱 Mobile App Integration

The API is designed to work seamlessly with the IFFAHEALTH mobile app. Use the enhanced API service:

```typescript
import { enhancedApiService } from './services/enhanced_apiService';

// Example usage
const patient = await enhancedApiService.getPatientProfile(patientId);
const appointments = await enhancedApiService.getUpcomingAppointments(patientId);
```

## 🔄 API Versioning

Current version: **2.0.0**

The API uses semantic versioning. Breaking changes will increment the major version number.

## 📞 Support

For support and questions:
- Email: support@iffahealth.com
- Documentation: `/api/docs`
- Health Check: `/health`

## 📄 License

This project is licensed under the MIT License.

---

**IFFAHEALTH Enhanced API** - Production-ready telehealth platform backend 🏥✨
