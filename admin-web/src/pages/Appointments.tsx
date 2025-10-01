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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Search,
  FilterList,
  Add,
  Refresh,
  Download,
  CalendarToday,
  Schedule,
  CheckCircle,
  Cancel,
  Visibility,
  Edit,
} from '@mui/icons-material';
import AppointmentCard from '../components/appointments/AppointmentCard';
import { Appointment, adminService, PaginationMeta } from '../services/admin';
import { formatAppointmentDateTime } from '../utils/dateUtils';

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const loadAppointments = async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getAppointments(filters);
      setAppointments(response.items || []);
      setPagination(response.meta || null);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load appointments');
      setAppointments([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleSearch = () => {
    loadAppointments({
      search: searchTerm,
      status: statusFilter,
      doctorId: doctorFilter,
      date: dateFilter,
    });
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDoctorFilter('');
    setDateFilter('');
    loadAppointments();
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      setSnackbarMessage('Appointment cancelled');
      setSnackbarOpen(true);
      await adminService.cancelAppointment(id, 'Cancelled by admin');
      loadAppointments({
        search: searchTerm,
        status: statusFilter,
        doctorId: doctorFilter,
        date: dateFilter,
      });
    } catch (error) {
      setSnackbarMessage('Failed to cancel appointment');
      setSnackbarOpen(true);
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    try {
      setSnackbarMessage('Appointment marked as complete');
      setSnackbarOpen(true);
      await adminService.updateAppointmentStatus(id, 'completed');
      loadAppointments({
        search: searchTerm,
        status: statusFilter,
        doctorId: doctorFilter,
        date: dateFilter,
      });
    } catch (error) {
      setSnackbarMessage('Failed to complete appointment');
      setSnackbarOpen(true);
    }
  };

  const handleViewAppointment = (id: string) => {
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setDetailsModalOpen(true);
    }
  };

  const handleEditAppointment = (id: string) => {
    console.log('Edit appointment:', id);
  };

  const handleExportData = () => {
    setSnackbarMessage('Appointment data export started');
    setSnackbarOpen(true);
    loadAppointments({
      search: searchTerm,
      status: statusFilter,
      doctorId: doctorFilter,
      date: dateFilter,
    });
  };

  const statuses = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No Show' },
  ];

  const appointmentTypes = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'emergency', label: 'Emergency' },
  ];

  const filteredAppointments = appointments.filter(appointment => {
    if (statusFilter && appointment.status !== statusFilter) return false;
    if (doctorFilter && appointment.doctorId !== doctorFilter) return false;
    if (dateFilter && appointment.date !== dateFilter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        appointment.patient.firstName.toLowerCase().includes(searchLower) ||
        appointment.patient.lastName.toLowerCase().includes(searchLower) ||
        appointment.doctor.firstName.toLowerCase().includes(searchLower) ||
        appointment.doctor.lastName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusCount = (status: string) => {
    return appointments.filter(a => a.status === status).length;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Appointments Management
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
            onClick={() => console.log('Add new appointment')}
          >
            Schedule Appointment
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="All Appointments" />
          <Tab label="Scheduled" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
        </Tabs>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Search appointments"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All statuses</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Doctor</InputLabel>
                <Select
                  label="Doctor"
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                >
                  <MenuItem value="">All doctors</MenuItem>
                  {/* Options populated dynamically in future */}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
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
                Total Appointments
              </Typography>
              <Typography variant="h4">
                {appointments.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Scheduled
              </Typography>
              <Typography variant="h4" color="primary.main">
                {getStatusCount('scheduled')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">
                {getStatusCount('completed')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Cancelled
              </Typography>
              <Typography variant="h4" color="error.main">
                {getStatusCount('cancelled')}
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
          {/* Appointments Display */}
          {viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {filteredAppointments.map((appointment) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={appointment.id}>
                  <AppointmentCard
                    appointment={appointment}
                    onView={handleViewAppointment}
                    onEdit={handleEditAppointment}
                    onCancel={handleCancelAppointment}
                    onComplete={handleCompleteAppointment}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </TableCell>
                      <TableCell>
                        Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </TableCell>
                      <TableCell>
                        {formatAppointmentDateTime(appointment.date, appointment.time)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={appointment.type}
                          color="info"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={appointment.status}
                          color={
                            appointment.status === 'scheduled' ? 'primary' :
                            appointment.status === 'completed' ? 'success' :
                            appointment.status === 'cancelled' ? 'error' : 'warning'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleViewAppointment(appointment.id)}>
                          <Visibility />
                        </IconButton>
                        {appointment.status === 'scheduled' && (
                          <IconButton onClick={() => handleEditAppointment(appointment.id)}>
                            <Edit />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Empty State */}
          {filteredAppointments.length === 0 && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No appointments found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search criteria or schedule a new appointment.
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Appointment Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <CalendarToday sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" component="div">
                Appointment Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAppointment?.patient.firstName} {selectedAppointment?.patient.lastName}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>
                  Patient Information
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Name:</strong> {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Email:</strong> {selectedAppointment.patient.email}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Phone:</strong> {selectedAppointment.patient.phone}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>
                  Doctor Information
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Name:</strong> Dr. {selectedAppointment.doctor.firstName} {selectedAppointment.doctor.lastName}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Specialty:</strong> {selectedAppointment.doctor.specialty}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Email:</strong> {selectedAppointment.doctor.email}
                </Typography>
              </Grid>
                <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Appointment Details
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Date & Time:</strong> {formatAppointmentDateTime(selectedAppointment.date, selectedAppointment.time)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Type:</strong> {selectedAppointment.type}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Status:</strong> {selectedAppointment.status}
                </Typography>
                {selectedAppointment.notes && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Notes:</strong> {selectedAppointment.notes}
                  </Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
          {selectedAppointment?.status === 'scheduled' && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  handleCancelAppointment(selectedAppointment.id);
                  setDetailsModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  handleCompleteAppointment(selectedAppointment.id);
                  setDetailsModalOpen(false);
                }}
              >
                Mark Complete
              </Button>
            </>
          )}
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

export default Appointments;
