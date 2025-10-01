import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  People,
  LocalHospital,
  Person,
  Event,
  AttachMoney,
  TrendingUp,
  Science,
  LocalPharmacy,
  HealthAndSafety,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchDashboardStats } from '../store/slices/dashboardSlice';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="text.secondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography color="text.secondary" variant="body2">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: '50%',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, loading, error } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Dashboard Overview
      </Typography>
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={<People fontSize="large" htmlColor="#1976d2" />}
            color="rgba(25, 118, 210, 0.1)"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
          <StatCard
            title="Total Doctors"
            value={stats?.totalDoctors ?? 0}
            icon={<LocalHospital fontSize="large" htmlColor="#2e7d32" />}
            color="rgba(46, 125, 50, 0.1)"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
          <StatCard
            title="Total Patients"
            value={stats?.totalPatients ?? 0}
            icon={<Person fontSize="large" htmlColor="#ed6c02" />}
            color="rgba(237, 108, 2, 0.1)"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
          <StatCard
            title="Partner Lab Centers"
            value={stats?.totalLabCenters ?? 0}
            icon={<Science fontSize="large" htmlColor="#6a1b9a" />}
            color="rgba(106, 27, 154, 0.1)"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
          <StatCard
            title="Partner Pharmacies"
            value={stats?.totalPharmacies ?? 0}
            icon={<LocalPharmacy fontSize="large" htmlColor="#00838f" />}
            color="rgba(0, 131, 143, 0.1)"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
          <StatCard
            title="Insurance Partners"
            value={stats?.totalInsurancePartners ?? 0}
            icon={<HealthAndSafety fontSize="large" htmlColor="#c62828" />}
            color="rgba(198, 40, 40, 0.1)"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
          <StatCard
            title="Total Appointments"
            value={stats?.totalAppointments ?? 0}
            icon={<Event fontSize="large" htmlColor="#7b1fa2" />}
            color="rgba(123, 31, 162, 0.1)"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
          <StatCard
            title="Pending Appointments"
            value={stats?.pendingAppointments ?? 0}
            icon={<Event fontSize="large" htmlColor="#ff9800" />}
            color="rgba(255, 152, 0, 0.1)"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
          <StatCard
            title="Completed Appointments"
            value={stats?.completedAppointments ?? 0}
            icon={<Event fontSize="large" htmlColor="#43a047" />}
            color="rgba(67, 160, 71, 0.1)"
          />
        </Grid>
      </Grid>
      {/* Quick Actions */}
      <Box mt={4}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3
            }}>
            <Card sx={{ textAlign: 'center', p: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
              <CardContent>
                <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">Manage Users</Typography>
                <Typography variant="body2" color="text.secondary">
                  View and manage all users
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
            <Card sx={{ textAlign: 'center', p: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
              <CardContent>
                <LocalHospital sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">Verify Doctors</Typography>
                <Typography variant="body2" color="text.secondary">
                  Review doctor applications
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
            <Card sx={{ textAlign: 'center', p: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
              <CardContent>
                <Event sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">View Appointments</Typography>
                <Typography variant="body2" color="text.secondary">
                  Monitor all appointments
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
            <Card sx={{ textAlign: 'center', p: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
              <CardContent>
                <TrendingUp sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">View Analytics</Typography>
                <Typography variant="body2" color="text.secondary">
                  Check platform analytics
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
