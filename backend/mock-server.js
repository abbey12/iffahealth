const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const payoutsRouter = require('./routes/payouts');

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:8081',
    'http://10.45.177.148:3000',
    'http://10.45.177.148:8081'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/payouts', payoutsRouter);

// Mock data
const mockPatient = {
  id: 'e9bdf18e-d655-44d9-b54f-054e525005ce',
  firstName: 'John',
  lastName: 'Doe',
  email: 'testlogin@example.com',
  phone: '+1234567890',
  dateOfBirth: '1990-01-01',
  gender: 'male',
  address: '123 Main St, Accra, Ghana',
  emergencyContact: '+1234567891',
  medicalHistory: ['Hypertension', 'Diabetes'],
  allergies: ['Penicillin'],
  currentMedications: ['Metformin', 'Lisinopril']
};

const mockAppointments = [
  {
    id: 'apt_001',
    appointment_date: '2024-09-25',
    appointment_time: '10:00',
    type: 'video',
    status: 'confirmed',
    doctor_first_name: 'Dr. Sarah',
    doctor_last_name: 'Mensah',
    doctor_specialty: 'General Medicine',
    notes: 'Follow-up consultation',
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    meeting_id: 'appointment_apt_001',
    meeting_password: 'iffa_pt001',
    can_join_call: true
  },
  {
    id: 'apt_002',
    appointment_date: '2024-09-28',
    appointment_time: '14:30',
    type: 'video',
    status: 'confirmed',
    doctor_first_name: 'Dr. Kwame',
    doctor_last_name: 'Asante',
    doctor_specialty: 'Cardiology',
    notes: 'Heart health consultation',
    meeting_link: 'https://meet.google.com/xyz-1234-abc',
    meeting_id: 'appointment_apt_002',
    meeting_password: 'iffa_pt002',
    can_join_call: true
  },
  {
    id: 'apt_003',
    appointment_date: '2024-09-30',
    appointment_time: '09:00',
    type: 'video',
    status: 'scheduled',
    doctor_first_name: 'Dr. Ama',
    doctor_last_name: 'Osei',
    doctor_specialty: 'Pediatrics',
    notes: 'Child health checkup',
    meeting_link: 'https://meet.google.com/def-5678-ghi',
    meeting_id: 'appointment_apt_003',
    meeting_password: 'iffa_pt003',
    can_join_call: false
  },
  {
    id: 'apt_004',
    appointment_date: '2024-10-02',
    appointment_time: '15:00',
    type: 'video',
    status: 'confirmed',
    doctor_first_name: 'Dr. Kofi',
    doctor_last_name: 'Asante',
    doctor_specialty: 'Dermatology',
    notes: 'Skin condition consultation',
    meeting_link: 'https://meet.google.com/jkl-9012-mno',
    meeting_id: 'appointment_apt_004',
    meeting_password: 'iffa_pt004',
    can_join_call: true
  },
  {
    id: 'apt_005',
    appointment_date: '2024-10-05',
    appointment_time: '11:30',
    type: 'video',
    status: 'confirmed',
    doctor_first_name: 'Dr. Grace',
    doctor_last_name: 'Adjei',
    doctor_specialty: 'Gynecology',
    notes: 'Women\'s health consultation',
    meeting_link: 'https://meet.google.com/pqr-3456-stu',
    meeting_id: 'appointment_apt_005',
    meeting_password: 'iffa_pt005',
    can_join_call: true
  }
];

const mockMedications = [
  {
    id: 1,
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    start_date: '2023-12-01',
    end_date: '2024-06-01',
    instructions: 'Take with food',
    status: 'active',
    doctor_first_name: 'Dr. Sarah',
    doctor_last_name: 'Johnson'
  },
  {
    id: 2,
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    start_date: '2023-11-15',
    end_date: '2024-05-15',
    instructions: 'Take in the morning',
    status: 'active',
    doctor_first_name: 'Dr. Michael',
    doctor_last_name: 'Brown'
  }
];

const mockLabTests = [
  {
    id: 1,
    test_name: 'Blood Sugar Test',
    test_type: 'Fasting Blood Glucose',
    test_date: '2024-01-18',
    test_time: '08:00',
    location: 'Lab Center Accra',
    status: 'scheduled',
    results: null,
    doctor_first_name: 'Dr. Sarah',
    doctor_last_name: 'Johnson'
  },
  {
    id: 2,
    test_name: 'Cholesterol Panel',
    test_type: 'Lipid Profile',
    test_date: '2024-01-25',
    test_time: '09:30',
    location: 'Lab Center Accra',
    status: 'scheduled',
    results: null,
    doctor_first_name: 'Dr. Michael',
    doctor_last_name: 'Brown'
  }
];

const mockHealthRecords = [
  {
    id: 1,
    type: 'lab_result',
    title: 'Blood Test Results - January 2024',
    document_url: 'https://example.com/lab-results-2024-01.pdf',
    upload_date: '2024-01-10',
    notes: 'Complete blood count and metabolic panel',
    uploaded_by_email: 'dr.sarah.johnson@iffahealth.com'
  },
  {
    id: 2,
    type: 'prescription',
    title: 'Prescription - Metformin',
    document_url: 'https://example.com/prescription-metformin.pdf',
    upload_date: '2023-12-01',
    notes: 'Prescription for diabetes management',
    uploaded_by_email: 'dr.sarah.johnson@iffahealth.com'
  }
];

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'IFFAHEALTH Mock API is running',
    timestamp: new Date().toISOString(),
    database: 'mock',
    version: '2.0.0',
    endpoints: [
      // Authentication
      'POST /api/auth/login - User login',
      'POST /api/auth/register - User registration',
      'POST /api/auth/logout - User logout',
      'POST /api/auth/refresh - Refresh token',
      
      // Patient Management
      'GET /api/patients/:id - Get patient profile',
      'PUT /api/patients/:id - Update patient profile',
      'POST /api/patients/:id/complete-profile - Complete patient profile',
      
      // Appointments
      'GET /api/appointments - Get appointments',
      'GET /api/patients/:id/appointments - Get patient appointments',
      'POST /api/appointments - Create appointment',
      'DELETE /api/appointments/:id - Cancel appointment',
      
      // Doctors
      'GET /api/doctors - Get doctors list',
      'GET /api/doctors/:id - Get doctor profile',
      'GET /api/doctors/:id/availability - Get doctor availability',
      'GET /api/doctors/:id/reviews - Get doctor reviews',
      
      // Video Calls
      'POST /api/video-calls/session - Create video call session',
      'POST /api/video-calls/:id/join - Join video call',
      'POST /api/video-calls/:id/end - End video call',
      'GET /api/video-calls/patient/:id/history - Get video castory',
      
      // Medications
      'GET /api/medications/patient/:id - Get patient medications',
      'POST /api/medications - Add medication',
      'PATCH /api/medications/:id/status - Update medication status',
      
      // Lab Tests
      'GET /api/lab-tests/patient/:id - Get patient lab tests',
      'POST /api/lab-tests - Book lab test',
      
      // Health Records
      'GET /api/health-records/patient/:id - Get patient health records',
      'POST /api/health-records - Upload health record',
      
      // File Management
      'POST /api/files/upload - Upload file',
      'DELETE /api/files/:id - Delete file',
      
      // Notifications
      'GET /api/notifications/patient/:id - Get notifications',
      'PATCH /api/notifications/:id/read - Mark notification as read',
      'PUT /api/notifications/patient/:id/preferences - Update notification preferences',
      
      // Search
      'GET /api/search/doctors - Search doctors',
      'GET /api/search/medications - Search medications',
      
      // Payments
      'POST /api/payments/create-intent - Create payment intent',
      'POST /api/payments/confirm - Confirm payment',
      'GET /api/payments/patient/:id/history - Get payment history',
      
      // Emergency
      'POST /api/emergency/alert - Send emergency alert',
      'GET /api/emergency/patient/:id/contacts - Get emergency contacts',
      
      // Analytics
      'GET /api/analytics/patient/:id/health - Get health analytics',
      
      // Utility
      'GET /api/health - Health check',
      'GET /api/app/version - Get app version'
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'IFFAHEALTH Mock API is running',
    timestamp: new Date().toISOString(),
    database: 'mock'
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  
  // Patient login
  if (email === 'testlogin@example.com' && password === 'password123' && (!role || role === 'patient')) {
    const token = 'mock-jwt-token-' + Date.now();
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: mockPatient
      }
    });
  } 
  // Doctor login
  else if (email === 'doctor@iffahealth.com' && password === 'doctor123' && role === 'doctor') {
    const token = 'mock-doctor-jwt-token-' + Date.now();
    const mockDoctor = {
      id: 'doc_12345678-1234-1234-1234-123456789012',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'doctor@iffahealth.com',
      phone: '+233987654321',
      specialty: 'Cardiology',
      licenseNumber: 'LIC-2024-001',
      experience: '8 years',
      rating: 4.8,
      totalPatients: 156,
      profileComplete: true
    };
    
    res.json({
      success: true,
      message: 'Doctor login successful',
      data: {
        token,
        user: mockDoctor
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName, phone, dateOfBirth, gender } = req.body;
  
  const token = 'mock-jwt-token-' + Date.now();
  const newPatient = {
    id: 'mock-patient-' + Date.now(),
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    gender,
    address: '',
    emergencyContact: '',
    medicalHistory: [],
    allergies: [],
    currentMedications: []
  };
  
  res.json({
    success: true,
    message: 'Registration successful',
    data: {
      token,
      user: newPatient
    }
  });
});

// Patient endpoints
app.get('/api/patients/:id', (req, res) => {
  res.json({
    success: true,
    data: mockPatient
  });
});

// Patient-specific appointments
app.get('/api/patients/:id/appointments', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  res.json({
    success: true,
    data: mockAppointments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: mockAppointments.length,
      totalPages: Math.ceil(mockAppointments.length / limit)
    }
  });
});

// Patient-specific medications
app.get('/api/patients/:id/medications', (req, res) => {
  res.json({
    success: true,
    data: mockMedications
  });
});

// Patient-specific lab tests
app.get('/api/patients/:id/lab-tests', (req, res) => {
  res.json({
    success: true,
    data: mockLabTests
  });
});

// Patient-specific health records
app.get('/api/patients/:id/health-records', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  res.json({
    success: true,
    data: mockHealthRecords,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: mockHealthRecords.length,
      totalPages: Math.ceil(mockHealthRecords.length / limit)
    }
  });
});

// Appointments endpoints
app.get('/api/appointments', (req, res) => {
  const { patient_id, status } = req.query;
  
  let filteredAppointments = mockAppointments;
  
  if (patient_id) {
    // Filter by patient (in real app, this would be done in database)
    filteredAppointments = mockAppointments;
  }
  
  if (status) {
    filteredAppointments = filteredAppointments.filter(apt => apt.status === status);
  }
  
  res.json({
    success: true,
    data: filteredAppointments
  });
});

// Medications endpoints
app.get('/api/medications/patient/:id', (req, res) => {
  const { status } = req.query;
  
  let filteredMedications = mockMedications;
  
  if (status) {
    filteredMedications = filteredMedications.filter(med => med.status === status);
  }
  
  res.json({
    success: true,
    data: filteredMedications
  });
});

// Lab tests endpoints
app.get('/api/lab-tests/patient/:id', (req, res) => {
  const { status } = req.query;
  
  let filteredLabTests = mockLabTests;
  
  if (status) {
    filteredLabTests = filteredLabTests.filter(test => test.status === status);
  }
  
  res.json({
    success: true,
    data: filteredLabTests
  });
});

// Health records endpoints
app.get('/api/health-records/patient/:id', (req, res) => {
  res.json({
    success: true,
    data: mockHealthRecords
  });
});

// Profile endpoints
app.get('/api/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: mockPatient.id,
        email: mockPatient.email,
        role: 'patient',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      profile: mockPatient
    }
  });
});

// New Authentication endpoints
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const newToken = 'mock-jwt-token-' + Date.now();
  res.json({
    success: true,
    data: { token: newToken }
  });
});

// Patient profile completion
app.post('/api/patients/:id/complete-profile', (req, res) => {
  const { address, emergencyContact, medicalHistory, allergies, currentMedications } = req.body;
  
  const updatedPatient = {
    ...mockPatient,
    address,
    emergencyContact,
    medicalHistory,
    allergies,
    currentMedications
  };
  
  res.json({
    success: true,
    data: updatedPatient,
    message: 'Profile completed successfully'
  });
});

// Doctor endpoints
app.get('/api/doctors', (req, res) => {
  const { specialty, search } = req.query;
  
  const mockDoctors = [
    {
      id: 'doc_001',
      firstName: 'Dr. Sarah',
      lastName: 'Mensah',
      specialty: 'General Medicine',
      rating: 4.8,
      experience: 8,
      consultationFee: 150,
      availableSlots: ['09:00', '10:00', '14:00', '15:00'],
      profileImage: 'https://via.placeholder.com/150',
      bio: 'Experienced general practitioner with focus on preventive care',
      languages: ['English', 'Twi'],
      education: 'MBChB, University of Ghana',
      certifications: ['Ghana Medical Association', 'West African College of Physicians']
    },
    {
      id: 'doc_002',
      firstName: 'Dr. Kwame',
      lastName: 'Asante',
      specialty: 'Cardiology',
      rating: 4.9,
      experience: 12,
      consultationFee: 200,
      availableSlots: ['08:00', '09:30', '13:00', '14:30'],
      profileImage: 'https://via.placeholder.com/150',
      bio: 'Cardiologist specializing in heart health and preventive cardiology',
      languages: ['English', 'Twi', 'French'],
      education: 'MD, University of Cape Town',
      certifications: ['Ghana Medical Association', 'American College of Cardiology']
    }
  ];
  
  let filteredDoctors = mockDoctors;
  
  if (specialty) {
    filteredDoctors = filteredDoctors.filter(doc => 
      doc.specialty.toLowerCase().includes(specialty.toLowerCase())
    );
  }
  
  if (search) {
    filteredDoctors = filteredDoctors.filter(doc => 
      `${doc.firstName} ${doc.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json({
    success: true,
    data: filteredDoctors
  });
});

app.get('/api/doctors/:id', (req, res) => {
  const { id } = req.params;
  
  const mockDoctor = {
    id,
    firstName: 'Dr. Sarah',
    lastName: 'Mensah',
    specialty: 'General Medicine',
    rating: 4.8,
    experience: 8,
    consultationFee: 150,
    availableSlots: ['09:00', '10:00', '14:00', '15:00'],
    profileImage: 'https://via.placeholder.com/150',
    bio: 'Experienced general practitioner with focus on preventive care',
    languages: ['English', 'Twi'],
    education: 'MBChB, University of Ghana',
    certifications: ['Ghana Medical Association', 'West African College of Physicians'],
    reviews: [
      {
        id: 'rev_001',
        patientName: 'John Doe',
        rating: 5,
        comment: 'Excellent doctor, very thorough and caring',
        date: '2024-01-15'
      }
    ]
  };
  
  res.json({
    success: true,
    data: mockDoctor
  });
});

app.get('/api/doctors/:id/availability', (req, res) => {
  const { date } = req.query;
  
  res.json({
    success: true,
    data: {
      timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
    }
  });
});

app.get('/api/doctors/:id/reviews', (req, res) => {
  const mockReviews = [
    {
      id: 'rev_001',
      patientName: 'John Doe',
      rating: 5,
      comment: 'Excellent doctor, very thorough and caring',
      date: '2024-01-15'
    },
    {
      id: 'rev_002',
      patientName: 'Jane Smith',
      rating: 4,
      comment: 'Good consultation, very professional',
      date: '2024-01-10'
    }
  ];
  
  res.json({
    success: true,
    data: mockReviews
  });
});

// Video Call endpoints
app.post('/api/video-calls/session', (req, res) => {
  const { appointmentId } = req.body;
  
  res.json({
    success: true,
    data: {
      sessionId: 'session_' + Date.now(),
      channelName: `appointment_${appointmentId}`,
      token: 'mock-agora-token-' + Date.now(),
      agoraAppId: 'ae1121fddf60428c90b4533d20b00557'
    }
  });
});

app.post('/api/video-calls/:id/join', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      channelName: `session_${id}`,
      token: 'mock-agora-token-' + Date.now(),
      agoraAppId: 'ae1121fddf60428c90b4533d20b00557'
    }
  });
});

app.post('/api/video-calls/:id/end', (req, res) => {
  res.json({
    success: true,
    message: 'Video call ended successfully'
  });
});

app.get('/api/video-calls/patient/:id/history', (req, res) => {
  const mockHistory = [
    {
      id: 'call_001',
      appointmentId: 'apt_001',
      doctorName: 'Dr. Sarah Mensah',
      duration: '00:25:30',
      date: '2024-01-15',
      status: 'completed'
    }
  ];
  
  res.json({
    success: true,
    data: mockHistory
  });
});

// File Upload endpoints
app.post('/api/files/upload', (req, res) => {
  res.json({
    success: true,
    data: {
      fileUrl: 'https://example.com/uploaded-file.pdf',
      fileId: 'file_' + Date.now()
    }
  });
});

app.delete('/api/files/:id', (req, res) => {
  res.json({
    success: true,
    message: 'File deleted successfully'
  });
});

// Notification endpoints
app.get('/api/notifications/patient/:id', (req, res) => {
  const mockNotifications = [
    {
      id: 'notif_001',
      title: 'Appointment Reminder',
      message: 'Your appointment with Dr. Sarah Mensah is in 1 hour',
      type: 'appointment',
      isRead: false,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'notif_002',
      title: 'Lab Results Ready',
      message: 'Your blood test results are now available',
      type: 'lab_result',
      isRead: true,
      createdAt: '2024-01-14T15:30:00Z'
    }
  ];
  
  res.json({
    success: true,
    data: mockNotifications
  });
});

app.patch('/api/notifications/:id/read', (req, res) => {
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

app.put('/api/notifications/patient/:id/preferences', (req, res) => {
  res.json({
    success: true,
    message: 'Notification preferences updated'
  });
});

// Search endpoints
app.get('/api/search/doctors', (req, res) => {
  const { query, specialty } = req.query;
  
  res.json({
    success: true,
    data: [
      {
        id: 'doc_001',
        name: 'Dr. Sarah Mensah',
        specialty: 'General Medicine',
        rating: 4.8
      }
    ]
  });
});

app.get('/api/search/medications', (req, res) => {
  const { query } = req.query;
  
  res.json({
    success: true,
    data: [
      {
        id: 'med_001',
        name: 'Metformin',
        dosage: '500mg',
        manufacturer: 'Generic'
      }
    ]
  });
});

// Payment endpoints (Paystack Integration)
app.post('/api/payments/initialize', async (req, res) => {
  const { 
    appointmentId, 
    amount, 
    email, 
    patientId, 
    doctorId, 
    doctorName, 
    appointmentDate, 
    appointmentTime 
  } = req.body;
  
  try {
    // Try to create a real Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk_test_734f5b2915b36b350fdc4efd12d3214097a7a79f',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        email: email,
        reference: `IFFA_${Date.now()}`,
        currency: 'GHS',
        callback_url: 'iffahealth://payment-callback',
        metadata: {
          appointmentId,
          patientId,
          doctorId,
          doctorName,
          appointmentDate,
          appointmentTime
        }
      })
    });

    if (paystackResponse.ok) {
      const paystackData = await paystackResponse.json();
      res.json({
        success: true,
        data: paystackData.data,
        message: 'Payment initialized successfully with real Paystack API'
      });
    } else {
      // Fallback to mock response if Paystack fails
      const reference = 'TXN_' + Date.now();
      const accessCode = 'ACCESS_' + Math.random().toString(36).substr(2, 9);
      
      res.json({
        success: true,
        data: {
          authorization_url: `https://checkout.paystack.com/${accessCode}`,
          access_code: accessCode,
          reference: reference
        },
        message: 'Payment initialized with mock data (Paystack API unavailable)'
      });
    }
  } catch (error) {
    console.error('Paystack API Error:', error);
    
    // Fallback to mock response
    const reference = 'TXN_' + Date.now();
    const accessCode = 'ACCESS_' + Math.random().toString(36).substr(2, 9);
    
    res.json({
      success: true,
      data: {
        authorization_url: `https://checkout.paystack.com/${accessCode}`,
        access_code: accessCode,
        reference: reference
      },
      message: 'Payment initialized with mock data (Paystack API error)'
    });
  }
});

app.get('/api/payments/verify/:reference', (req, res) => {
  const { reference } = req.params;
  
  // Mock verification response
  const isSuccess = Math.random() > 0.1; // 90% success rate for testing
  
  res.json({
    success: true,
    data: {
      status: isSuccess ? 'success' : 'failed',
      transactionId: 'TXN_' + Date.now(),
      amount: 150,
      appointmentId: 'apt_' + Date.now()
    }
  });
});

app.post('/api/appointments/book-with-payment', (req, res) => {
  const { 
    patientId, 
    doctorId, 
    date, 
    time, 
    notes, 
    paymentData 
  } = req.body;
  
  // Create appointment with payment
  const appointmentId = 'apt_' + Date.now();
  const appointment = {
    id: appointmentId,
    patientId,
    doctorId,
    date,
    time,
    type: 'video',
    status: 'confirmed',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  
  const payment = {
    reference: paymentData.reference,
    status: 'completed',
    amount: paymentData.amount
  };
  
  res.json({
    success: true,
    data: {
      appointment,
      payment
    },
    message: 'Appointment booked and payment processed successfully'
  });
});

app.get('/api/payments/patient/:id/history', (req, res) => {
  const mockPayments = [
    {
      id: 'pay_001',
      appointmentId: 'apt_001',
      amount: 150,
      status: 'completed',
      date: '2024-01-15',
      method: 'card',
      reference: 'TXN_1234567890',
      doctorName: 'Dr. Sarah Mensah',
      appointmentDate: '2024-01-20',
      appointmentTime: '10:00'
    },
    {
      id: 'pay_002',
      appointmentId: 'apt_002',
      amount: 200,
      status: 'completed',
      date: '2024-01-10',
      method: 'bank_transfer',
      reference: 'TXN_0987654321',
      doctorName: 'Dr. Kwame Asante',
      appointmentDate: '2024-01-25',
      appointmentTime: '14:30'
    }
  ];
  
  res.json({
    success: true,
    data: mockPayments
  });
});

app.post('/api/payments/:id/refund', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  res.json({
    success: true,
    data: {
      refundId: 'REF_' + Date.now(),
      status: 'processed',
      amount: 150
    },
    message: 'Refund processed successfully'
  });
});

app.get('/api/payments/methods', (req, res) => {
  res.json({
    success: true,
    data: {
      methods: [
        {
          id: 'card',
          name: 'Credit/Debit Card',
          type: 'card',
          isActive: true
        },
        {
          id: 'bank_transfer',
          name: 'Bank Transfer',
          type: 'bank',
          isActive: true
        },
        {
          id: 'mobile_money',
          name: 'Mobile Money',
          type: 'mobile_money',
          isActive: true
        }
      ]
    }
  });
});

// Emergency endpoints
app.get('/api/emergency/patient/:id/contacts', (req, res) => {
  const mockContacts = [
    {
      id: 'contact_001',
      name: 'Emergency Services',
      phone: '911',
      type: 'emergency'
    },
    {
      id: 'contact_002',
      name: 'Family Contact',
      phone: '+1234567891',
      type: 'family'
    }
  ];
  
  res.json({
    success: true,
    data: mockContacts
  });
});

// Analytics endpoints
app.get('/api/analytics/patient/:id/health', (req, res) => {
  const { period } = req.query;
  
  res.json({
    success: true,
    data: {
      period,
      metrics: {
        appointmentsCompleted: 5,
        medicationsActive: 2,
        labTestsCompleted: 3,
        healthScore: 85
      }
    }
  });
});

// App version endpoint
app.get('/api/app/version', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      updateRequired: false
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 IFFAHEALTH Mock API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Health check: http://10.45.177.148:${PORT}/health`);
  console.log(`🔧 This is a MOCK server for testing the mobile app`);
});
