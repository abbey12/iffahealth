# IFFAHEALTH Backend API

A comprehensive healthcare API built with Node.js, Express, and PostgreSQL for the IFFAHEALTH telehealth platform.

## 🚀 Quick Start

### 1. Set Up PostgreSQL Database

#### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your database credentials
4. Update `.env` file with your credentials

#### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database named `iffahealth`
3. Update `.env` file with local credentials

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment
```bash
cp env.example .env
# Edit .env with your database credentials
```

### 4. Set Up Database Schema
```bash
node setup.js
```

### 5. Start the Server
```bash
# Development
npm run dev

# Production
npm start
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Patients
- `GET /api/patients` - Get all patients (admin)
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/:id/appointments/upcoming` - Get upcoming appointments

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create new appointment

### Medications
- `GET /api/medications/patient/:patientId` - Get patient medications
- `POST /api/medications` - Add new medication

### Lab Tests
- `GET /api/lab-tests/patient/:patientId` - Get patient lab tests
- `POST /api/lab-tests` - Schedule new lab test

### Health Records
- `GET /api/health-records/patient/:patientId` - Get patient health records
- `POST /api/health-records` - Create new health record

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID

## 🔧 Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:8081
```

## 🏗️ Database Schema

The database includes the following main tables:
- `patients` - Patient information
- `doctors` - Doctor information
- `hospitals` - Hospital information
- `appointments` - Appointment scheduling
- `medications` - Patient medications
- `lab_tests` - Lab test scheduling
- `health_records` - Medical records
- `emergency_alerts` - Emergency notifications

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Joi
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection prevention

## 📱 Mobile App Integration

The API is designed to work seamlessly with the IFFAHEALTH React Native mobile app. Update the API base URL in your mobile app configuration:

```typescript
const API_BASE_URL = 'http://localhost:3000/api'; // Development
// const API_BASE_URL = 'https://api.iffahealth.com/api'; // Production
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test API endpoints
curl http://localhost:3000/health
```

## 📈 Monitoring

- Health check endpoint: `GET /health`
- Database connection monitoring
- Request logging
- Error tracking

## 🚀 Deployment

### Railway
1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically

### AWS
1. Use AWS RDS for PostgreSQL
2. Deploy to EC2 or ECS
3. Configure load balancer

### Heroku
1. Add PostgreSQL addon
2. Set environment variables
3. Deploy with Git

## 📞 Support

For support and questions, contact the IFFAHEALTH development team.

## 📄 License

MIT License - see LICENSE file for details.
