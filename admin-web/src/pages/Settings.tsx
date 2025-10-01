import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Settings as SettingsIcon,
  Security,
  Notifications,
  Payment,
  Storage,
  Api,
  Backup,
  Restore,
} from '@mui/icons-material';
import FinancialDashboard from '../components/financial/FinancialDashboard';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSave = () => {
    setSnackbarMessage('Settings saved successfully');
    setSnackbarOpen(true);
  };

  const handleBackup = () => {
    setSnackbarMessage('Database backup started');
    setSnackbarOpen(true);
  };

  const handleRestore = () => {
    setSnackbarMessage('Database restore initiated');
    setSnackbarOpen(true);
  };

  const renderGeneralSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          General Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              fullWidth
              label="Platform Name"
              defaultValue="IFFA Health"
              variant="outlined"
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              fullWidth
              label="Platform URL"
              defaultValue="https://iffahealth.com"
              variant="outlined"
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              fullWidth
              label="Support Email"
              defaultValue="support@iffahealth.com"
              variant="outlined"
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              fullWidth
              label="Contact Phone"
              defaultValue="+1 (555) 123-4567"
              variant="outlined"
            />
          </Grid>
          <Grid size={12}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable user registration"
            />
          </Grid>
          <Grid size={12}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable email notifications"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderSecuritySettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Security Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <FormControl fullWidth>
              <InputLabel>Password Policy</InputLabel>
              <Select defaultValue="strong">
                <MenuItem value="weak">Weak (6+ characters)</MenuItem>
                <MenuItem value="medium">Medium (8+ characters, mixed case)</MenuItem>
                <MenuItem value="strong">Strong (12+ characters, special chars)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              fullWidth
              label="Session Timeout (minutes)"
              type="number"
              defaultValue="30"
              variant="outlined"
            />
          </Grid>
          <Grid size={12}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable two-factor authentication"
            />
          </Grid>
          <Grid size={12}>
            <FormControlLabel
              control={<Switch />}
              label="Require email verification"
            />
          </Grid>
          <Grid size={12}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable login attempt monitoring"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid size={12}>
            <Typography variant="subtitle1" gutterBottom>
              Email Notifications
            </Typography>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="New user registrations"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Appointment bookings"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Payment confirmations"
            />
            <FormControlLabel
              control={<Switch />}
              label="System maintenance alerts"
            />
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle1" gutterBottom>
              SMS Notifications
            </Typography>
            <FormControlLabel
              control={<Switch />}
              label="Emergency alerts"
            />
            <FormControlLabel
              control={<Switch />}
              label="Appointment reminders"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderPaymentSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Payment Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              fullWidth
              label="Default Currency"
              defaultValue="USD"
              variant="outlined"
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              fullWidth
              label="Platform Fee (%)"
              type="number"
              defaultValue="5"
              variant="outlined"
            />
          </Grid>
          <Grid size={12}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable automatic payouts"
            />
          </Grid>
          <Grid size={12}>
            <FormControlLabel
              control={<Switch />}
              label="Require manual payout approval"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderSystemSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          System Administration
        </Typography>
        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Button
              variant="outlined"
              startIcon={<Backup />}
              onClick={handleBackup}
              fullWidth
            >
              Backup Database
            </Button>
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Button
              variant="outlined"
              startIcon={<Restore />}
              onClick={handleRestore}
              fullWidth
            >
              Restore Database
            </Button>
          </Grid>
          <Grid size={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              System Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Version: 1.0.0
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last Backup: 2024-01-15 14:30:00
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Database Size: 2.5 GB
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Uptime: 15 days, 3 hours
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        System Settings
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<SettingsIcon />} label="General" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<Payment />} label="Payments" />
          <Tab icon={<Storage />} label="System" />
          <Tab icon={<Api />} label="Financial" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderGeneralSettings()}
      {activeTab === 1 && renderSecuritySettings()}
      {activeTab === 2 && renderNotificationSettings()}
      {activeTab === 3 && renderPaymentSettings()}
      {activeTab === 4 && renderSystemSettings()}
      {activeTab === 5 && <FinancialDashboard />}

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={activeTab === 5} // Disable for financial tab
        >
          Save Settings
        </Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default Settings;
