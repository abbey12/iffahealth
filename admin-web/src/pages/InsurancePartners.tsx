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
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Call,
  Email,
  Language,
  Assignment,
  CheckCircle,
  HealthAndSafety,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchInsurancePartnersAction } from '../store/slices/usersSlice';
import { InsurancePartner } from '../services/admin';

const InsurancePartners: React.FC = () => {
  const dispatch = useAppDispatch();
  const { insurancePartners, insurancePartnersMeta, loading, error } = useAppSelector((state) => state.users);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [regionFilter, setRegionFilter] = useState('');

  useEffect(() => {
    dispatch(fetchInsurancePartnersAction({}));
  }, [dispatch]);

  const handleFilter = () => {
    dispatch(fetchInsurancePartnersAction({
      search: searchTerm || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }));
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRegionFilter('');
    dispatch(fetchInsurancePartnersAction({}));
  };

  const activeCount = insurancePartners.filter((partner) => partner.isActive).length;

  const regions = useMemo(() => {
    const set = new Set<string>();
    insurancePartners.forEach((partner) => {
      partner.coverageAreas?.forEach((area) => set.add(area));
    });
    return Array.from(set).sort();
  }, [insurancePartners]);

  const filteredPartners = insurancePartners.filter((partner) => {
    if (regionFilter && !(partner.coverageAreas || []).includes(regionFilter)) {
      return false;
    }
    return true;
  });

  const totalPlans = insurancePartners.reduce((count, partner) => {
    if (partner.plans && Array.isArray(partner.plans)) {
      return count + partner.plans.length;
    }
    if (partner.plans && typeof partner.plans === 'object') {
      return count + Object.keys(partner.plans).length;
    }
    return count;
  }, 0);

  const renderCoverageAreas = (areas?: string[]) => {
    if (!areas || areas.length === 0) {
      return <Typography color="text.secondary">Coverage areas not provided</Typography>;
    }
    return (
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {areas.map((area) => (
          <Chip key={area} label={area} size="small" color="primary" variant="outlined" />
        ))}
      </Stack>
    );
  };

  const renderPlans = (plans?: any) => {
    if (!plans) {
      return <Typography color="text.secondary">Plans not provided</Typography>;
    }

    if (Array.isArray(plans)) {
      if (plans.length === 0) {
        return <Typography color="text.secondary">Plans not provided</Typography>;
      }
      return (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {plans.map((plan) => (
            <Chip key={plan} label={plan} size="small" variant="outlined" />
          ))}
        </Stack>
      );
    }

    if (typeof plans === 'object') {
      return (
        <List dense>
          {Object.entries(plans).map(([key, value]) => (
            <ListItem key={key} disableGutters>
              <ListItemIcon>
                <Assignment fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={key}
                secondary={typeof value === 'string' ? value : JSON.stringify(value)}
              />
            </ListItem>
          ))}
        </List>
      );
    }

    return <Typography color="text.secondary">Plans not provided</Typography>;
  };

  const renderContactPerson = (contact?: any) => {
    if (!contact) {
      return <Typography color="text.secondary">No contact person information</Typography>;
    }

    return (
      <List dense>
        {contact.name && (
          <ListItem disableGutters>
            <ListItemIcon>
              <CheckCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={contact.name} secondary="Contact" />
          </ListItem>
        )}
        {contact.email && (
          <ListItem disableGutters>
            <ListItemIcon>
              <Email fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={contact.email} />
          </ListItem>
        )}
        {contact.phone && (
          <ListItem disableGutters>
            <ListItemIcon>
              <Call fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={contact.phone} />
          </ListItem>
        )}
      </List>
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Insurance Partners
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={<HealthAndSafety />}
            onClick={() => console.log('Add new insurance partner')}
            sx={{ mr: 2 }}
          >
            Add Insurance Partner
          </Button>
          <Chip label={`Total Partners: ${insurancePartnersMeta?.total ?? insurancePartners.length}`} color="primary" />
          <Chip label={`Active Partners: ${activeCount}`} color="success" />
          <Chip label={`Total Plans: ${totalPlans}`} color="info" />
        </Stack>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Search partners"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>Coverage Region</InputLabel>
                <Select
                  label="Coverage Region"
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                >
                  <MenuItem value="">All Regions</MenuItem>
                  {regions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                >
                  <MenuItem value="all">All Partners</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handleFilter} startIcon={<FilterList />} fullWidth>
                  Filter
                </Button>
                <Button variant="outlined" onClick={handleReset} startIcon={<Refresh />}>
                  Reset
                </Button>
              </Stack>
            </Box>
        </Box>
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
      ) : filteredPartners.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              No insurance partners found
            </Typography>
            <Typography color="text.secondary">
              Try adjusting your filters or add a new insurance partner.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {filteredPartners.map((partner) => (
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }} key={partner.id}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                    <Avatar
                      variant="rounded"
                      src={partner.logoUrl}
                      alt={partner.name}
                      sx={{ width: 56, height: 56 }}
                    >
                      {partner.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box flexGrow={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {partner.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {partner.description || 'No description provided.'}
                          </Typography>
                        </Box>
                        <Chip
                          label={partner.isActive ? 'Active' : 'Inactive'}
                          color={partner.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        {partner.phone && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Call sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2">{partner.phone}</Typography>
                          </Stack>
                        )}
                        {partner.email && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Email sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2">{partner.email}</Typography>
                          </Stack>
                        )}
                        {partner.website && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Language sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography
                              variant="body2"
                              component="a"
                              href={partner.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Website
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Coverage Areas
                  </Typography>
                  {renderCoverageAreas(partner.coverageAreas)}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Plans
                  </Typography>
                  {renderPlans(partner.plans)}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Contact Person
                  </Typography>
                  {renderContactPerson(partner.contactPerson)}
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default InsurancePartners;

