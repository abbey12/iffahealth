# IFFA Health Admin Management Platform

A comprehensive web-based admin management platform for IFFA Health, built with React, TypeScript, and Material-UI.

## 🚀 Features

### Phase 1 (Completed)
- ✅ **Authentication System**: Secure admin login with JWT tokens
- ✅ **Dashboard Overview**: Real-time statistics and quick actions
- ✅ **Responsive Layout**: Modern sidebar navigation with Material-UI
- ✅ **User Management**: View and manage all users (doctors and patients)
- ✅ **Backend Integration**: Connected to existing IFFA Health API
- ✅ **Role-based Access**: Admin authentication and authorization

### Phase 2 (Completed)
- ✅ **Enhanced Doctor Management**: Professional doctor cards with verification workflows
- ✅ **Comprehensive Patient Management**: Patient cards with insurance and demographic info
- ✅ **Advanced Appointment Management**: Grid/table views with status management
- ✅ **Detailed Modals**: Professional modals for viewing entity details
- ✅ **Advanced Filtering**: Multi-criteria search and filter systems
- ✅ **Real-time Statistics**: Live metrics and analytics for all modules

### Phase 3 (Completed)
- ✅ **Advanced Analytics Dashboard**: Interactive charts with Recharts library
- ✅ **Revenue Analytics**: Line/bar charts with growth tracking and metrics
- ✅ **User Analytics**: User growth, distribution, and engagement metrics
- ✅ **Appointment Analytics**: Status tracking and completion rate analysis
- ✅ **Financial Management**: Payout requests, revenue tracking, and financial metrics
- ✅ **System Administration**: Comprehensive settings panel with multiple tabs
- ✅ **Security Settings**: Password policies, 2FA, and security configurations
- ✅ **Notification Settings**: Email and SMS notification management
- ✅ **Payment Settings**: Currency, fees, and payout configurations
- ✅ **System Maintenance**: Database backup/restore and system information

### Upcoming Features
- **Real-time Notifications**: Live alerts and notification system
- **Advanced Reporting**: Custom report generation and export
- **User Activity Monitoring**: Audit logs and activity tracking
- **API Management**: API key management and rate limiting
- **Performance Monitoring**: System performance metrics and alerts

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts (planned)
- **Backend**: Node.js with Express (existing IFFA Health API)

## 📦 Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd /Users/mumtazsuleman/Iffa
   ```

2. **Install dependencies**:
   ```bash
   cd admin-web
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   # .env file is already created with:
   REACT_APP_API_URL=http://localhost:3000/api
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Start the backend server** (in a separate terminal):
   ```bash
   cd ../backend
   npm start
   ```

## 🔐 Default Admin Credentials

- **Email**: admin@iffahealth.com
- **Password**: admin123

## 📱 Access

- **Admin Web App**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **API Health Check**: http://localhost:3000/health

## 🏗️ Project Structure

```
admin-web/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── users/          # User management
│   │   ├── doctors/        # Doctor management
│   │   ├── patients/       # Patient management
│   │   ├── appointments/   # Appointment management
│   │   ├── analytics/      # Analytics components
│   │   └── settings/       # System settings
│   ├── pages/              # Main page components
│   ├── services/           # API services
│   ├── store/              # Redux store and slices
│   └── utils/              # Utility functions
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🌐 API Endpoints

### Admin Authentication
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/me` - Get current admin user
- `POST /api/admin/auth/logout` - Admin logout

### Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

### User Management
- `GET /api/admin/users` - Get all users with pagination
- `GET /api/admin/users/:id` - Get user by ID
- `PATCH /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional Material-UI interface
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Automatic theme switching (planned)
- **Accessibility**: WCAG compliant components
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin permission system
- **API Rate Limiting**: Protection against abuse
- **Input Validation**: Server-side validation
- **CORS Protection**: Cross-origin request security

## 📊 Dashboard Statistics

The dashboard displays real-time statistics including:
- Total users, doctors, and patients
- Appointment counts and status
- Revenue tracking (total and monthly)
- Active user metrics
- Quick action buttons

## 🚀 Deployment

For production deployment:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy the build folder** to your web server

3. **Update environment variables** for production API URL

4. **Configure your web server** to serve the React app

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Use TypeScript for type safety
3. Follow Material-UI design guidelines
4. Write meaningful commit messages
5. Test your changes thoroughly

## 📝 License

This project is part of the IFFA Health platform and is proprietary software.

---

**IFFA Health Admin Platform** - Built with ❤️ for better healthcare management