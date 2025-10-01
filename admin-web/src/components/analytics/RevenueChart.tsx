import React, { useState, useEffect } from 'react';
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, AttachMoney } from '@mui/icons-material';

interface RevenueChartProps {
  data: any[];
  period: string;
  onPeriodChange: (period: string) => void;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, period, onPeriodChange }) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Calculate total revenue and growth
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const previousPeriodRevenue = data.length > 1 ? data[data.length - 2].revenue : 0;
  const currentPeriodRevenue = data.length > 0 ? data[data.length - 1].revenue : 0;
  const growthRate = previousPeriodRevenue > 0 
    ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
    : 0;

  const periods = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  const colors = ['#1976D2', '#42A5F5', '#90CAF9', '#E3F2FD'];

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" component="div">
            Revenue Analytics
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
                onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
                label="Chart"
              >
                <MenuItem value="line">Line</MenuItem>
                <MenuItem value="bar">Bar</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Revenue Summary */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary.main" gutterBottom>
                GHC {totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box textAlign="center">
              <Typography variant="h4" color={growthRate >= 0 ? 'success.main' : 'error.main'} gutterBottom>
                {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Growth Rate
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main" gutterBottom>
                GHC {(totalRevenue / data.length).toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Daily Revenue
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Chart */}
        <Box height={400}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`GHC ${value.toLocaleString()}`, 'Revenue']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1976D2"
                  strokeWidth={3}
                  dot={{ fill: '#1976D2', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`GHC ${value.toLocaleString()}`, 'Revenue']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#1976D2" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </Box>

        {/* Growth Indicator */}
        <Box display="flex" alignItems="center" justifyContent="center" mt={2}>
          {growthRate > 0 ? (
            <Chip
              icon={<TrendingUp />}
              label={`+${growthRate.toFixed(1)}% growth`}
              color="success"
              variant="outlined"
            />
          ) : (
            <Chip
              icon={<TrendingDown />}
              label={`${growthRate.toFixed(1)}% decline`}
              color="error"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
