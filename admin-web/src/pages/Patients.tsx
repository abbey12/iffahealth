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
  Tabs,
  Tab,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Search,
  FilterList,
  Add,
  Refresh,
  Download,
  Person,
  CalendarToday,
  MedicalServices,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchPatientsAction, updateUserStatusAction } from '../store/slices/usersSlice';
import PatientCard from '../components/patients/PatientCard';
import { Patient } from '../services/admin';

const Patients: React.FC = () => {
  const dispatch = useAppDispatch();
  const { patients, patientsMeta, loading, error } = useAppSelector((state) => state.users);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    dispatch(fetchPatientsAction({}));
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(fetchPatientsAction({
      search: searchTerm,
      status: statusFilter,
    }));
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setStatusFilter('');
    setAgeFilter('');
    dispatch(fetchPatientsAction({}));
  };

  const handleSuspendPatient = async (id: string) => {
    try {
      await dispatch(updateUserStatusAction({ id, status: 'suspended' })).unwrap();
      setSnackbarMessage('Patient account suspended');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to suspend patient');
      setSnackbarOpen(true);
    }
  };

  const handleViewPatient = (id: string) => {
    const patient = patients.find(p => p.id === id);
    if (patient) {
      setSelectedPatient(patient as Patient);
      setDetailsModalOpen(true);
    }
  };

  const handleEditPatient = (id: string) => {
    // Navigate to edit patient page or open edit modal
    console.log('Edit patient:', id);
  };

  const handleExportData = () => {
    // Export patient data functionality
    setSnackbarMessage('Patient data export started');
    setSnackbarOpen(true);
  };

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
  ];

  const ageRanges = [
    { value: '0-18', label: '0-18 years' },
    { value: '19-35', label: '19-35 years' },
    { value: '36-50', label: '36-50 years' },
    { value: '51-65', label: '51-65 years' },
    { value: '65+', label: '65+ years' },
  ];

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const filteredPatients = patients.filter(patient => {
    if (ageFilter) {
      const age = calculateAge(patient.dateOfBirth);
      const [min, max] = ageFilter.split('-').map(Number);
      if (ageFilter === '65+') {
        if (age < 65) return false;
      } else if (age < min || age > max) {
        return false;
      }
    }
    return true;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Patients Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportData}
          >
            Export Data
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => console.log('Add new patient')}
          >
            Add Patient
          </Button>
        </Box>
      </Box>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="All Patients" />
          <Tab label="Active Patients" />
          <Tab label="New Patients" />
          <Tab label="Suspended" />
        </Tabs>
      </Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid
              size={{
                xs: 12,
                md: 4
              }}>
              <TextField
                fullWidth
                label="Search patients"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
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
            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <FormControl fullWidth>
                <InputLabel>Age Range</InputLabel>
                <Select
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  label="Age Range"
                >
                  <MenuItem value="">All Ages</MenuItem>
                  {ageRanges.map((range) => (
                    <MenuItem key={range.value} value={range.value}>
                      {range.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid
              size={{
                xs: 12,
                md: 2
              }}>
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
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Patients
              </Typography>
              <Typography variant="h4">
              {patientsMeta?.total ?? patients.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4" color="success.main">
                {patients.filter(p => p.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                New This Month
              </Typography>
              <Typography variant="h4" color="primary.main">
                {patients.filter(p => {
                  const createdDate = new Date(p.createdAt);
                  const thisMonth = new Date();
                  thisMonth.setDate(1);
                  return createdDate >= thisMonth;
                }).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                With Insurance
              </Typography>
              <Typography variant="h4" color="info.main">
                {patients.filter(p => p.insurance && p.insurance.provider).length}
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
          {/* Patients Grid */}
          <Grid container spacing={3}>
            {filteredPatients.map((patient) => (
              <Grid
                key={patient.id}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4
                }}>
                <PatientCard
                  patient={patient as Patient}
                  onView={handleViewPatient}
                  onEdit={handleEditPatient}
                  onSuspend={handleSuspendPatient}
                />
              </Grid>
            ))}
          </Grid>

          {/* Empty State */}
          {filteredPatients.length === 0 && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No patients found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search criteria or add a new patient.
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}
      {/* Patient Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Person sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" component="div">
                {selectedPatient?.firstName} {selectedPatient?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Patient Details
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Grid container spacing={3}>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Email:</strong> {selectedPatient.email}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Phone:</strong> {selectedPatient.phone || 'Not provided'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Date of Birth:</strong> {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Gender:</strong> {selectedPatient.gender}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Age:</strong> {calculateAge(selectedPatient.dateOfBirth)} years
                </Typography>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Typography variant="h6" gutterBottom>
                  Address & Insurance
                </Typography>
                {selectedPatient.address && (
                  <>
                    <Typography variant="body2" gutterBottom>
                      <strong>Address:</strong> {selectedPatient.address.streetAddress || 'Not provided'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>City:</strong> {selectedPatient.address.city || 'Not provided'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Country:</strong> {selectedPatient.address.country || 'Not provided'}
                    </Typography>
                  </>
                )}
                {selectedPatient.insurance && (
                  <>
                    <Typography variant="body2" gutterBottom>
                      <strong>Insurance Provider:</strong> {selectedPatient.insurance.provider || 'Not specified'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Policy Number:</strong> {selectedPatient.insurance.policyNumber || 'Not provided'}
                    </Typography>
                  </>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedPatient) {
                handleEditPatient(selectedPatient.id);
                setDetailsModalOpen(false);
              }
            }}
          >
            Edit Patient
          </Button>
        </DialogActions>
      </Dialog>
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

export default Patients;
