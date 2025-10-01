import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  adminService,
  Doctor,
  Patient,
  LabCenter,
  PartnerPharmacy,
  InsurancePartner,
  PaginatedResponse,
  PaginationMeta
} from '../../services/admin';

interface UsersState {
  doctors: Doctor[];
  patients: Patient[];
  labCenters: LabCenter[];
  partnerPharmacies: PartnerPharmacy[];
  insurancePartners: InsurancePartner[];
  doctorsMeta: PaginationMeta | null;
  patientsMeta: PaginationMeta | null;
  labCentersMeta: PaginationMeta | null;
  partnerPharmaciesMeta: PaginationMeta | null;
  insurancePartnersMeta: PaginationMeta | null;
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  doctors: [],
  patients: [],
  labCenters: [],
  partnerPharmacies: [],
  insurancePartners: [],
  doctorsMeta: null,
  patientsMeta: null,
  labCentersMeta: null,
  partnerPharmaciesMeta: null,
  insurancePartnersMeta: null,
  loading: false,
  error: null,
};

export const fetchDoctorsAction = createAsyncThunk(
  'users/fetchDoctors',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const result = await adminService.getDoctors(filters);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchPatientsAction = createAsyncThunk(
  'users/fetchPatients',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const result = await adminService.getPatients(filters);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchLabCentersAction = createAsyncThunk(
  'users/fetchLabCenters',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      return await adminService.getLabCenters(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchPartnerPharmaciesAction = createAsyncThunk(
  'users/fetchPartnerPharmacies',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      return await adminService.getPartnerPharmacies(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchInsurancePartnersAction = createAsyncThunk(
  'users/fetchInsurancePartners',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      return await adminService.getInsurancePartners(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const verifyDoctorAction = createAsyncThunk(
  'users/verifyDoctor',
  async (id: string, { rejectWithValue }) => {
    try {
      await adminService.verifyDoctor(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const rejectDoctorAction = createAsyncThunk(
  'users/rejectDoctor',
  async ({ id, reason }: { id: string; reason: string }, { rejectWithValue }) => {
    try {
      await adminService.rejectDoctor(id, reason);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateUserStatusAction = createAsyncThunk(
  'users/updateUserStatus',
  async ({ id, status }: { id: string; status: 'active' | 'inactive' | 'suspended' }, { rejectWithValue }) => {
    try {
      await adminService.updateUserStatus(id, status);
      return { id, status };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctorsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = action.payload.items;
        state.doctorsMeta = action.payload.meta;
        state.error = null;
      })
      .addCase(fetchDoctorsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPatientsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.patients = action.payload.items;
        state.patientsMeta = action.payload.meta;
        state.error = null;
      })
      .addCase(fetchPatientsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchLabCentersAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLabCentersAction.fulfilled, (state, action: PayloadAction<PaginatedResponse<LabCenter>>) => {
        state.loading = false;
        state.labCenters = action.payload.items;
        state.labCentersMeta = action.payload.meta;
        state.error = null;
      })
      .addCase(fetchPartnerPharmaciesAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartnerPharmaciesAction.fulfilled, (state, action: PayloadAction<PaginatedResponse<PartnerPharmacy>>) => {
        state.loading = false;
        state.partnerPharmacies = action.payload.items;
        state.partnerPharmaciesMeta = action.payload.meta;
        state.error = null;
      })
      .addCase(fetchInsurancePartnersAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInsurancePartnersAction.fulfilled, (state, action: PayloadAction<PaginatedResponse<InsurancePartner>>) => {
        state.loading = false;
        state.insurancePartners = action.payload.items;
        state.insurancePartnersMeta = action.payload.meta;
        state.error = null;
      })
      .addCase(updateUserStatusAction.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        state.doctors = state.doctors.map((doctor) =>
          doctor.id === id ? { ...doctor, status } : doctor
        );
        state.patients = state.patients.map((patient) =>
          patient.id === id ? { ...patient, status } : patient
        );
      })
      .addCase(updateUserStatusAction.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(verifyDoctorAction.fulfilled, (state, action) => {
        const doctorId = action.payload;
        state.doctors = state.doctors.map((doctor) =>
          doctor.id === doctorId ? { ...doctor, isVerified: true } : doctor
        );
      })
      .addCase(rejectDoctorAction.fulfilled, (state, action) => {
        const doctorId = action.payload;
        state.doctors = state.doctors.map((doctor) =>
          doctor.id === doctorId ? { ...doctor, isVerified: false } : doctor
        );
      });
  },
});

export default usersSlice.reducer;