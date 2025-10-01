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
  Cancel,
  CheckCircle,
  Schedule,
  Person,
  LocalHospital,
  AccessTime,
  Event,
} from '@mui/icons-material';
import { Appointment } from '../../services/admin';
import { formatAppointmentDateTime, formatDateTime } from '../../utils/dateUtils';

interface AppointmentCardProps {
  appointment: Appointment;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onView,
  onEdit,
  onCancel,
  onComplete,
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
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'no_show':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'consultation':
        return 'info';
      case 'follow_up':
        return 'secondary';
      case 'emergency':
        return 'error';
      default:
        return 'default';
    }
  };


  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            sx={{
              width: 50,
              height: 50,
              mr: 2,
              bgcolor: 'primary.main',
            }}
          >
            <Event />
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="h6" component="div" gutterBottom>
              {appointment.patient.firstName} {appointment.patient.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              with Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
            </Typography>
            <Box display="flex" gap={1} alignItems="center">
              <Chip
                label={appointment.status}
                color={getStatusColor(appointment.status) as any}
                size="small"
              />
              <Chip
                label={appointment.type}
                color={getTypeColor(appointment.type) as any}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
          <IconButton onClick={handleMenuClick} size="small">
            <MoreVert />
          </IconButton>
        </Box>

        <Box mb={2}>
          <Box display="flex" alignItems="center" mb={1}>
            <Schedule sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {formatAppointmentDateTime(appointment.date, appointment.time)}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" mb={1}>
            <LocalHospital sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {appointment.doctor.specialty}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" mb={1}>
            <Person sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Patient ID: {appointment.patientId}
            </Typography>
          </Box>
        </Box>

        {appointment.notes && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              <strong>Notes:</strong> {appointment.notes}
            </Typography>
          </Box>
        )}

        <Box display="flex" alignItems="center" gap={1}>
          <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            Created {formatDateTime(appointment.createdAt)}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onView(appointment.id)}
        >
          View Details
        </Button>
        {appointment.status === 'scheduled' && (
          <Button
            size="small"
            startIcon={<Edit />}
            onClick={() => onEdit(appointment.id)}
          >
            Edit
          </Button>
        )}
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
        <MenuItem onClick={() => { onView(appointment.id); handleMenuClose(); }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        {appointment.status === 'scheduled' && (
          <>
            <MenuItem onClick={() => { onEdit(appointment.id); handleMenuClose(); }}>
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Appointment</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { onComplete(appointment.id); handleMenuClose(); }}>
              <ListItemIcon>
                <CheckCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>Mark Complete</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { onCancel(appointment.id); handleMenuClose(); }}>
              <ListItemIcon>
                <Cancel fontSize="small" />
              </ListItemIcon>
              <ListItemText>Cancel Appointment</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </Card>
  );
};

export default AppointmentCard;
