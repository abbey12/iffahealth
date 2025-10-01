import React, { useEffect, useMemo, useState } from 'react';
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
  Stack,
  Divider,
  Tooltip,
} from '@mui/material';
import { Search, FilterList, Refresh, LocalPhone, LocationOn, Map, Language, ChecklistRtl, Science } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchLabCentersAction } from '../store/slices/usersSlice';
import { LabCenter } from '../services/admin';
import Grid from '@mui/material/Grid';

const LabCenters: React.FC = () => {
  const dispatch = useAppDispatch();
  const { labCenters, labCentersMeta, loading, error } = useAppSelector((state) => state.users);

  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    console.log('LabCenters: Dispatching fetchLabCentersAction');
    dispatch(fetchLabCentersAction({}));
  }, [dispatch]);

  useEffect(() => {
    console.log('LabCenters: State updated', { labCenters, labCentersMeta, loading, error });
  }, [labCenters, labCentersMeta, loading, error]);

  const handleFilter = () => {
    dispatch(fetchLabCentersAction({
      search: searchTerm || undefined,
      city: cityFilter || undefined,
      region: regionFilter || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }));
  };

  const handleReset = () => {
    setSearchTerm('');
    setCityFilter('');
    setRegionFilter('');
    setStatusFilter('all');
    dispatch(fetchLabCentersAction({}));
  };

  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    labCenters.forEach((lab) => {
      if (lab.city) set.add(lab.city);
    });
    return Array.from(set).sort();
  }, [labCenters]);

  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    labCenters.forEach((lab) => {
      if (lab.region) set.add(lab.region);
    });
    return Array.from(set).sort();
  }, [labCenters]);

  const activeCount = labCenters.filter((lab) => lab.isActive).length;

  const renderServices = (services?: string[]) => {
    if (!services || services.length === 0) {
      return <Typography color="text.secondary">No services listed</Typography>;
    }
    return (
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {services.map((service) => (
          <Chip key={service} label={service} size="small" color="primary" variant="outlined" />
        ))}
      </Stack>
    );
  };

  const renderOperatingHours = (lab: LabCenter) => {
    if (!lab.operatingHours) {
      return <Typography color="text.secondary">Operating hours not provided</Typography>;
    }

    const entries = Object.entries(lab.operatingHours as Record<string, any>);

    if (!entries.length) {
      return <Typography color="text.secondary">Operating hours not provided</Typography>;
    }

    return (
      <Stack spacing={0.5} sx={{ mt: 1 }}>
        {entries.map(([day, hours]) => {
          if (!hours || (!hours.open && !hours.close)) return null;
          return (
            <Typography key={day} variant="body2" color="text.secondary">
              <strong>{formatDayLabel(day)}:</strong> {hours.open} - {hours.close}
            </Typography>
          );
        })}
      </Stack>
    );
  };

  const formatDayLabel = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Partner Lab Centers
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={<Science />}
            onClick={() => console.log('Add new lab center')}
            sx={{ mr: 2 }}
          >
            Add Lab Center
          </Button>
          <Chip color="primary" label={`Total: ${labCentersMeta?.total ?? labCenters.length}`} />
          <Chip color="success" label={`Active: ${activeCount}`} />
        </Stack>
      </Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Search lab centers"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>City</InputLabel>
                <Select
                  label="City"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                >
                  <MenuItem value="">All Cities</MenuItem>
                  {uniqueCities.map((city) => (
                    <MenuItem key={city} value={city}>
                      {city}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Region</InputLabel>
                <Select
                  label="Region"
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                >
                  <MenuItem value="">All Regions</MenuItem>
                  {uniqueRegions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={handleFilter}
                  startIcon={<FilterList />}
                  fullWidth
                >
                  Filter
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  startIcon={<Refresh />}
                >
                  Reset
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : labCenters.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              No partner lab centers found
            </Typography>
            <Typography color="text.secondary">
              Try adjusting your filters or add a new partner lab center.
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Debug: labCenters.length = {labCenters.length}, loading = {loading.toString()}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {labCenters.map((lab) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={lab.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {lab.name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title="City">
                          <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </Tooltip>
                        <Typography variant="body2" color="text.secondary">
                          {lab.city || 'N/A'}
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                        <Tooltip title="Region">
                          <Map sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </Tooltip>
                        <Typography variant="body2" color="text.secondary">
                          {lab.region || 'N/A'}
                        </Typography>
                      </Stack>
                    </Box>
                    <Chip
                      label={lab.isActive ? 'Active' : 'Inactive'}
                      color={lab.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Stack>

                  <Stack spacing={1.5}>
                    {lab.phone && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocalPhone sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">{lab.phone}</Typography>
                      </Stack>
                    )}
                    {lab.website && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Language sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" component="a" href={lab.website} target="_blank" rel="noopener noreferrer">
                          {lab.website}
                        </Typography>
                      </Stack>
                    )}
                    {lab.coverageRadiusKm !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        Coverage radius: {lab.coverageRadiusKm} km
                      </Typography>
                    )}
                    {lab.rating !== null && lab.rating !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        Rating: {lab.rating.toFixed(1)} ({lab.totalReviews ?? 0} reviews)
                      </Typography>
                    )}
                    {lab.address && (
                      <Typography variant="body2" color="text.secondary">
                        {lab.address.street ? `${lab.address.street}, ` : ''}
                        {lab.address.city || ''} {lab.address.postalCode || ''}
                      </Typography>
                    )}
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Services
                  </Typography>
                  {renderServices(lab.services)}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Operating Hours
                  </Typography>
                  {renderOperatingHours(lab)}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default LabCenters;

