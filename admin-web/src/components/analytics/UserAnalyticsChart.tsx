import React, { useState } from 'react';
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
import Grid from '@mui/material/Grid';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { People, LocalHospital, Person, TrendingUp } from '@mui/icons-material';

interface UserAnalyticsChartProps {
  data: any[];
  period: string;
  onPeriodChange: (period: string) => void;
}

const UserAnalyticsChart: React.FC<UserAnalyticsChartProps> = ({ data, period, onPeriodChange }) => {
  const [chartType, setChartType] = useState<'line' | 'area' | 'pie'>('line');

  // Calculate totals
  const totalUsers = data.reduce((sum, item) => sum + (item.totalUsers || 0), 0);
  const totalDoctors = data.reduce((sum, item) => sum + (item.doctors || 0), 0);
  const totalPatients = data.reduce((sum, item) => sum + (item.patients || 0), 0);
  const newUsers = data.length > 0 ? data[data.length - 1].newUsers : 0;

  const periods = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  const pieData = [
    { name: 'Patients', value: totalPatients, color: '#1976D2' },
    { name: 'Doctors', value: totalDoctors, color: '#2E7D32' },
  ];

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" component="div">
            User Analytics
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
                onChange={(e) => setChartType(e.target.value as 'line' | 'area' | 'pie')}
                label="Chart"
              >
                <MenuItem value="line">Line</MenuItem>
                <MenuItem value="area">Area</MenuItem>
                <MenuItem value="pie">Pie</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* User Summary */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary.main" gutterBottom>
                {totalUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main" gutterBottom>
                {totalDoctors.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Doctors
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main" gutterBottom>
                {totalPatients.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Patients
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main" gutterBottom>
                {newUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New Users
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
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : chartType === 'area' ? (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="totalUsers"
                  stackId="1"
                  stroke="#1976D2"
                  fill="#1976D2"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="doctors"
                  stackId="2"
                  stroke="#2E7D32"
                  fill="#2E7D32"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="patients"
                  stackId="3"
                  stroke="#ED6C02"
                  fill="#ED6C02"
                  fillOpacity={0.6}
                />
              </AreaChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalUsers"
                  stroke="#1976D2"
                  strokeWidth={3}
                  dot={{ fill: '#1976D2', strokeWidth: 2, r: 6 }}
                  name="Total Users"
                />
                <Line
                  type="monotone"
                  dataKey="doctors"
                  stroke="#2E7D32"
                  strokeWidth={3}
                  dot={{ fill: '#2E7D32', strokeWidth: 2, r: 6 }}
                  name="Doctors"
                />
                <Line
                  type="monotone"
                  dataKey="patients"
                  stroke="#ED6C02"
                  strokeWidth={3}
                  dot={{ fill: '#ED6C02', strokeWidth: 2, r: 6 }}
                  name="Patients"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>

        {/* User Distribution */}
        <Box display="flex" justifyContent="center" gap={2} mt={2}>
          <Chip
            icon={<Person />}
            label={`${totalPatients} Patients`}
            color="info"
            variant="outlined"
          />
          <Chip
            icon={<LocalHospital />}
            label={`${totalDoctors} Doctors`}
            color="success"
            variant="outlined"
          />
          <Chip
            icon={<TrendingUp />}
            label={`${newUsers} New Users`}
            color="warning"
            variant="outlined"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserAnalyticsChart;
