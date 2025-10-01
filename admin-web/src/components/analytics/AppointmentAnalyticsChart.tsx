import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Event, CheckCircle, Cancel, Schedule, TrendingUp } from '@mui/icons-material';

interface AppointmentAnalyticsChartProps {
  data: any[];
  period: string;
  onPeriodChange: (period: string) => void;
}

const AppointmentAnalyticsChart: React.FC<AppointmentAnalyticsChartProps> = ({ data, period, onPeriodChange }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  // Calculate totals
  const totalAppointments = data.reduce((sum, item) => sum + (item.totalAppointments || 0), 0);
  const completedAppointments = data.reduce((sum, item) => sum + (item.completed || 0), 0);
  const cancelledAppointments = data.reduce((sum, item) => sum + (item.cancelled || 0), 0);
  const scheduledAppointments = data.reduce((sum, item) => sum + (item.scheduled || 0), 0);
  const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

  const periods = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  const statusData = [
    { name: 'Scheduled', value: scheduledAppointments, color: '#1976D2' },
    { name: 'Completed', value: completedAppointments, color: '#2E7D32' },
    { name: 'Cancelled', value: cancelledAppointments, color: '#D32F2F' },
  ];

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" component="div">
            Appointment Analytics
          </Typography>
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={period}
                onChange={(e) => onPeriodChange(e.target.value)}
                label="Period"
              >
                {periods.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Chart</InputLabel>
              <Select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'bar' | 'line' | 'pie')}
                label="Chart"
              >
                <MenuItem value="bar">Bar</MenuItem>
                <MenuItem value="line">Line</MenuItem>
                <MenuItem value="pie">Pie</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Appointment Summary */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid
            size={{
              xs: 12,
              sm: 3
            }}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary.main" gutterBottom>
                {totalAppointments.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Appointments
              </Typography>
            </Box>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 3
            }}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main" gutterBottom>
                {completedAppointments.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Box>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 3
            }}>
            <Box textAlign="center">
              <Typography variant="h4" color="error.main" gutterBottom>
                {cancelledAppointments.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cancelled
              </Typography>
            </Box>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 3
            }}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main" gutterBottom>
                {completionRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completion Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Chart */}
        <Box height={400}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : chartType === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalAppointments"
                  stroke="#1976D2"
                  strokeWidth={3}
                  dot={{ fill: '#1976D2', strokeWidth: 2, r: 6 }}
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#2E7D32"
                  strokeWidth={3}
                  dot={{ fill: '#2E7D32', strokeWidth: 2, r: 6 }}
                  name="Completed"
                />
                <Line
                  type="monotone"
                  dataKey="cancelled"
                  stroke="#D32F2F"
                  strokeWidth={3}
                  dot={{ fill: '#D32F2F', strokeWidth: 2, r: 6 }}
                  name="Cancelled"
                />
                <Line
                  type="monotone"
                  dataKey="scheduled"
                  stroke="#FF9800"
                  strokeWidth={3}
                  dot={{ fill: '#FF9800', strokeWidth: 2, r: 6 }}
                  name="Scheduled"
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="scheduled" stackId="a" fill="#1976D2" name="Scheduled" />
                <Bar dataKey="completed" stackId="a" fill="#2E7D32" name="Completed" />
                <Bar dataKey="cancelled" stackId="a" fill="#D32F2F" name="Cancelled" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </Box>

        {/* Status Indicators */}
        <Box display="flex" justifyContent="center" gap={2} mt={2}>
          <Chip
            icon={<Schedule />}
            label={`${scheduledAppointments} Scheduled`}
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<CheckCircle />}
            label={`${completedAppointments} Completed`}
            color="success"
            variant="outlined"
          />
          <Chip
            icon={<Cancel />}
            label={`${cancelledAppointments} Cancelled`}
            color="error"
            variant="outlined"
          />
          <Chip
            icon={<TrendingUp />}
            label={`${completionRate.toFixed(1)}% Success Rate`}
            color="info"
            variant="outlined"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default AppointmentAnalyticsChart;
