import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Users: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Users Management
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Users
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This page will display all users (doctors and patients) with management capabilities.
            Features will include:
          </Typography>
          <ul>
            <li>View all users with filtering and search</li>
            <li>Update user status (active, inactive, suspended)</li>
            <li>Delete users</li>
            <li>Bulk operations</li>
            <li>Export user data</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Users;
