import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const authState = await AsyncStorage.getItem('authState');
      if (authState) {
        const parsedAuth = JSON.parse(authState);
        if (parsedAuth.token) {
          config.headers.Authorization = `Bearer ${parsedAuth.token}`;
        }
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Enhanced Patient Data Types
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    region: string;
    country: string;
    postalCode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: string[];
  allergies: string[];
  currentMedications: string[];
  bloodType?: string;
  height?: number;
  weight?: number;
  maritalStatus?: string;
  occupation?: string;
  employer?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceGroupNumber?: string;
  insuranceType?: 'primary' | 'secondary' | 'tertiary';
  insuranceExpiryDate?: string;
  preferredLanguage?: string;
  preferredDoctorGender?: 'male' | 'female' | 'no-preference';
  preferredAppointmentTime?: 'morning' | 'afternoon' | 'evening' | 'any';
  communicationPreferences?: string[];
  referralSource?: string;
  profilePictureUrl?: string;
  consentToTelehealth: boolean;
  consentToDataSharing: boolean;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  medicalSchool?: string;
  graduationYear?: number;
  hospitalAffiliation?: string;
  practiceAddress: {
    street: string;
    city: string;
    region: string;
    country: string;
    postalCode: string;
  };
  city: string;
  consultationFee: number;
  bio?: string;
  languages?: string[];
  experienceYears: number;
  profileImageUrl?: string;
  isVerified: boolean;
  verificationDocuments?: string[];
  boardCertification?: string;
  boardCertificationDocument?: string;
  isProfileComplete: boolean;
  isAvailable: boolean;
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  patientName?: string;
  patientPhone?: string;
  patientImage?: string;
  doctorName: string;
  doctorImage?: string;
  specialty: string;
  date: string;
  time: string;
  type: 'video' | 'in-person';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  meetingLink?: string;
  paymentStatus?: string;
  amount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy?: string;
  instructions: string;
  status: 'active' | 'paused' | 'completed' | 'discontinued';
  sideEffects?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  prescriptionDate: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  followUpDate?: string;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  quantity: number;
  instructions?: string;
  createdAt: string;
}

export interface LabTest {
  id: string;
  patientId: string;
  doctorId?: string;
  patientName?: string;
  patientPhone?: string;
  testName: string;
  testType: string;
  date: string;
  time: string;
  location: string;
  status: 'scheduled' | 'pending' | 'completed' | 'cancelled' | 'failed';
  results?: any;
  notes?: string;
  doctorNotes?: string;
  orderedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  doctorId?: string;
  patientName?: string;
  patientPhone?: string;
  type: 'consultation' | 'diagnosis' | 'treatment' | 'procedure' | 'vaccination' | 'lab_result' | 'prescription';
  title: string;
  description?: string;
  recordDate: string;
  attachments: string[];
  doctor?: string;
  doctorSpecialty?: string;
  hospital?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorEarnings {
  summary: {
    totalEarnings: number;
    netEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    totalAppointments: number;
    averageEarningPerAppointment: number;
  };
  recentEarnings: Array<{
    id: string;
    amount: number;
    netAmount: number;
    status: string;
    earnedDate: string;
    appointmentDate: string;
    appointmentTime: string;
    patientName: string;
    createdAt: string;
  }>;
}

export interface PayoutRequest {
  id: string;
  doctorId: string;
  amount: number;
  method: 'mobile_money' | 'bank_transfer' | 'paypal';
  accountDetails: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestDate: string;
  processedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'appointment' | 'prescription' | 'lab_result' | 'payment' | 'general';
  title: string;
  message: string;
  data?: any;
  status: 'unread' | 'read' | 'archived';
  readAt?: string;
  createdAt: string;
}

// Enhanced API Service Functions
export const enhancedApiService = {
  // Authentication APIs
  async login(email: string, password: string): Promise<ApiResponse<{token: string, user: Patient | Doctor}>> {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw new Error('Failed to login');
    }
  },

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    role: 'patient' | 'doctor';
    specialty?: string;
  }): Promise<ApiResponse<{token: string, user: Patient | Doctor}>> {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to register');
    }
  },

  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw new Error('Failed to logout');
    }
  },

  // Enhanced Patient APIs
  async getPatientProfile(patientId: string): Promise<ApiResponse<Patient>> {
    try {
      const response = await apiClient.get(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch patient profile');
    }
  },

  async updatePatientProfile(patientId: string, data: Partial<Patient>): Promise<ApiResponse<Patient>> {
    try {
      const response = await apiClient.put(`/patients/${patientId}`, data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update patient profile');
    }
  },

  async completePatientProfile(patientId: string, profileData: {
    address: Patient['address'];
    emergencyContact: Patient['emergencyContact'];
    medicalHistory: string[];
    allergies: string[];
    currentMedications: string[];
    bloodType?: string;
    height?: number;
    weight?: number;
    maritalStatus?: string;
    occupation?: string;
    employer?: string;
    insuranceProvider?: string;
    insuranceNumber?: string;
    insuranceGroupNumber?: string;
    insuranceType?: 'primary' | 'secondary' | 'tertiary';
    insuranceExpiryDate?: string;
    preferredLanguage?: string;
    preferredDoctorGender?: 'male' | 'female' | 'no-preference';
    preferredAppointmentTime?: 'morning' | 'afternoon' | 'evening' | 'any';
    communicationPreferences?: string[];
    referralSource?: string;
    consentToTelehealth: boolean;
    consentToDataSharing: boolean;
  }): Promise<ApiResponse<Patient>> {
    try {
      const response = await apiClient.post(`/patients/${patientId}/complete-profile`, profileData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to complete patient profile');
    }
  },

  // Enhanced Doctor APIs
  async getDoctorProfile(doctorId: string): Promise<ApiResponse<Doctor>> {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor profile');
    }
  },

  async updateDoctorProfile(doctorId: string, data: Partial<Doctor>): Promise<ApiResponse<Doctor>> {
    try {
      const response = await apiClient.put(`/doctors/${doctorId}`, data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update doctor profile');
    }
  },

  async completeDoctorProfile(doctorId: string, profileData: {
    medicalSchool: string;
    graduationYear: number;
    hospitalAffiliation: string;
    practiceAddress: Doctor['practiceAddress'];
    city: string;
    consultationFee: number;
    bio: string;
    languages: string[];
    experienceYears: number;
    verificationDocuments: string[];
    boardCertification: string;
    boardCertificationDocument: string;
  }): Promise<ApiResponse<Doctor>> {
    try {
      const response = await apiClient.post(`/doctors/${doctorId}/complete-profile`, profileData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to complete doctor profile');
    }
  },

  async searchDoctors(params: {
    specialty?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Doctor>> {
    try {
      const response = await apiClient.get('/doctors', { params });
      return response.data;
    } catch (error) {
      throw new Error('Failed to search doctors');
    }
  },

  async getDoctorAvailability(doctorId: string, date: string): Promise<ApiResponse<{
    date: string;
    availableSlots: string[];
    bookedTimes: string[];
  }>> {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}/availability`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor availability');
    }
  },

  // Enhanced Appointment APIs
  async getAppointments(params: {
    patientId?: string;
    doctorId?: string;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Appointment>> {
    try {
      const response = await apiClient.get('/appointments', { params });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch appointments');
    }
  },

  async getUpcomingAppointments(patientId: string): Promise<ApiResponse<Appointment[]>> {
    try {
      const response = await apiClient.get(`/patients/${patientId}/appointments/upcoming`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch upcoming appointments');
    }
  },

  async createAppointment(data: {
    patient_id: string;
    doctor_id: string;
    appointment_date: string;
    appointment_time: string;
    type: 'video' | 'in-person';
    notes?: string;
    meeting_link?: string;
  }): Promise<ApiResponse<Appointment>> {
    try {
      const response = await apiClient.post('/appointments', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create appointment');
    }
  },

  // Enhanced Prescription APIs
  async createPrescription(data: {
    patient_id: string;
    doctor_id: string;
    prescription_date: string;
    notes?: string;
    follow_up_date?: string;
    items: Array<{
      medicationName: string;
      dosage: string;
      frequency: string;
      quantity: number;
      instructions?: string;
    }>;
  }): Promise<ApiResponse<Prescription>> {
    try {
      const response = await apiClient.post('/prescriptions', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create prescription');
    }
  },

  async getPrescriptions(params: {
    patientId?: string;
    doctorId?: string;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Prescription>> {
    try {
      const endpoint = params.patientId ? 
        `/prescriptions/patient/${params.patientId}` : 
        `/prescriptions/doctor/${params.doctorId}`;
      const response = await apiClient.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch prescriptions');
    }
  },

  async getPrescriptionById(prescriptionId: string): Promise<ApiResponse<Prescription>> {
    try {
      const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch prescription');
    }
  },

  async searchMedications(query: string, limit = 20): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get('/prescriptions/medications/search', {
        params: { query, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to search medications');
    }
  },

  // Enhanced Lab Test APIs
  async createLabTest(data: {
    patient_id: string;
    test_name: string;
    test_type: string;
    ordered_by: string;
    test_date: string;
    test_time: string;
    location: string;
    notes?: string;
  }): Promise<ApiResponse<LabTest>> {
    try {
      const response = await apiClient.post('/lab-tests', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create lab test');
    }
  },

  async getLabTests(params: {
    patientId?: string;
    doctorId?: string;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<LabTest>> {
    try {
      const endpoint = params.patientId ? 
        `/lab-tests/patient/${params.patientId}` : 
        `/lab-tests/doctor/${params.doctorId}`;
      const response = await apiClient.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch lab tests');
    }
  },

  async getUpcomingLabTests(patientId: string): Promise<ApiResponse<LabTest[]>> {
    try {
      const response = await apiClient.get(`/lab-tests/patient/${patientId}/upcoming`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch upcoming lab tests');
    }
  },

  async addLabTestResults(labTestId: string, results: any, doctorNotes?: string): Promise<ApiResponse<LabTest>> {
    try {
      const response = await apiClient.post(`/lab-tests/${labTestId}/results`, {
        results,
        doctor_notes: doctorNotes
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to add lab test results');
    }
  },

  async getLabTestTypes(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get('/lab-tests/types/list');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch lab test types');
    }
  },

  // Enhanced Medical Records APIs
  async createMedicalRecord(data: {
    patient_id: string;
    type: 'consultation' | 'diagnosis' | 'treatment' | 'procedure' | 'vaccination' | 'lab_result' | 'prescription';
    title: string;
    description?: string;
    record_date: string;
    doctor_id?: string;
    hospital_id?: string;
    attachments?: string[];
  }): Promise<ApiResponse<HealthRecord>> {
    try {
      const response = await apiClient.post('/medical-records', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create medical record');
    }
  },

  async getMedicalRecords(params: {
    patientId?: string;
    doctorId?: string;
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<PaginatedResponse<HealthRecord>> {
    try {
      const endpoint = params.patientId ? 
        `/medical-records/patient/${params.patientId}` : 
        `/medical-records/doctor/${params.doctorId}`;
      const response = await apiClient.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch medical records');
    }
  },

  async getRecentHealthRecords(patientId: string): Promise<ApiResponse<HealthRecord[]>> {
    try {
      const response = await apiClient.get(`/medical-records/patient/${patientId}/recent`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch recent health records');
    }
  },

  async getMedicalRecordTypes(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get('/medical-records/types/list');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch medical record types');
    }
  },

  // Enhanced Payout APIs
  async getDoctorEarnings(doctorId: string, period = 'month'): Promise<ApiResponse<DoctorEarnings>> {
    try {
      const response = await apiClient.get(`/payouts/earnings/${doctorId}`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor earnings');
    }
  },

  async createPayoutRequest(data: {
    doctor_id: string;
    amount: number;
    method: 'mobile_money' | 'bank_transfer' | 'paypal';
    account_details: any;
  }): Promise<ApiResponse<PayoutRequest>> {
    try {
      const response = await apiClient.post('/payouts/request', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create payout request');
    }
  },

  async getPayoutRequests(doctorId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<PayoutRequest>> {
    try {
      const response = await apiClient.get(`/payouts/requests/${doctorId}`, { params });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch payout requests');
    }
  },

  async getPayoutMethods(): Promise<ApiResponse<{
    methods: Array<{
      id: string;
      name: string;
      type: 'card' | 'bank' | 'mobile_money';
      isActive: boolean;
      description: string;
      fields: any[];
    }>;
  }>> {
    try {
      const response = await apiClient.get('/payouts/methods');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch payout methods');
    }
  },

  // Enhanced Notification APIs
  async getNotifications(userId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Notification>> {
    try {
      const response = await apiClient.get(`/notifications/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch notifications');
    }
  },

  async getUnreadCount(userId: string): Promise<ApiResponse<{unreadCount: number}>> {
    try {
      const response = await apiClient.get(`/notifications/user/${userId}/unread-count`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch unread count');
    }
  },

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to mark notification as read');
    }
  },

  async markAllNotificationsAsRead(userId: string): Promise<ApiResponse<{updatedCount: number}>> {
    try {
      const response = await apiClient.put(`/notifications/user/${userId}/read-all`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to mark all notifications as read');
    }
  },

  async getNotificationPreferences(userId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/notifications/preferences/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch notification preferences');
    }
  },

  async updateNotificationPreferences(userId: string, preferences: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put(`/notifications/preferences/${userId}`, preferences);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update notification preferences');
    }
  },

  // Enhanced Medication APIs
  async getMedications(patientId: string, status?: string): Promise<ApiResponse<Medication[]>> {
    try {
      const response = await apiClient.get(`/patients/${patientId}/medications`, {
        params: { status }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch medications');
    }
  },

  async getCurrentMedications(patientId: string): Promise<ApiResponse<Medication[]>> {
    try {
      const response = await apiClient.get(`/patients/${patientId}/medications/current`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch current medications');
    }
  },

  // Video Call APIs
  async createVideoCallSession(appointmentId: string): Promise<ApiResponse<{
    sessionId: string;
    channelName: string;
    token: string;
    agoraAppId: string;
  }>> {
    try {
      const response = await apiClient.post('/video-calls/session', { appointmentId });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create video call session');
    }
  },

  // Payment APIs
  async initializePayment(data: {
    appointmentId: string;
    amount: number;
    email: string;
    patientId: string;
    doctorId: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
  }): Promise<ApiResponse<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>> {
    try {
      const response = await apiClient.post('/payments/initialize', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to initialize payment');
    }
  },

  async verifyPayment(reference: string): Promise<ApiResponse<{
    status: 'success' | 'failed' | 'pending';
    transactionId: string;
    amount: number;
    appointmentId: string;
  }>> {
    try {
      const response = await apiClient.get(`/payments/verify/${reference}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to verify payment');
    }
  },

  // Utility functions
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  async getAppVersion(): Promise<ApiResponse<{version: string, updateRequired: boolean}>> {
    try {
      const response = await apiClient.get('/app/version');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch app version');
    }
  }
};

export default enhancedApiService;
