import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  TrendingUp,
  TrendingDown,
  People,
  LocalHospital,
  Event,
  AttachMoney,
  Download,
  Refresh,
} from '@mui/icons-material';
import RevenueChart from './RevenueChart';
import UserAnalyticsChart from './UserAnalyticsChart';
import AppointmentAnalyticsChart from './AppointmentAnalyticsChart';

interface AnalyticsDashboardProps {
  onExportData: () => void;
  onRefresh: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onExportData, onRefresh }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - replace with actual API calls
  const [revenueData, setRevenueData] = useState([
    { date: '2024-01-01', revenue: 12000, appointments: 45 },
    { date: '2024-01-02', revenue: 15000, appointments: 52 },
    { date: '2024-01-03', revenue: 18000, appointments: 61 },
    { date: '2024-01-04', revenue: 14000, appointments: 48 },
    { date: '2024-01-05', revenue: 16000, appointments: 55 },
    { date: '2024-01-06', revenue: 20000, appointments: 68 },
    { date: '2024-01-07', revenue: 22000, appointments: 72 },
  ]);

  const [userData, setUserData] = useState([
    { date: '2024-01-01', totalUsers: 150, doctors: 25, patients: 125, newUsers: 5 },
    { date: '2024-01-02', totalUsers: 165, doctors: 28, patients: 137, newUsers: 8 },
    { date: '2024-01-03', totalUsers: 180, doctors: 30, patients: 150, newUsers: 12 },
    { date: '2024-01-04', totalUsers: 195, doctors: 32, patients: 163, newUsers: 10 },
    { date: '2024-01-05', totalUsers: 210, doctors: 35, patients: 175, newUsers: 15 },
    { date: '2024-01-06', totalUsers: 225, doctors: 38, patients: 187, newUsers: 18 },
    { date: '2024-01-07', totalUsers: 240, doctors: 40, patients: 200, newUsers: 20 },
  ]);

  const [appointmentData, setAppointmentData] = useState([
    { date: '2024-01-01', totalAppointments: 45, scheduled: 20, completed: 20, cancelled: 5 },
    { date: '2024-01-02', totalAppointments: 52, scheduled: 25, completed: 22, cancelled: 5 },
    { date: '2024-01-03', totalAppointments: 61, scheduled: 30, completed: 26, cancelled: 5 },
    { date: '2024-01-04', totalAppointments: 48, scheduled: 22, completed: 21, cancelled: 5 },
    { date: '2024-01-05', totalAppointments: 55, scheduled: 28, completed: 22, cancelled: 5 },
    { date: '2024-01-06', totalAppointments: 68, scheduled: 35, completed: 28, cancelled: 5 },
    { date: '2024-01-07', totalAppointments: 72, scheduled: 38, completed: 29, cancelled: 5 },
  ]);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real implementation, fetch data based on selectedPeriod
      setLoading(false);
    } catch (err) {
      setError('Failed to load analytics data');
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const handleRefresh = () => {
    loadAnalyticsData();
    onRefresh();
  };

  const handleExportData = () => {
    onExportData();
  };

  // Calculate key metrics
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalUsers = userData[userData.length - 1]?.totalUsers || 0;
  const totalAppointments = appointmentData.reduce((sum, item) => sum + item.totalAppointments, 0);
  const completedAppointments = appointmentData.reduce((sum, item) => sum + item.completed, 0);
  const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

  // Calculate growth rates
  const revenueGrowth = revenueData.length > 1 
    ? ((revenueData[revenueData.length - 1].revenue - revenueData[0].revenue) / revenueData[0].revenue) * 100 
    : 0;
  const userGrowth = userData.length > 1 
    ? ((userData[userData.length - 1].totalUsers - userData[0].totalUsers) / userData[0].totalUsers) * 100 
    : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Analytics Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              label="Time Period"
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportData}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" component="div">
                    GHC {totalRevenue.toLocaleString()}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    {revenueGrowth > 0 ? (
                      <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                    ) : (
                      <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                    )}
                    <Typography
                      variant="body2"
                      color={revenueGrowth > 0 ? 'success.main' : 'error.main'}
                    >
                      {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {totalUsers.toLocaleString()}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    {userGrowth > 0 ? (
                      <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                    ) : (
                      <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                    )}
                    <Typography
                      variant="body2"
                      color={userGrowth > 0 ? 'success.main' : 'error.main'}
                    >
                      {userGrowth > 0 ? '+' : ''}{userGrowth.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                <People sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Appointments
                  </Typography>
                  <Typography variant="h4" component="div">
                    {totalAppointments.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {completedAppointments} completed
                  </Typography>
                </Box>
                <Event sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h4" component="div">
                    {completionRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Appointment completion
                  </Typography>
                </Box>
                <LocalHospital sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <RevenueChart
            data={revenueData}
            period={selectedPeriod}
            onPeriodChange={handlePeriodChange}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Metrics
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Chip
                  label={`Total Revenue: GHC ${totalRevenue.toLocaleString()}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Total Users: ${totalUsers.toLocaleString()}`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={`Total Appointments: ${totalAppointments.toLocaleString()}`}
                  color="info"
                  variant="outlined"
                />
                <Chip
                  label={`Completion Rate: ${completionRate.toFixed(1)}%`}
                  color="warning"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <UserAnalyticsChart
            data={userData}
            period={selectedPeriod}
            onPeriodChange={handlePeriodChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <AppointmentAnalyticsChart
            data={appointmentData}
            period={selectedPeriod}
            onPeriodChange={handlePeriodChange}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
