import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert,
  Visibility,
  Edit,
  Block,
  Person,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
  MedicalServices,
} from '@mui/icons-material';
import { Patient } from '../../services/admin';

interface PatientCardProps {
  patient: Patient;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onSuspend: (id: string) => void;
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onView,
  onEdit,
  onSuspend,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            sx={{
              width: 60,
              height: 60,
              mr: 2,
              bgcolor: 'secondary.main',
            }}
          >
            <Person />
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="h6" component="div" gutterBottom>
              {patient.firstName} {patient.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {patient.gender} • {calculateAge(patient.dateOfBirth)} years old
            </Typography>
            <Box display="flex" gap={1} alignItems="center">
              <Chip
                label={patient.status}
                color={getStatusColor(patient.status) as any}
                size="small"
              />
            </Box>
          </Box>
          <IconButton onClick={handleMenuClick} size="small">
            <MoreVert />
          </IconButton>
        </Box>

        <Box mb={2}>
          <Box display="flex" alignItems="center" mb={1}>
            <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {patient.email}
            </Typography>
          </Box>
          {patient.phone && (
            <Box display="flex" alignItems="center" mb={1}>
              <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {patient.phone}
              </Typography>
            </Box>
          )}
          {patient.address?.city && (
            <Box display="flex" alignItems="center" mb={1}>
              <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {patient.address.city}, {patient.address.country}
              </Typography>
            </Box>
          )}
        </Box>

        {patient.insurance && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Insurance:</strong> {patient.insurance.provider || 'Not specified'}
            </Typography>
            {patient.insurance.policyNumber && (
              <Typography variant="body2" color="text.secondary">
                <strong>Policy:</strong> {patient.insurance.policyNumber}
              </Typography>
            )}
          </Box>
        )}

        <Box display="flex" alignItems="center" gap={1}>
          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            Joined {new Date(patient.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onView(patient.id)}
        >
          View Details
        </Button>
        <Button
          size="small"
          startIcon={<Edit />}
          onClick={() => onEdit(patient.id)}
        >
          Edit
        </Button>
      </CardActions>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => { onView(patient.id); handleMenuClose(); }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { onEdit(patient.id); handleMenuClose(); }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { onSuspend(patient.id); handleMenuClose(); }}>
          <ListItemIcon>
            <Block fontSize="small" />
          </ListItemIcon>
          <ListItemText>Suspend Account</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default PatientCard;
