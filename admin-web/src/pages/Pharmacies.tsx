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
  Tooltip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Search,
  FilterList,
  Refresh,
  LocalPhone,
  LocalPharmacy,
  Map,
  Language,
  DirectionsBike
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchPartnerPharmaciesAction } from '../store/slices/usersSlice';
import { PartnerPharmacy } from '../services/admin';

const Pharmacies: React.FC = () => {
  const dispatch = useAppDispatch();
  const { partnerPharmacies, partnerPharmaciesMeta, loading, error } = useAppSelector((state) => state.users);

  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState<'all' | 'accepted' | 'not_accepted'>('all');

  useEffect(() => {
    dispatch(fetchPartnerPharmaciesAction({}));
  }, [dispatch]);

  const handleFilter = () => {
    dispatch(fetchPartnerPharmaciesAction({
      search: searchTerm || undefined,
      city: cityFilter || undefined,
      region: regionFilter || undefined,
      acceptsInsurance: insuranceFilter === 'all' ? undefined : insuranceFilter === 'accepted',
    }));
  };

  const handleReset = () => {
    setSearchTerm('');
    setCityFilter('');
    setRegionFilter('');
    setInsuranceFilter('all');
    dispatch(fetchPartnerPharmaciesAction({}));
  };

  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    partnerPharmacies.forEach((pharmacy) => {
      if (pharmacy.city) set.add(pharmacy.city);
    });
    return Array.from(set).sort();
  }, [partnerPharmacies]);

  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    partnerPharmacies.forEach((pharmacy) => {
      if (pharmacy.region) set.add(pharmacy.region);
    });
    return Array.from(set).sort();
  }, [partnerPharmacies]);

  const activeCount = partnerPharmacies.filter((pharmacy) => pharmacy.isActive).length;
  const insuranceCount = partnerPharmacies.filter((pharmacy) => pharmacy.acceptsInsurance).length;

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

  const renderInsuranceProviders = (providers?: string[]) => {
    if (!providers || providers.length === 0) {
      return <Typography color="text.secondary">No insurance providers</Typography>;
    }
    return (
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {providers.map((provider) => (
          <Chip key={provider} label={provider} size="small" color="success" variant="outlined" />
        ))}
      </Stack>
    );
  };

  const renderDeliveryOptions = (options?: string[]) => {
    if (!options || options.length === 0) {
      return <Typography color="text.secondary">No delivery options listed</Typography>;
    }
    return (
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {options.map((option) => (
          <Chip key={option} label={option} size="small" />
        ))}
      </Stack>
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Partner Pharmacies
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={<LocalPharmacy />}
            onClick={() => console.log('Add new pharmacy')}
            sx={{ mr: 2 }}
          >
            Add Pharmacy
          </Button>
          <Chip color="primary" label={`Total: ${partnerPharmaciesMeta?.total ?? partnerPharmacies.length}`} />
          <Chip color="success" label={`Active: ${activeCount}`} />
          <Chip color="info" label={`Accepting Insurance: ${insuranceCount}`} />
        </Stack>
      </Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid
size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Search pharmacies"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
            </Grid>
            <Grid
size={{ xs: 12, md: 2 }}>
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
            <Grid
size={{ xs: 12, md: 2 }}>
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
            <Grid
size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Insurance</InputLabel>
                <Select
                  label="Insurance"
                  value={insuranceFilter}
                  onChange={(e) => setInsuranceFilter(e.target.value as typeof insuranceFilter)}
                >
                  <MenuItem value="all">All Pharmacies</MenuItem>
                  <MenuItem value="accepted">Accepting Insurance</MenuItem>
                  <MenuItem value="not_accepted">Not Accepting Insurance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid
size={{ xs: 12, md: 2 }}>
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
      ) : partnerPharmacies.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              No partner pharmacies found
            </Typography>
            <Typography color="text.secondary">
              Try adjusting your filters or add a new partner pharmacy.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {partnerPharmacies.map((pharmacy) => (
            <Grid
              key={pharmacy.id}
size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {pharmacy.name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title="City">
                          <LocalPharmacy sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </Tooltip>
                        <Typography variant="body2" color="text.secondary">
                          {pharmacy.city || 'N/A'}
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                        <Tooltip title="Region">
                          <Map sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </Tooltip>
                        <Typography variant="body2" color="text.secondary">
                          {pharmacy.region || 'N/A'}
                        </Typography>
                      </Stack>
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip
                        label={pharmacy.isActive ? 'Active' : 'Inactive'}
                        color={pharmacy.isActive ? 'success' : 'default'}
                        size="small"
                      />
                      <Chip
                        label={pharmacy.acceptsInsurance ? 'Insurance Accepted' : 'Insurance Not Accepted'}
                        color={pharmacy.acceptsInsurance ? 'info' : 'default'}
                        size="small"
                      />
                    </Stack>
                  </Stack>

                  <Stack spacing={1.5}>
                    {pharmacy.phone && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocalPhone sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">{pharmacy.phone}</Typography>
                      </Stack>
                    )}
                    {pharmacy.website && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Language sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography
                          variant="body2"
                          component="a"
                          href={pharmacy.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {pharmacy.website}
                        </Typography>
                      </Stack>
                    )}
                    {pharmacy.coverageRadiusKm !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        Coverage radius: {pharmacy.coverageRadiusKm} km
                      </Typography>
                    )}
                    {pharmacy.rating !== null && pharmacy.rating !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        Rating: {pharmacy.rating.toFixed(1)} ({pharmacy.totalReviews ?? 0} reviews)
                      </Typography>
                    )}
                    {pharmacy.address && (
                      <Typography variant="body2" color="text.secondary">
                        {pharmacy.address.street ? `${pharmacy.address.street}, ` : ''}
                        {pharmacy.address.city || ''} {pharmacy.address.postalCode || ''}
                      </Typography>
                    )}
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Services
                  </Typography>
                  {renderServices(pharmacy.services)}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Delivery Options
                  </Typography>
                  {renderDeliveryOptions(pharmacy.deliveryOptions)}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Insurance Providers
                  </Typography>
                  {renderInsuranceProviders(pharmacy.insuranceProviders)}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Pharmacies;

