import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// ---- Robust base URL resolver (fixes intermittent Android emulator Network Error) ----
let hasResolvedBaseUrl = false;
const API_BASE_URL_KEY = 'resolved_api_base_url_v2';

function normalizeRootFromBase(base: string): string {
  // Ensure we use the server root (without trailing /api)
  try {
    if (base.endsWith('/api')) return base.slice(0, -4);
    return base.replace(/\/$/, '');
  } catch {
    return base;
  }
}

async function resolveReachableBaseUrl(): Promise<string | null> {
  // 1) Use cached resolution first
  try {
    const cached = await AsyncStorage.getItem(API_BASE_URL_KEY);
    if (cached) {
      const ok = await pingHealth(cached);
      if (ok) return cached;
    }
  } catch {}

  // 2) Build candidate roots (no /api)
  const envOverride = (globalThis as any)?.process?.env?.API_OVERRIDE_BASE_URL as string | undefined;
  const overrideRoot = envOverride ? normalizeRootFromBase(envOverride) : undefined;
  const currentRoot = normalizeRootFromBase(API_CONFIG.BASE_URL);

  const candidates: string[] = [];
  if (overrideRoot) candidates.push(overrideRoot);
  if (Platform.OS === 'android') {
    candidates.push('http://10.0.2.2:3000');
    candidates.push('http://localhost:3000');
    // Fallback to previously used host IP if available in storage
    candidates.push('http://10.95.157.225:3000');
  } else {
    candidates.push('http://localhost:3000');
  }
  // Ensure current root is tested too
  if (!candidates.includes(currentRoot)) candidates.unshift(currentRoot);

  // 3) Probe /health across candidates with short timeout
  for (const root of candidates) {
    try {
      const ok = await pingHealth(root);
      if (ok) {
        await AsyncStorage.setItem(API_BASE_URL_KEY, root);
        return root;
      }
    } catch {}
  }
  return null;
}

async function pingHealth(root: string): Promise<boolean> {
  try {
    const resp = await axios.get(`${root}/health`, { timeout: 2500 });
    return Boolean(resp?.data?.success === true);
  } catch {
    return false;
  }
}

// Token refresh handling
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
const subscribeTokenRefresh = (cb: (token: string) => void) => refreshSubscribers.push(cb);
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Resolve base URL on Android the first time to avoid emulator network errors
    try {
      if (!hasResolvedBaseUrl && Platform.OS === 'android') {
        const root = await resolveReachableBaseUrl();
        if (root) {
          const computed = `${root}/api`;
          apiClient.defaults.baseURL = computed;
          config.baseURL = computed;
          hasResolvedBaseUrl = true;
        }
      }
    } catch {}

    try {
      // Get auth token from AsyncStorage
      const authState = await AsyncStorage.getItem('iffahealth_auth_state');
      console.log('Axios interceptor - authState found:', !!authState);
      if (authState) {
        const parsedAuth = JSON.parse(authState);
        console.log('Axios interceptor - token found:', !!parsedAuth.token);
        if (parsedAuth.token) {
          config.headers.Authorization = `Bearer ${parsedAuth.token}`;
          console.log('Axios interceptor - Authorization header set');
        } else {
          console.log('Axios interceptor - No token in authState');
        }
      } else {
        console.log('Axios interceptor - No authState found');
      }
    } catch (error) {
      console.error('Axios interceptor - Error getting auth token:', error);
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
  async (error) => {
    console.error('API Error:', error);
    const originalRequest = error.config;
    // Handle 401 with refresh-and-retry, avoid loops and skip refresh endpoint itself
    if (error.response?.status === 401 && !originalRequest?._retry && !String(originalRequest?.url || '').includes('/auth/refresh')) {
      console.log('🔐 401 Unauthorized - Token may be expired or invalid');
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string) => {
            try {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              originalRequest._retry = true;
              resolve(apiClient(originalRequest));
            } catch (e) {
              reject(e);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshed = await apiService.refreshToken();
        const newToken = (refreshed as any)?.data?.token || (refreshed as any)?.token;
        if (!newToken) throw new Error('No token in refresh response');
        // Persist new token
        const authStateRaw = await AsyncStorage.getItem('iffahealth_auth_state');
        const authState = authStateRaw ? JSON.parse(authStateRaw) : {};
        const updated = { ...authState, token: newToken };
        await AsyncStorage.setItem('iffahealth_auth_state', JSON.stringify(updated));
        // Update axios defaults and retry subscribers
        apiClient.defaults.headers.Authorization = `Bearer ${newToken}`;
        onRefreshed(newToken);
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.log('❌ Token refresh failed, clearing auth state');
        try {
          await AsyncStorage.removeItem('iffahealth_auth_state');
          await AsyncStorage.removeItem('user_token');
          await AsyncStorage.removeItem('user_data');
          await AsyncStorage.removeItem('doctor_data');
          await AsyncStorage.removeItem('patient_data');
        } catch {}
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

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

// Patient Data Types
export interface Patient {
  id: string;
  profileId?: string; // Patient table ID for appointments
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
  isProfileComplete?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: 'video';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  location?: string;
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
  // Backend response fields
  appointment_date: string;
  appointment_time: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_specialty: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  instructions: string;
  status: 'active' | 'paused' | 'completed';
  sideEffects?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LabTest {
  id: string;
  patientId: string;
  testName: string;
  testType: string;
  orderedBy: string;
  date: string;
  time: string;
  location: string;
  status: 'scheduled' | 'pending' | 'completed' | 'cancelled';
  results?: {
    value: string;
    unit: string;
    normalRange: string;
    status: 'normal' | 'abnormal' | 'critical';
  }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Backend response fields
  test_name: string;
  test_type: string;
  test_date: string;
  test_time: string;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  type: 'consultation' | 'diagnosis' | 'treatment' | 'procedure' | 'vaccination';
  title: string;
  description: string;
  date: string;
  doctor: string;
  hospital: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

// API Service Functions
export const apiService = {
  // Authentication APIs
  async login(email: string, password: string): Promise<ApiResponse<{token: string, user: Patient}>> {
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
  }): Promise<ApiResponse<{token: string, user: Patient}>> {
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

  async refreshToken(): Promise<ApiResponse<{token: string}>> {
    try {
      const response = await apiClient.post('/auth/refresh');
      return response.data;
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  },

  // Patient APIs
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
  }): Promise<ApiResponse<Patient>> {
    try {
      const response = await apiClient.post(`/patients/${patientId}/complete-profile`, profileData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to complete patient profile');
    }
  },

  // Appointments APIs
  async getAppointments(patientId: string, page = 1, limit = 10): Promise<PaginatedResponse<Appointment>> {
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`API: Fetching appointments for patient profile id (attempt ${attempt}):`, patientId);
        const response = await apiClient.get(`/appointments`, {
          params: { patient_id: patientId, page, limit }
        });
        console.log('API: Appointments response:', response.data);
        return response.data;
      } catch (error) {
        console.error(`API: Error fetching appointments (attempt ${attempt}):`, error);
        lastError = error;
        
        // If it's a 500 error and we have retries left, wait and retry
        if (error.response?.status === 500 && attempt < maxRetries) {
          console.log(`API: Retrying in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        
        // If it's not a 500 error or we're out of retries, throw the error
        throw new Error('Failed to fetch appointments');
      }
    }
    
    throw new Error('Failed to fetch appointments after multiple attempts');
  },

  async getUpcomingAppointments(patientId: string): Promise<ApiResponse<Appointment[]>> {
    try {
      console.log('API: Fetching upcoming appointments for patient:', patientId);
      const response = await apiClient.get('/appointments', {
        params: {
          patient_id: patientId,
          status: 'scheduled,confirmed',
          upcoming: true,
          _t: Date.now(),
        },
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      console.log('API: Upcoming appointments response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching upcoming appointments:', error);
      throw new Error('Failed to fetch upcoming appointments');
    }
  },

  async createAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Appointment>> {
    try {
      const response = await apiClient.post('/appointments', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create appointment');
    }
  },

  async updateAppointment(appointmentId: string, data: Partial<Appointment>): Promise<ApiResponse<Appointment>> {
    try {
      const response = await apiClient.put(`/appointments/${appointmentId}`, data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update appointment');
    }
  },

  async createDoctorEarning(payload: {
    doctor_id: string;
    appointment_id: string;
    amount: number;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/payouts/earnings', payload);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create doctor earning');
    }
  },

  async cancelAppointment(appointmentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to cancel appointment');
    }
  },

  // Medications APIs
  async getMedications(patientId: string): Promise<ApiResponse<Medication[]>> {
    try {
      const response = await apiClient.get(`/patients/${patientId}/medications`);
      return response.data;
    } catch (error) {
      // Gracefully handle not found endpoint or no data
      if ((error as any)?.response?.status === 404) {
        console.log('API: getMedications returned 404 - treating as empty list');
        return { success: true, data: [] } as ApiResponse<Medication[]>;
      }
      throw new Error('Failed to fetch medications');
    }
  },

  async getCurrentMedications(patientId: string): Promise<ApiResponse<Medication[]>> {
    try {
      console.log('API: Fetching current medications for patient:', patientId);
      const response = await apiClient.get(`/medications/patient/${patientId}?status=active`);
      console.log('API: Current medications response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching current medications:', error);
      throw new Error('Failed to fetch current medications');
    }
  },

  async addMedication(data: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Medication>> {
    try {
      const response = await apiClient.post('/medications', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to add medication');
    }
  },

  async updateMedicationStatus(medicationId: string, status: Medication['status']): Promise<ApiResponse<Medication>> {
    try {
      const response = await apiClient.patch(`/medications/${medicationId}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update medication status');
    }
  },

  // Lab Tests APIs
  async getLabTests(patientId: string): Promise<ApiResponse<LabTest[]>> {
    try {
      const response = await apiClient.get(`/patients/${patientId}/lab-tests`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch lab tests');
    }
  },

  async getUpcomingLabTests(patientId: string): Promise<ApiResponse<LabTest[]>> {
    try {
      console.log('API: Fetching upcoming lab tests for patient:', patientId);
      const response = await apiClient.get(`/lab-tests/patient/${patientId}?status=scheduled`);
      console.log('API: Upcoming lab tests response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching upcoming lab tests:', error);
      throw new Error('Failed to fetch upcoming lab tests');
    }
  },

  async bookLabTest(data: Omit<LabTest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<LabTest>> {
    try {
      const response = await apiClient.post('/lab-tests', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to book lab test');
    }
  },

  // Health Records APIs
  async getHealthRecords(patientId: string, page = 1, limit = 10): Promise<PaginatedResponse<HealthRecord>> {
    try {
      const response = await apiClient.get(`/patients/${patientId}/health-records`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch health records');
    }
  },

  async getRecentHealthRecords(patientId: string): Promise<ApiResponse<HealthRecord[]>> {
    try {
      console.log('API: Fetching recent health records for patient:', patientId);
      const response = await apiClient.get(`/patients/${patientId}/health-records/recent`);
      console.log('API: Recent health records response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching recent health records:', error);
      throw new Error('Failed to fetch recent health records');
    }
  },

  async createMedicalRecord(record: {
    patient_id: string;
    type: string;
    title: string;
    description?: string;
    record_date?: string; // YYYY-MM-DD
    doctor_id?: string | null;
    hospital_id?: string | null;
    attachments?: any[];
  }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/medical-records', record);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create medical record');
    }
  },

  async uploadHealthRecord(data: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<HealthRecord>> {
    try {
      const response = await apiClient.post('/health-records', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to upload health record');
    }
  },

  // Doctor Medical Records APIs
  async getDoctorMedicalRecords(doctorId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.type) queryParams.append('type', params.type);

      const url = `/doctors/${doctorId}/medical-records${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor medical records');
    }
  },

  async createMedicalRecord(recordData: {
    patient_id: string;
    type: string;
    title: string;
    description: string;
    record_date: string;
    doctor_id: string;
    hospital_id?: string;
    attachments?: string[];
  }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/medical-records', recordData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create medical record');
    }
  },

  async updateMedicalRecord(recordId: string, recordData: {
    type?: string;
    title?: string;
    description?: string;
    record_date?: string;
    attachments?: string[];
  }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put(`/medical-records/${recordId}`, recordData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update medical record');
    }
  },

  async deleteMedicalRecord(recordId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/medical-records/${recordId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete medical record');
    }
  },

  // Doctor APIs
  async getDoctors(specialty?: string, search?: string, checkAvailability: boolean = true): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get('/doctors', {
        params: { 
          specialty: specialty || undefined,
          search: search || undefined,
          checkAvailability: checkAvailability.toString()
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctors');
    }
  },

  async getDoctorProfile(doctorId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor profile');
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



  async getDoctorReviews(doctorId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}/reviews`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor reviews');
    }
  },

  async updateDoctorProfile(doctorId: string, profileData: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put(`/doctors/${doctorId}`, profileData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update doctor profile');
    }
  },

  // Token validation
  async validateToken(): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/verify');
      return response.data.success;
    } catch (error) {
      console.log('🔐 Token validation failed:', error.response?.status);
      return false;
    }
  },

  // Doctor Dashboard APIs
  async getDoctorStats(doctorId: string): Promise<ApiResponse<{
    totalAppointments: number;
    todayAppointments: number;
    totalPatients: number;
  }>> {
    try {
      console.log('API: Fetching doctor stats for:', doctorId);
      const response = await apiClient.get(`/doctors/${doctorId}/stats`);
      console.log('API: Doctor stats response:', response.data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor statistics');
    }
  },

  async getDoctorAppointments(doctorId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
  }): Promise<ApiResponse<{
    appointments: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      console.log('API: Fetching doctor appointments for:', doctorId, 'with params:', params);
      const response = await apiClient.get(`/doctors/${doctorId}/appointments`, {
        params: {
          page: params?.page,
          limit: params?.limit,
          status: params?.status,
          date: params?.date,
        }
      });
      console.log('API: Doctor appointments response:', response.data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor appointments');
    }
  },

  async getDoctorEarnings(doctorId: string, period: string = 'month'): Promise<ApiResponse<{
    summary: {
      totalEarnings: number;
      netEarnings: number;
      totalAppointments: number;
      averageEarningPerAppointment: number;
    };
    recentEarnings: any[];
  }>> {
    try {
      console.log('API: Fetching doctor earnings for:', doctorId, 'period:', period);
      const response = await apiClient.get(`/doctors/${doctorId}/earnings`, {
        params: { period }
      });
      console.log('API: Doctor earnings response:', response.data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor earnings');
    }
  },

  async getPayoutMethods(): Promise<ApiResponse<{
    methods: any[];
  }>> {
    try {
      const response = await apiClient.get('/payouts/methods');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch payout methods');
    }
  },

  async getDoctorPayoutMethods(doctorId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get(`/payouts/methods/${doctorId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor payout methods');
    }
  },

  async addDoctorPayoutMethod(doctorId: string, methodData: {
    method_type: string;
    provider: string;
    account_details: any;
    is_default?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post(`/payouts/methods/${doctorId}`, methodData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to add payment method');
    }
  },

  async updateDoctorPayoutMethod(doctorId: string, methodId: string, methodData: {
    method_type: string;
    provider: string;
    account_details: any;
    is_default?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put(`/payouts/methods/${doctorId}/${methodId}`, methodData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update payment method');
    }
  },

  async deleteDoctorPayoutMethod(doctorId: string, methodId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/payouts/methods/${doctorId}/${methodId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete payment method');
    }
  },

  // Payout Requests APIs
  async getPayoutRequests(doctorId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      
      const url = `/payouts/requests/${doctorId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch payout requests');
    }
  },

  async createPayoutRequest(doctorId: string, requestData: {
    amount: number;
    method: string;
    account_details: any;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/payouts/request', {
        doctor_id: doctorId,
        ...requestData
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create payout request');
    }
  },

  async cancelPayoutRequest(doctorId: string, requestId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put(`/payouts/requests/${doctorId}/${requestId}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to cancel payout request');
    }
  },

  async retryPayoutRequest(doctorId: string, requestId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put(`/payouts/requests/${doctorId}/${requestId}/retry`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to retry payout request');
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

  async joinVideoCall(sessionId: string): Promise<ApiResponse<{
    channelName: string;
    token: string;
    agoraAppId: string;
  }>> {
    try {
      const response = await apiClient.post(`/video-calls/${sessionId}/join`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to join video call');
    }
  },

  async endVideoCall(sessionId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post(`/video-calls/${sessionId}/end`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to end video call');
    }
  },

  async getVideoCallHistory(patientId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get(`/video-calls/patient/${patientId}/history`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch video call history');
    }
  },

  // File Upload APIs
  async uploadFile(file: FormData, type: 'health-record' | 'prescription' | 'lab-result'): Promise<ApiResponse<{fileUrl: string, fileId: string}>> {
    try {
      const response = await apiClient.post('/files/upload', file, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: { type }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to upload file');
    }
  },

  async deleteFile(fileId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete file');
    }
  },

  // Notifications APIs
  async getNotifications(userId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get(`/notifications/user/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch notifications');
    }
  },

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to mark notification as read');
    }
  },

  async updateNotificationPreferences(patientId: string, preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  }): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.put(`/notifications/patient/${patientId}/preferences`, preferences);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update notification preferences');
    }
  },

  // Search APIs
  async searchDoctors(query: string, specialty?: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get('/search/doctors', {
        params: { query, specialty }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to search doctors');
    }
  },

  async searchMedications(query: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get('/search/medications', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to search medications');
    }
  },

  // Payment APIs (Paystack Integration)
  async initializePayment(data: {
    appointmentId: string;
    amount: number;
    email: string;
    patientId: string;
    doctorId: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
    metadata?: Record<string, any>;
    callbackUrl?: string;
  }): Promise<ApiResponse<{
    authorization_url: string;
    access_code: string;
    reference: string;
    callback_url?: string;
    metadata?: Record<string, any>;
  }>> {
    try {
      const response = await apiClient.post('/payments/initialize', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to initialize payment');
    }
  },

  async verifyPayment(reference: string): Promise<ApiResponse<{
    status: string;
    amount: number;
    appointmentId: string;
    paystackStatus: string;
    metadata?: Record<string, any> | null;
  }>> {
    try {
      const response = await apiClient.get(`/payments/verify/${reference}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to verify payment');
    }
  },

  async createAppointmentWithPayment(data: {
    patientId: string;
    doctorId: string;
    date: string;
    time: string;
    notes?: string;
    paymentData: {
      amount: number;
      email: string;
      reference: string;
    };
  }): Promise<ApiResponse<{
    appointment: Appointment;
    payment: {
      reference: string;
      status: string;
      amount: number;
    };
  }>> {
    try {
      const response = await apiClient.post('/appointments/book-with-payment', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create appointment with payment');
    }
  },

  async getPaymentHistory(patientId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get(`/payments/patient/${patientId}/history`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch payment history');
    }
  },

  async refundPayment(paymentId: string, reason?: string): Promise<ApiResponse<{
    refundId: string;
    status: string;
    amount: number;
  }>> {
    try {
      const response = await apiClient.post(`/payments/${paymentId}/refund`, {
        reason: reason || 'Patient requested refund'
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to process refund');
    }
  },

  async getPaymentMethods(): Promise<ApiResponse<{
    methods: Array<{
      id: string;
      name: string;
      type: 'card' | 'bank' | 'mobile_money';
      isActive: boolean;
    }>;
  }>> {
    try {
      const response = await apiClient.get('/payments/methods');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch payment methods');
    }
  },

  // Emergency APIs
  async sendEmergencyAlert(patientId: string, location: string, message: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/emergency/alert', {
        patientId,
        location,
        message,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to send emergency alert');
    }
  },

  async getEmergencyContacts(patientId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get(`/emergency/patient/${patientId}/contacts`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch emergency contacts');
    }
  },

  // Analytics APIs
  async getHealthAnalytics(patientId: string, period: 'week' | 'month' | 'year'): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/analytics/patient/${patientId}/health`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch health analytics');
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
  },

  // Doctor Lab Tests APIs
  async getDoctorLabTests(doctorId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<LabTest[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);

      const url = `/doctors/${doctorId}/lab-tests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor lab tests');
    }
  },

  async createDoctorLabTest(labTestData: {
    patient_id: string;
    test_name: string;
    test_type: string;
    test_date: string;
    test_time: string;
    location: string;
    notes?: string;
  }): Promise<ApiResponse<LabTest>> {
    try {
      const response = await apiClient.post('/lab-tests', labTestData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create lab test');
    }
  },

  async updateLabTestStatus(labTestId: string, status: string, doctorNotes?: string): Promise<ApiResponse<LabTest>> {
    try {
      const response = await apiClient.put(`/lab-tests/${labTestId}`, {
        status,
        doctor_notes: doctorNotes
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update lab test status');
    }
  },

  async addLabTestResults(labTestId: string, results: any): Promise<ApiResponse<LabTest>> {
    try {
      const response = await apiClient.post(`/lab-tests/${labTestId}/results`, { results });
      return response.data;
    } catch (error) {
      throw new Error('Failed to add lab test results');
    }
  },

  // Doctor Prescriptions APIs
  async getDoctorPrescriptions(doctorId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);

      const url = `/doctors/${doctorId}/prescriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor prescriptions');
    }
  },

  async getPrescriptionById(prescriptionId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch prescription details');
    }
  },

  async getPrescriptionItems(prescriptionId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get(`/prescriptions/${prescriptionId}/items`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch prescription items');
    }
  },

  async getPatientPrescriptions(patientId: string, params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.status) queryParams.append('status', params.status);
      const url = `/prescriptions/patient/${patientId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch patient prescriptions');
    }
  },

  async createPrescription(prescriptionData: {
    patient_id: string;
    doctor_id: string;
    prescription_date: string;
    notes?: string;
    follow_up_date?: string;
    status?: string;
    items?: Array<{
      medicationName: string;
      dosage: string;
      frequency: string;
      quantity: number;
      instructions?: string;
    }>;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/prescriptions', prescriptionData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create prescription');
    }
  },

  async updatePrescription(prescriptionId: string, updateData: {
    status?: string;
    notes?: string;
    follow_up_date?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put(`/prescriptions/${prescriptionId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update prescription');
    }
  },

  async addPrescriptionItem(prescriptionId: string, itemData: {
    medicationName: string;
    dosage: string;
    frequency: string;
    quantity: number;
    instructions?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post(`/prescriptions/${prescriptionId}/items`, itemData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to add prescription item');
    }
  },

  async updatePrescriptionItem(prescriptionId: string, itemId: string, itemData: {
    medication_name?: string;
    dosage?: string;
    frequency?: string;
    quantity?: number;
    instructions?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put(`/prescriptions/${prescriptionId}/items/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update prescription item');
    }
  },

  async deletePrescriptionItem(prescriptionId: string, itemId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.delete(`/prescriptions/${prescriptionId}/items/${itemId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete prescription item');
    }
  },

  async searchMedications(query: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get(`/prescriptions/medications/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to search medications');
    }
  },

  // Doctor Patients APIs
  async getDoctorPatients(doctorId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      const url = `/doctors/${doctorId}/patients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch doctor patients');
    }
  }
};

export { apiClient };
export default apiService;

export const API_BASE_URL = API_CONFIG.BASE_URL;
