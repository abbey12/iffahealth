import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService, Patient, Appointment, Medication, LabTest, HealthRecord } from '../services/apiService';

// Use real API with working database connection
const API_SERVICE = apiService;

// Doctor interface
interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  medicalSchool?: string;
  graduationYear?: string;
  hospitalAffiliation?: string;
  practiceAddress?: string;
  city?: string;
  consultationFee?: number;
  bio?: string;
  languages?: string[];
  experienceYears?: number;
  profileImageUrl?: string;
  isVerified: boolean;
  isProfileComplete: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DataContextType {
  // Patient data
  patient: Patient | null;
  setPatient: (patient: Patient | null) => void;
  setPatientFromLogin: (userData: any) => void;
  
  // Doctor data
  doctor: Doctor | null;
  setDoctor: (doctor: Doctor | null) => void;
  setDoctorFromLogin: (userData: any) => void;
  
  // Appointments
  appointments: Appointment[];
  upcomingAppointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
  setUpcomingAppointments: (appointments: Appointment[]) => void;
  loadAppointments: (patientId: string) => Promise<void>;
  loadUpcomingAppointments: (patientId: string) => Promise<void>;
  
  // Medications
  medications: Medication[];
  currentMedications: Medication[];
  setMedications: (medications: Medication[]) => void;
  setCurrentMedications: (medications: Medication[]) => void;
  loadMedications: (patientId: string) => Promise<void>;
  loadCurrentMedications: (patientId: string) => Promise<void>;
  
  // Lab Tests
  labTests: LabTest[];
  upcomingLabTests: LabTest[];
  setLabTests: (labTests: LabTest[]) => void;
  setUpcomingLabTests: (labTests: LabTest[]) => void;
  loadLabTests: (patientId: string) => Promise<void>;
  loadUpcomingLabTests: (patientId: string) => Promise<void>;
  
  // Health Records
  healthRecords: HealthRecord[];
  recentHealthRecords: HealthRecord[];
  setHealthRecords: (records: HealthRecord[]) => void;
  setRecentHealthRecords: (records: HealthRecord[]) => void;
  loadHealthRecords: (patientId: string) => Promise<void>;
  loadRecentHealthRecords: (patientId: string) => Promise<void>;
  
  // Prescriptions (patient side)
  patientPrescriptions: any[];
  loadPatientPrescriptions: (patientId: string) => Promise<void>;
  
  // Notifications
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  loadNotifications: (patientId: string) => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
  
  // Refresh all data
  refreshAllData: (patientId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Patient data
  const [patient, setPatient] = useState<Patient | null>(null);
  
  // Doctor data
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  
  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  
  // Medications
  const [medications, setMedications] = useState<Medication[]>([]);
  const [currentMedications, setCurrentMedications] = useState<Medication[]>([]);
  
  // Lab Tests
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [upcomingLabTests, setUpcomingLabTests] = useState<LabTest[]>([]);
  
  // Health Records
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [recentHealthRecords, setRecentHealthRecords] = useState<HealthRecord[]>([]);
  // Prescriptions (patient side)
  const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);
  
  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set patient from login data
  const setPatientFromLogin = (userData: any) => {
    // Setting patient data from login
    if (userData) {
      // Extract profile data from nested structure
      const profile = userData.profile || {};
      console.log('🔍 Setting patient data from login:', {
        userId: userData.id,
        profileId: profile.id,
        profile: profile
      });
      
      const patientData: Patient = {
        id: userData.id,
        profileId: profile.id, // Store the patient table ID separately
        firstName: profile.first_name || userData.firstName,
        lastName: profile.last_name || userData.lastName,
        email: userData.email,
        phone: profile.phone || userData.phone || '',
        dateOfBirth: profile.date_of_birth || userData.dateOfBirth || '',
        gender: profile.gender || userData.gender || 'other',
        address: {
          street: profile.address?.street || userData.address?.street || '',
          city: profile.address?.city || userData.address?.city || '',
          region: profile.address?.region || userData.address?.region || '',
          country: profile.address?.country || userData.address?.country || 'Ghana',
          postalCode: profile.address?.postalCode || userData.address?.postalCode || '',
        },
        emergencyContact: {
          name: profile.emergency_contact?.name || userData.emergencyContact?.name || '',
          phone: profile.emergency_contact?.phone || userData.emergencyContact?.phone || '',
          relationship: profile.emergency_contact?.relationship || userData.emergencyContact?.relationship || '',
        },
        medicalHistory: profile.medical_history || userData.medicalHistory || [],
        allergies: profile.allergies || userData.allergies || [],
        currentMedications: profile.current_medications || userData.currentMedications || [],
        insurance: {
          provider: profile.insurance?.provider || userData.insurance?.provider || '',
          number: profile.insurance?.number || userData.insurance?.number || '',
          startDate: profile.insurance?.startDate || userData.insurance?.startDate || null,
          expiryDate: profile.insurance?.expiryDate || userData.insurance?.expiryDate || null,
        },
        isProfileComplete: userData.isProfileComplete || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Setting patient data
      setPatient(patientData);
    } else {
      // No user data found
    }
  };

  // Set doctor from login data
  const setDoctorFromLogin = (userData: any) => {
    // Setting doctor data from login
    if (userData) {
      // Extract profile data from nested structure
      const profile = userData.profile || {};
      const doctorData: Doctor = {
        id: profile.id || userData.id,
        profileId: profile.id,
        firstName: profile.first_name || userData.firstName,
        lastName: profile.last_name || userData.lastName,
        email: userData.email,
        phone: profile.phone || userData.phone || '',
        specialty: profile.specialty || userData.specialty || '',
        licenseNumber: profile.license_number || userData.licenseNumber || '',
        medicalSchool: profile.medical_school || userData.medicalSchool || '',
        graduationYear: profile.graduation_year || userData.graduationYear || '',
        hospitalAffiliation: profile.hospital_affiliation || userData.hospitalAffiliation || '',
        practiceAddress: profile.practice_address || userData.practiceAddress || '',
        city: profile.city || userData.city || '',
        consultationFee: profile.consultation_fee || userData.consultationFee || 0,
        bio: profile.bio || userData.bio || '',
        languages: profile.languages || userData.languages || [],
        experienceYears: profile.experience_years || userData.experienceYears || 0,
        profileImageUrl: profile.profile_image_url || userData.profileImageUrl || '',
        isVerified: profile.is_verified || userData.isVerified || false,
        isProfileComplete: profile.is_profile_complete || userData.isProfileComplete || false,
        isAvailable: profile.is_available || userData.isAvailable || true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Setting doctor data
      setDoctor(doctorData);
    } else {
      // No user data found
    }
  };

  // Retry function with exponential backoff
  const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (error.response?.status === 429 && i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  };

  // Load appointments
  const loadAppointments = async (patientId: string, useProfileId: boolean = false, profileId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const idToUse = useProfileId && profileId ? profileId : patientId;
      const response = await retryWithBackoff(() => API_SERVICE.getAppointments(idToUse));
      if (response.success) {
        setAppointments(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUpcomingAppointments = async (patientId: string, useProfileId: boolean = false, profileId?: string) => {
    try {
      console.log('🔄 Loading upcoming appointments for patient:', patientId);
      setIsLoading(true);
      setError(null);
      const idToUse = useProfileId && profileId ? profileId : patientId;
      console.log('🔄 Using patient ID for API call:', idToUse);
      const response = await retryWithBackoff(() => API_SERVICE.getUpcomingAppointments(idToUse));
      console.log('✅ Upcoming appointments response:', response);
      if (response.success) {
        console.log('✅ Setting upcoming appointments:', response.data);
        setUpcomingAppointments(response.data);
      } else {
        console.log('❌ API response not successful:', response);
      }
    } catch (err) {
      console.error('❌ Error loading upcoming appointments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load upcoming appointments');
    } finally {
      setIsLoading(false);
    }
  };

  // Load medications
  const loadMedications = async (patientId: string, useProfileId = false, profileId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      // Backend route `/api/patients/:id/medications` expects user_id in :id and converts internally.
      const response = await retryWithBackoff(() => API_SERVICE.getMedications(patientId));
      if (response.success) {
        setMedications(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medications');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentMedications = async (patientId: string, useProfileId = false, profileId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const idToUse = useProfileId && profileId ? profileId : patientId;
      const response = await retryWithBackoff(() => API_SERVICE.getCurrentMedications(idToUse));
      if (response.success) {
        setCurrentMedications(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load current medications');
    } finally {
      setIsLoading(false);
    }
  };

  // Load lab tests
  const loadLabTests = async (patientId: string, useProfileId = false, profileId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const idToUse = useProfileId && profileId ? profileId : patientId;
      const response = await retryWithBackoff(() => API_SERVICE.getLabTests(idToUse));
      if (response.success) {
        setLabTests(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lab tests');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUpcomingLabTests = async (patientId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await retryWithBackoff(() => API_SERVICE.getUpcomingLabTests(patientId));
      if (response.success) {
        setUpcomingLabTests(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load upcoming lab tests');
    } finally {
      setIsLoading(false);
    }
  };

  // Load health records
  const loadHealthRecords = async (patientId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await retryWithBackoff(() => API_SERVICE.getHealthRecords(patientId));
      if (response.success) {
        setHealthRecords(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health records');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentHealthRecords = async (patientId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await retryWithBackoff(() => API_SERVICE.getRecentHealthRecords(patientId));
      if (response.success) {
        setRecentHealthRecords(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recent health records');
    } finally {
      setIsLoading(false);
    }
  };

  // Load patient prescriptions
  const loadPatientPrescriptions = async (patientId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const resp = await retryWithBackoff(() => API_SERVICE.getPatientPrescriptions(patientId, { limit: 50 }));
      if (resp.success) {
        setPatientPrescriptions(resp.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prescriptions');
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications
  const loadNotifications = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await retryWithBackoff(() => API_SERVICE.getNotifications(userId));
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh all data - SIMPLIFIED
  const refreshAllData = useCallback(async (patientId: string) => {
    console.log('🔄 refreshAllData: Starting with patient ID:', patientId);
    try {
      setIsLoading(true);
      setError(null);
      
      // Add a small delay to ensure network is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch all data needed for dashboard widgets in parallel
      await Promise.all([
        // Upcoming appointments (patient profile id)
        loadUpcomingAppointments(patientId, false, patientId),
        // Medications list expects auth user id at /patients/:userId/medications
        (patient?.id ? loadMedications(patient.id, false, patient.id) : Promise.resolve()),
        // Current medications expects auth user id at /medications/patient/:id
        (patient?.id ? loadCurrentMedications(patient.id, false, patient.id) : Promise.resolve()),
        // Upcoming lab tests (patient profile id)
        loadUpcomingLabTests(patientId),
        // Recent health records (patient profile id)
        loadRecentHealthRecords(patientId),
        // Patient prescriptions (patient profile id)
        loadPatientPrescriptions(patientId),
        // Notifications (auth user id)
        (async () => {
          try {
            if (patient?.id) {
              await loadNotifications(patient.id);
            }
          } catch (e) {
            console.log('⚠️ Skipping notifications load:', (e as any)?.message || e);
          }
        })()
      ]);
      
      console.log('✅ refreshAllData: Completed successfully');
    } catch (err) {
      console.error('❌ refreshAllData error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies - keep it simple

  const value: DataContextType = {
    // Patient data
    patient,
    setPatient,
    setPatientFromLogin,
    
    // Doctor data
    doctor,
    setDoctor,
    setDoctorFromLogin,
    
    // Appointments
    appointments,
    upcomingAppointments,
    setAppointments,
    setUpcomingAppointments,
    loadAppointments,
    loadUpcomingAppointments,
    
    // Medications
    medications,
    currentMedications,
    setMedications,
    setCurrentMedications,
    loadMedications,
    loadCurrentMedications,
    
    // Lab Tests
    labTests,
    upcomingLabTests,
    setLabTests,
    setUpcomingLabTests,
    loadLabTests,
    loadUpcomingLabTests,
    
    // Health Records
    healthRecords,
    recentHealthRecords,
    setHealthRecords,
    setRecentHealthRecords,
    loadHealthRecords,
    loadRecentHealthRecords,
    
    // Prescriptions
    patientPrescriptions,
    loadPatientPrescriptions,
    
    // Notifications
    notifications,
    setNotifications,
    loadNotifications,
    
    // Loading and error states
    isLoading,
    setIsLoading,
    error,
    setError,
    
    // Refresh all data
    refreshAllData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataContext;
