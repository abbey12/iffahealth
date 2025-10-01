import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Payment,
  Download,
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';

interface PayoutRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  processedAt?: string;
  paymentMethod: string;
  notes?: string;
}

interface FinancialMetrics {
  totalRevenue: number;
  totalPayouts: number;
  pendingPayouts: number;
  netProfit: number;
  monthlyRevenue: number;
  monthlyPayouts: number;
}

const FinancialDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 125000,
    totalPayouts: 87500,
    pendingPayouts: 15000,
    netProfit: 37500,
    monthlyRevenue: 25000,
    monthlyPayouts: 17500,
  });

  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([
    {
      id: '1',
      doctorId: 'd1',
      doctorName: 'Dr. Jane Smith',
      amount: 2500,
      status: 'pending',
      requestedAt: '2024-01-15',
      paymentMethod: 'Bank Transfer',
      notes: 'Monthly earnings payout',
    },
    {
      id: '2',
      doctorId: 'd2',
      doctorName: 'Dr. Michael Brown',
      amount: 1800,
      status: 'approved',
      requestedAt: '2024-01-14',
      processedAt: '2024-01-16',
      paymentMethod: 'PayPal',
    },
    {
      id: '3',
      doctorId: 'd3',
      doctorName: 'Dr. Sarah Johnson',
      amount: 3200,
      status: 'completed',
      requestedAt: '2024-01-12',
      processedAt: '2024-01-14',
      paymentMethod: 'Bank Transfer',
    },
  ]);

  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'info';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleApprovePayout = async (id: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPayoutRequests(prev => 
        prev.map(payout => 
          payout.id === id 
            ? { ...payout, status: 'approved' as const, processedAt: new Date().toISOString().split('T')[0] }
            : payout
        )
      );
      setPayoutModalOpen(false);
    } catch (error) {
      console.error('Failed to approve payout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPayout = async (id: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPayoutRequests(prev => 
        prev.map(payout => 
          payout.id === id 
            ? { ...payout, status: 'rejected' as const, processedAt: new Date().toISOString().split('T')[0] }
            : payout
        )
      );
      setPayoutModalOpen(false);
    } catch (error) {
      console.error('Failed to reject payout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayout = (payout: PayoutRequest) => {
    setSelectedPayout(payout);
    setPayoutModalOpen(true);
  };

  const handleExportFinancials = () => {
    // Implement export functionality
    console.log('Exporting financial data...');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Financial Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExportFinancials}
        >
          Export Financials
        </Button>
      </Box>

      {/* Financial Metrics */}
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
                    GHC {metrics.totalRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Monthly: GHC {metrics.monthlyRevenue.toLocaleString()}
                  </Typography>
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
                    Total Payouts
                  </Typography>
                  <Typography variant="h4" component="div">
                    GHC {metrics.totalPayouts.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending: GHC {metrics.pendingPayouts.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingDown sx={{ fontSize: 40, color: 'error.main' }} />
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
                    Net Profit
                  </Typography>
                  <Typography variant="h4" component="div">
                    GHC {metrics.netProfit.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Profit: GHC {(metrics.monthlyRevenue - metrics.monthlyPayouts).toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
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
                    Monthly Payouts
                  </Typography>
                  <Typography variant="h4" component="div">
                    GHC {metrics.monthlyPayouts.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending: GHC {metrics.pendingPayouts.toLocaleString()}
                  </Typography>
                </Box>
                <AccountBalance sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payout Requests */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" component="div">
              Payout Requests
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => console.log('Add new payout request')}
            >
              New Request
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell>Processed</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payoutRequests.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>{payout.doctorName}</TableCell>
                    <TableCell>GHC {payout.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={payout.status}
                        color={getStatusColor(payout.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{payout.paymentMethod}</TableCell>
                    <TableCell>{new Date(payout.requestedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewPayout(payout)}>
                        <Visibility />
                      </IconButton>
                      {payout.status === 'pending' && (
                        <>
                          <IconButton 
                            onClick={() => handleApprovePayout(payout.id)}
                            color="success"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleRejectPayout(payout.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Payout Details Modal */}
      <Dialog
        open={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Payout Request Details
        </DialogTitle>
        <DialogContent>
          {selectedPayout && (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Doctor Information
                  </Typography>
                  <Typography variant="body1">
                    <strong>Name:</strong> {selectedPayout.doctorName}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Doctor ID:</strong> {selectedPayout.doctorId}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Requested On:</strong> {selectedPayout.requestedAt}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Payment Details
                  </Typography>
                  <Typography variant="body1">
                    <strong>Amount:</strong> GHC {selectedPayout.amount.toLocaleString()}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Payment Method:</strong> {selectedPayout.paymentMethod}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Status:</strong> {selectedPayout.status}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Timeline
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Requested: {selectedPayout.requestedAt}
                  </Typography>
                  {selectedPayout.processedAt && (
                    <Typography variant="body1" color="text.secondary">
                      Processed: {selectedPayout.processedAt}
                    </Typography>
                  )}
                  {selectedPayout.notes && (
                    <Typography variant="body1" color="text.secondary">
                      Notes: {selectedPayout.notes}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayoutModalOpen(false)}>Close</Button>
          {selectedPayout?.status === 'pending' && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleRejectPayout(selectedPayout.id)}
                disabled={loading}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleApprovePayout(selectedPayout.id)}
                disabled={loading}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinancialDashboard;
