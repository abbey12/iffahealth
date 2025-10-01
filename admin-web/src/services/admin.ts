import api from './api';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// Types
export interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  totalLabCenters: number;
  totalPharmacies: number;
  totalInsurancePartners: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeUsers: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  profile?: any;
}

export interface Doctor extends User {
  specialty: string;
  licenseNumber: string;
  experienceYears: number;
  consultationFee: number;
  rating: number;
  totalPatients: number;
  isVerified: boolean;
  phone?: string;
  city?: string;
  hospitalAffiliation?: string;
  medicalSchool?: string;
  languages?: string[];
  bio?: string;
  practiceAddress?: any;
  gender?: string;
  dateOfBirth?: string;
  reviewCount?: number;
  completedAppointments?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Patient extends User {
  dateOfBirth: string;
  gender: string;
  phone: string;
  address?: any;
  insurance?: any;
  bloodType?: string;
  medicalHistory?: string[];
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  patient: Patient;
  doctor: Doctor;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  type?: 'consultation' | 'follow_up' | 'emergency';
  notes?: string;
  location?: string;
  meetingLink?: string;
  paymentStatus?: string;
  paymentReference?: string;
  amount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LabCenter {
  id: string;
  name: string;
  description?: string;
  address: any;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  email?: string;
  website?: string;
  services?: string[];
  operatingHours?: any;
  coverageRadiusKm?: number;
  isActive: boolean;
  rating?: number | null;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerPharmacy {
  id: string;
  name: string;
  description?: string;
  address: any;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  email?: string;
  website?: string;
  services?: string[];
  operatingHours?: any;
  deliveryOptions?: string[];
  acceptsInsurance: boolean;
  insuranceProviders?: string[];
  coverageRadiusKm?: number;
  isActive: boolean;
  rating?: number | null;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InsurancePartner {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  coverageAreas?: string[];
  contactPerson?: any;
  phone?: string;
  email?: string;
  website?: string;
  plans?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const adminService = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/admin/dashboard/stats');
    return response.data.data;
  },

  // Users Management
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const response = await api.get('/admin/users', { params });
    return response.data.data;
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/admin/users/${id}`);
    return response.data.data;
  },

  async updateUserStatus(id: string, status: string): Promise<void> {
    await api.patch(`/admin/users/${id}/status`, { status });
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },

  // Doctors Management
  async getDoctors(params?: {
    page?: number;
    limit?: number;
    specialty?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Doctor>> {
    const response = await api.get('/admin/doctors', { params });
    const { items = [], meta } = response.data.data || {};

    const mappedItems: Doctor[] = items.map((doctor: any) => ({
      id: doctor.id,
      email: doctor.email,
      firstName: doctor.first_name,
      lastName: doctor.last_name,
      role: 'doctor',
      status: 'active',
      createdAt: doctor.created_at,
      updatedAt: doctor.updated_at,
      lastLogin: undefined,
      profile: undefined,
      specialty: doctor.specialty,
      licenseNumber: doctor.license_number,
      experienceYears: doctor.experience_years || 0,
      consultationFee: Number(doctor.consultation_fee || 0),
      rating: Number(doctor.average_rating || doctor.rating || 0),
      totalPatients: Number(doctor.total_patients || 0),
      isVerified: Boolean(doctor.is_verified),
      phone: doctor.phone || undefined,
      city: doctor.city || undefined,
      hospitalAffiliation: doctor.hospital_affiliation || undefined,
      medicalSchool: doctor.medical_school || undefined,
      languages: Array.isArray(doctor.languages)
        ? doctor.languages
        : typeof doctor.languages === 'string'
          ? doctor.languages.replace(/[{}]/g, '').split(',').map((lang: string) => lang.replace(/"/g, '').trim()).filter(Boolean)
          : [],
      bio: doctor.bio || undefined,
      practiceAddress: typeof doctor.practice_address === 'string'
        ? safeParseJSON(doctor.practice_address)
        : doctor.practice_address
    }));

    return {
      items: mappedItems,
      meta: normalizeMeta(meta, mappedItems.length)
    };
  },

  async verifyDoctor(id: string): Promise<void> {
    await api.patch(`/admin/doctors/${id}/verify`);
  },

  async rejectDoctor(id: string, reason: string): Promise<void> {
    await api.patch(`/admin/doctors/${id}/reject`, { reason });
  },

  async suspendDoctor(id: string, reason: string): Promise<void> {
    await api.patch(`/admin/doctors/${id}/suspend`, { reason });
  },

  // Patients Management
  async getPatients(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Patient>> {
    const response = await api.get('/admin/patients', { params });
    const { items = [], meta } = response.data.data || {};

    const mappedItems: Patient[] = items.map((patient: any) => ({
      id: patient.id,
      email: patient.email,
      firstName: patient.first_name,
      lastName: patient.last_name,
      role: 'patient',
      status: 'active',
      createdAt: patient.created_at,
      updatedAt: patient.updated_at,
      lastLogin: undefined,
      profile: undefined,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      address: typeof patient.address === 'string' ? safeParseJSON(patient.address) : patient.address,
      insurance: patient.insurance_provider ? {
        provider: patient.insurance_provider,
        number: patient.insurance_number,
        startDate: patient.insurance_start_date,
        expiryDate: patient.insurance_expiry_date,
      } : null,
      bloodType: patient.blood_type,
      medicalHistory: patient.medical_history,
      allergies: patient.allergies,
    }));

    return {
      items: mappedItems,
      meta: normalizeMeta(meta, mappedItems.length)
    };
  },

  // Appointments Management
  async getAppointments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    doctorId?: string;
    patientId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaginatedResponse<Appointment>> {
    const response = await api.get('/admin/appointments', { params });
    const { items = [], meta } = response.data.data || {};

    const mappedItems: Appointment[] = items.map((appointment: any) => ({
      id: appointment.id,
      patientId: appointment.patient_id,
      doctorId: appointment.doctor_id,
      patient: {
        id: appointment.patient_id,
        email: appointment.patient_email,
        firstName: appointment.patient_first_name,
        lastName: appointment.patient_last_name,
        role: 'patient',
        status: 'active',
        createdAt: '',
        dateOfBirth: '',
        gender: '',
        phone: appointment.patient_phone,
      } as any,
      doctor: {
        id: appointment.doctor_id,
        email: appointment.doctor_email,
        firstName: appointment.doctor_first_name,
        lastName: appointment.doctor_last_name,
        role: 'doctor',
        status: 'active',
        createdAt: '',
        specialty: appointment.doctor_specialty,
        licenseNumber: '',
        experienceYears: 0,
        consultationFee: Number(appointment.doctor_consultation_fee || 0),
        rating: 0,
        totalPatients: 0,
        isVerified: true,
      } as any,
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      status: appointment.status,
      type: appointment.type,
      notes: appointment.notes || undefined,
      location: appointment.location || undefined,
      meetingLink: appointment.meeting_link || undefined,
      paymentStatus: appointment.payment_status || undefined,
      paymentReference: appointment.payment_reference || undefined,
      amount: appointment.amount ? Number(appointment.amount) : undefined,
      createdAt: appointment.created_at,
      updatedAt: appointment.updated_at,
    }));

    return {
      items: mappedItems,
      meta: normalizeMeta(meta, mappedItems.length)
    };
  },

  async updateAppointmentStatus(id: string, status: string): Promise<void> {
    await api.patch(`/admin/appointments/${id}/status`, { status });
  },

  async cancelAppointment(id: string, reason: string): Promise<void> {
    await api.patch(`/admin/appointments/${id}/cancel`, { reason });
  },

  // Analytics
  async getRevenueAnalytics(period: '7d' | '30d' | '90d' | '1y'): Promise<any> {
    const response = await api.get(`/admin/analytics/revenue?period=${period}`);
    return response.data.data;
  },

  async getUserAnalytics(period: '7d' | '30d' | '90d' | '1y'): Promise<any> {
    const response = await api.get(`/admin/analytics/users?period=${period}`);
    return response.data.data;
  },

  async getAppointmentAnalytics(period: '7d' | '30d' | '90d' | '1y'): Promise<any> {
    const response = await api.get(`/admin/analytics/appointments?period=${period}`);
    return response.data.data;
  },

  // Lab Centers
  async getLabCenters(params?: any): Promise<PaginatedResponse<LabCenter>> {
    const response = await api.get('/admin/labs', { params });
    const { items = [], meta } = response.data.data || {};

    const mappedItems: LabCenter[] = items.map((lab: any) => ({
      id: lab.id,
      name: lab.name,
      description: lab.description || undefined,
      address: typeof lab.address === 'string' ? safeParseJSON(lab.address) : lab.address,
      city: lab.city || undefined,
      region: lab.region || undefined,
      country: lab.country || undefined,
      latitude: lab.latitude !== null ? Number(lab.latitude) : null,
      longitude: lab.longitude !== null ? Number(lab.longitude) : null,
      phone: lab.phone || undefined,
      email: lab.email || undefined,
      website: lab.website || undefined,
      services: toStringArray(lab.services),
      operatingHours: typeof lab.operating_hours === 'string' ? safeParseJSON(lab.operating_hours) : lab.operating_hours,
      coverageRadiusKm: lab.coverage_radius_km !== null ? Number(lab.coverage_radius_km) : undefined,
      isActive: Boolean(lab.is_active),
      rating: lab.rating !== null ? Number(lab.rating) : null,
      totalReviews: lab.total_reviews !== null ? Number(lab.total_reviews) : undefined,
      createdAt: lab.created_at,
      updatedAt: lab.updated_at,
    }));

    return {
      items: mappedItems,
      meta: normalizeMeta(meta, mappedItems.length)
    };
  },

  async createLabCenter(payload: Partial<LabCenter>): Promise<LabCenter> {
    const response = await api.post('/admin/labs', payload);
    return mapLabCenter(response.data.data);
  },

  async updateLabCenter(id: string, payload: Partial<LabCenter>): Promise<LabCenter> {
    const response = await api.put(`/admin/labs/${id}`, payload);
    return mapLabCenter(response.data.data);
  },

  async deleteLabCenter(id: string): Promise<void> {
    await api.delete(`/admin/labs/${id}`);
  },

  // Partner Pharmacies
  async getPartnerPharmacies(params?: any): Promise<PaginatedResponse<PartnerPharmacy>> {
    const response = await api.get('/admin/pharmacies', { params });
    const { items = [], meta } = response.data.data || {};

    const mappedItems = items.map(mapPharmacy);

    return {
      items: mappedItems,
      meta: normalizeMeta(meta, mappedItems.length)
    };
  },

  async createPartnerPharmacy(payload: Partial<PartnerPharmacy>): Promise<PartnerPharmacy> {
    const response = await api.post('/admin/pharmacies', payload);
    return mapPharmacy(response.data.data);
  },

  async updatePartnerPharmacy(id: string, payload: Partial<PartnerPharmacy>): Promise<PartnerPharmacy> {
    const response = await api.put(`/admin/pharmacies/${id}`, payload);
    return mapPharmacy(response.data.data);
  },

  async deletePartnerPharmacy(id: string): Promise<void> {
    await api.delete(`/admin/pharmacies/${id}`);
  },

  // Insurance Partners
  async getInsurancePartners(params?: any): Promise<PaginatedResponse<InsurancePartner>> {
    const response = await api.get('/admin/insurance-partners', { params });
    const { items = [], meta } = response.data.data || {};

    const mappedItems = items.map(mapInsurancePartner);

    return {
      items: mappedItems,
      meta: normalizeMeta(meta, mappedItems.length)
    };
  },

  async createInsurancePartner(payload: Partial<InsurancePartner>): Promise<InsurancePartner> {
    const response = await api.post('/admin/insurance-partners', payload);
    return mapInsurancePartner(response.data.data);
  },

  async updateInsurancePartner(id: string, payload: Partial<InsurancePartner>): Promise<InsurancePartner> {
    const response = await api.put(`/admin/insurance-partners/${id}`, payload);
    return mapInsurancePartner(response.data.data);
  },

  async deleteInsurancePartner(id: string): Promise<void> {
    await api.delete(`/admin/insurance-partners/${id}`);
  }
};

// Helper utilities
const safeParseJSON = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const toStringArray = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const parsed = safeParseJSON(trimmed.replace(/'/g, '"'));
      return Array.isArray(parsed) ? parsed : [];
    }
    return trimmed.split(',').map((item) => item.replace(/"/g, '').trim()).filter(Boolean);
  }
  return [];
};

const normalizeMeta = (meta: any, defaultCount: number): PaginationMeta => ({
  total: meta?.total ?? defaultCount,
  page: meta?.page ?? 1,
  limit: meta?.limit ?? defaultCount,
  totalPages: meta?.totalPages ?? 1,
});

const mapLabCenter = (lab: any): LabCenter => ({
  id: lab.id,
  name: lab.name,
  description: lab.description || undefined,
  address: typeof lab.address === 'string' ? safeParseJSON(lab.address) : lab.address,
  city: lab.city || undefined,
  region: lab.region || undefined,
  country: lab.country || undefined,
  latitude: lab.latitude !== null ? Number(lab.latitude) : null,
  longitude: lab.longitude !== null ? Number(lab.longitude) : null,
  phone: lab.phone || undefined,
  email: lab.email || undefined,
  website: lab.website || undefined,
  services: toStringArray(lab.services),
  operatingHours: typeof lab.operating_hours === 'string' ? safeParseJSON(lab.operating_hours) : lab.operating_hours,
  coverageRadiusKm: lab.coverage_radius_km !== null ? Number(lab.coverage_radius_km) : undefined,
  isActive: Boolean(lab.is_active),
  rating: lab.rating !== null ? Number(lab.rating) : null,
  totalReviews: lab.total_reviews !== null ? Number(lab.total_reviews) : undefined,
  createdAt: lab.created_at,
  updatedAt: lab.updated_at,
});

const mapPharmacy = (pharmacy: any): PartnerPharmacy => ({
  id: pharmacy.id,
  name: pharmacy.name,
  description: pharmacy.description || undefined,
  address: typeof pharmacy.address === 'string' ? safeParseJSON(pharmacy.address) : pharmacy.address,
  city: pharmacy.city || undefined,
  region: pharmacy.region || undefined,
  country: pharmacy.country || undefined,
  latitude: pharmacy.latitude !== null ? Number(pharmacy.latitude) : null,
  longitude: pharmacy.longitude !== null ? Number(pharmacy.longitude) : null,
  phone: pharmacy.phone || undefined,
  email: pharmacy.email || undefined,
  website: pharmacy.website || undefined,
  services: toStringArray(pharmacy.services),
  operatingHours: typeof pharmacy.operating_hours === 'string' ? safeParseJSON(pharmacy.operating_hours) : pharmacy.operating_hours,
  deliveryOptions: toStringArray(pharmacy.delivery_options),
  acceptsInsurance: Boolean(pharmacy.accepts_insurance),
  insuranceProviders: toStringArray(pharmacy.insurance_providers),
  coverageRadiusKm: pharmacy.coverage_radius_km !== null ? Number(pharmacy.coverage_radius_km) : undefined,
  isActive: Boolean(pharmacy.is_active),
  rating: pharmacy.rating !== null ? Number(pharmacy.rating) : null,
  totalReviews: pharmacy.total_reviews !== null ? Number(pharmacy.total_reviews) : undefined,
  createdAt: pharmacy.created_at,
  updatedAt: pharmacy.updated_at,
});

const mapInsurancePartner = (partner: any): InsurancePartner => ({
  id: partner.id,
  name: partner.name,
  description: partner.description || undefined,
  logoUrl: partner.logo_url || undefined,
  coverageAreas: toStringArray(partner.coverage_areas),
  contactPerson: typeof partner.contact_person === 'string' ? safeParseJSON(partner.contact_person) : partner.contact_person,
  phone: partner.phone || undefined,
  email: partner.email || undefined,
  website: partner.website || undefined,
  plans: typeof partner.plans === 'string' ? safeParseJSON(partner.plans) : partner.plans,
  isActive: Boolean(partner.is_active),
  createdAt: partner.created_at,
  updatedAt: partner.updated_at,
});
