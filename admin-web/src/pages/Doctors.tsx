import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Search,
  FilterList,
  Add,
  Refresh,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchDoctorsAction, updateUserStatusAction, verifyDoctorAction, rejectDoctorAction } from '../store/slices/usersSlice';
import DoctorCard from '../components/doctors/DoctorCard';
import DoctorDetailsModal from '../components/doctors/DoctorDetailsModal';
import { Doctor } from '../services/admin';

const Doctors: React.FC = () => {
  const dispatch = useAppDispatch();
  const { doctors, doctorsMeta, loading, error } = useAppSelector((state) => state.users);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    dispatch(fetchDoctorsAction({}));
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(fetchDoctorsAction({
      search: searchTerm,
      specialty: specialtyFilter,
      status: statusFilter,
    }));
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSpecialtyFilter('');
    setStatusFilter('');
    dispatch(fetchDoctorsAction({}));
  };

  const handleVerifyDoctor = async (id: string) => {
    try {
      await dispatch(verifyDoctorAction(id)).unwrap();
      setSnackbarMessage('Doctor verified successfully');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to verify doctor');
      setSnackbarOpen(true);
    }
  };

  const handleRejectDoctor = async (id: string, reason: string) => {
    try {
      await dispatch(rejectDoctorAction({ id, reason })).unwrap();
      setSnackbarMessage('Doctor verification rejected');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to reject doctor');
      setSnackbarOpen(true);
    }
  };

  const handleSuspendDoctor = async (id: string) => {
    try {
      await dispatch(updateUserStatusAction({ id, status: 'suspended' })).unwrap();
      setSnackbarMessage('Doctor account suspended');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to suspend doctor');
      setSnackbarOpen(true);
    }
  };

  const handleViewDoctor = (id: string) => {
    const doctor = doctors.find(d => d.id === id);
    if (doctor) {
      setSelectedDoctor(doctor as Doctor);
      setDetailsModalOpen(true);
    }
  };

  const handleEditDoctor = (id: string) => {
    // Navigate to edit doctor page or open edit modal
    console.log('Edit doctor:', id);
  };

  const specialties = [
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery',
  ];

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending', label: 'Pending' },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Doctors Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => console.log('Add new doctor')}
        >
          Add Doctor
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Search doctors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Specialty</InputLabel>
                <Select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  label="Specialty"
                >
                  <MenuItem value="">All Specialties</MenuItem>
                  {specialties.map((specialty) => (
                    <MenuItem key={specialty} value={specialty}>
                      {specialty}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {statuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  startIcon={<FilterList />}
                  fullWidth
                >
                  Filter
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleRefresh}
                  startIcon={<Refresh />}
                >
                  Reset
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Doctors
              </Typography>
              <Typography variant="h4">
                {doctorsMeta?.total ?? doctors.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Verified
              </Typography>
              <Typography variant="h4" color="success.main">
                {doctors.filter(d => d.isVerified).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending Verification
              </Typography>
              <Typography variant="h4" color="warning.main">
                {doctors.filter(d => !d.isVerified).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4" color="primary.main">
                {doctors.filter(d => d.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Doctors Grid */}
          <Grid container spacing={3}>
            {doctors.map((doctor) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doctor.id}>
                <DoctorCard
                  doctor={doctor as Doctor}
                  onVerify={handleVerifyDoctor}
                  onReject={handleRejectDoctor}
                  onSuspend={handleSuspendDoctor}
                  onView={handleViewDoctor}
                  onEdit={handleEditDoctor}
                />
              </Grid>
            ))}
          </Grid>

          {/* Empty State */}
          {doctors.length === 0 && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No doctors found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search criteria or add a new doctor.
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Doctor Details Modal */}
      <DoctorDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        doctor={selectedDoctor}
        onVerify={handleVerifyDoctor}
        onSuspend={handleSuspendDoctor}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default Doctors;