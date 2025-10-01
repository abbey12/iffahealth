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
  CheckCircle,
  Cancel,
  Visibility,
  Edit,
  Block,
  Person,
  LocalHospital,
  Star,
  Schedule,
} from '@mui/icons-material';
import { Doctor } from '../../services/admin';

interface DoctorCardProps {
  doctor: Doctor;
  onVerify: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onSuspend: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onVerify,
  onReject,
  onSuspend,
  onView,
  onEdit,
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
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getVerificationStatus = (isVerified: boolean) => {
    return isVerified ? (
      <Chip
        icon={<CheckCircle />}
        label="Verified"
        color="success"
        size="small"
        variant="outlined"
      />
    ) : (
      <Chip
        icon={<Schedule />}
        label="Pending Verification"
        color="warning"
        size="small"
        variant="outlined"
      />
    );
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
              bgcolor: 'primary.main',
            }}
          >
            <LocalHospital />
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="h6" component="div" gutterBottom>
              Dr. {doctor.firstName} {doctor.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {doctor.specialty}
            </Typography>
            <Box display="flex" gap={1} alignItems="center">
              <Chip
                label={doctor.status}
                color={getStatusColor(doctor.status) as any}
                size="small"
              />
              {getVerificationStatus(doctor.isVerified)}
            </Box>
          </Box>
          <IconButton onClick={handleMenuClick} size="small">
            <MoreVert />
          </IconButton>
        </Box>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>License:</strong> {doctor.licenseNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Experience:</strong> {doctor.experienceYears} years
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Consultation Fee:</strong> GHC {doctor.consultationFee}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Patients:</strong> {doctor.totalPatients}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Star sx={{ color: 'orange', fontSize: 20 }} />
          <Typography variant="body2" color="text.secondary">
            {doctor.rating?.toFixed(1) || 'N/A'} rating
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          <strong>Hospital:</strong> {doctor.hospitalAffiliation || 'Not specified'}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onView(doctor.id)}
        >
          View Details
        </Button>
        <Button
          size="small"
          startIcon={<Edit />}
          onClick={() => onEdit(doctor.id)}
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
        <MenuItem onClick={() => { onView(doctor.id); handleMenuClose(); }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { onEdit(doctor.id); handleMenuClose(); }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        {!doctor.isVerified && (
          <>
            <MenuItem onClick={() => { onVerify(doctor.id); handleMenuClose(); }}>
              <ListItemIcon>
                <CheckCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>Verify Doctor</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { 
              const reason = prompt('Please provide a reason for rejection:');
              if (reason) {
                onReject(doctor.id, reason);
                handleMenuClose();
              }
            }}>
              <ListItemIcon>
                <Cancel fontSize="small" />
              </ListItemIcon>
              <ListItemText>Reject Verification</ListItemText>
            </MenuItem>
          </>
        )}
        <MenuItem onClick={() => { onSuspend(doctor.id); handleMenuClose(); }}>
          <ListItemIcon>
            <Block fontSize="small" />
          </ListItemIcon>
          <ListItemText>Suspend Account</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default DoctorCard;
