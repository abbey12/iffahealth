import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  LocalHospital,
  Person,
  School,
  Work,
  Star,
  Schedule,
  CheckCircle,
  Cancel,
  Language,
  LocationOn,
  Phone,
  Email,
} from '@mui/icons-material';
import { Doctor } from '../../services/admin';

interface DoctorDetailsModalProps {
  open: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onVerify: (id: string) => void;
  onSuspend: (id: string) => void;
}

const DoctorDetailsModal: React.FC<DoctorDetailsModalProps> = ({
  open,
  onClose,
  doctor,
  onVerify,
  onSuspend,
}) => {
  if (!doctor) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'suspended':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 50, height: 50 }}>
            <LocalHospital />
          </Avatar>
          <Box>
            <Typography variant="h5" component="div">
              Dr. {doctor.firstName} {doctor.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {doctor.specialty}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body1">
                  <strong>Full Name:</strong> {doctor.firstName} {doctor.lastName}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {doctor.email}
                </Typography>
                <Typography variant="body1">
                  <strong>Phone:</strong> {doctor.phone || 'Not provided'}
                </Typography>
                <Typography variant="body1">
                  <strong>Gender:</strong> {doctor.gender}
                </Typography>
                <Typography variant="body1">
                  <strong>Date of Birth:</strong> {doctor.dateOfBirth}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* Professional Information */}
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Professional Information
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body1">
                  <strong>Specialty:</strong> {doctor.specialty}
                </Typography>
                <Typography variant="body1">
                  <strong>Years of Experience:</strong> {doctor.experienceYears} years
                </Typography>
                <Typography variant="body1">
                  <strong>Consultation Fee:</strong> GHC {doctor.consultationFee}
                </Typography>
                <Typography variant="body1">
                  <strong>Hospital:</strong> {doctor.hospitalAffiliation || 'Not specified'}
                </Typography>
                <Typography variant="body1">
                  <strong>License Number:</strong> {doctor.licenseNumber}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* Status and Verification */}
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Status & Verification
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={doctor.status?.toUpperCase() || 'ACTIVE'}
                  color={doctor.status === 'suspended' ? 'warning' : 'success'}
                />
                <Chip
                  label={doctor.isVerified ? 'Verified' : 'Not Verified'}
                  color={doctor.isVerified ? 'primary' : 'default'}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Joined on {new Date(doctor.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated {new Date(doctor.updatedAt).toLocaleDateString()}
              </Typography>
            </Paper>
          </Grid>

          {/* Performance Metrics */}
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body1">
                  <strong>Average Rating:</strong> {doctor.rating ? doctor.rating.toFixed(1) : 'N/A'}
                </Typography>
                <Typography variant="body1">
                  <strong>Total Reviews:</strong> {doctor.reviewCount || 0}
                </Typography>
                <Typography variant="body1">
                  <strong>Total Patients:</strong> {doctor.totalPatients || 0}
                </Typography>
                <Typography variant="body1">
                  <strong>Completed Appointments:</strong> {doctor.completedAppointments || 0}
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          {/* Languages */}
          {doctor.languages && doctor.languages.length > 0 && (
            <Grid size={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Languages
                </Typography>
                <Stack direction="row" spacing={1}>
                  {doctor.languages.map((language) => (
                    <Chip key={language} label={language} color="primary" variant="outlined" />
                  ))}
                </Stack>
              </Paper>
            </Grid>
          )}

          {/* Bio */}
          {doctor.bio && (
            <Grid size={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Biography
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {doctor.bio}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {!doctor.isVerified && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => {
              onVerify(doctor.id);
              onClose();
            }}
          >
            Verify Doctor
          </Button>
        )}
        <Button
          variant="outlined"
          color="error"
          startIcon={<Cancel />}
          onClick={() => {
            onSuspend(doctor.id);
            onClose();
          }}
        >
          Suspend Account
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DoctorDetailsModal;
