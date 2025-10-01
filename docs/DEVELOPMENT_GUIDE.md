# IFFAHEALTH Development Guide

A comprehensive guide for developers working on the IFFAHEALTH telehealth platform.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Deployment Process](#deployment-process)
- [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### Prerequisites

#### Required Software
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Git**
- **PostgreSQL** (v12 or higher)
- **React Native CLI**
- **Xcode** (for iOS development)
- **Android Studio** (for Android development)

#### Development Tools
- **VS Code** (recommended)
- **Postman** (for API testing)
- **pgAdmin** (for database management)
- **Docker** (optional, for containerized development)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/iffahealth/iffahealth.git
   cd iffahealth
   ```

2. **Set up the mobile app**
   ```bash
   cd mobile
   npm install
   cd ios && pod install && cd ..
   ```

3. **Set up the backend**
   ```bash
   cd ../backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb iffahealth
   
   # Run database schema
   psql -d iffahealth -f ../database/schema.sql
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Mobile
   cd mobile
   npm start
   
   # Terminal 3: iOS Simulator
   cd mobile
   npm run ios
   ```

## 🏗️ Project Structure

```
Iffa/
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── screens/       # App screens
│   │   ├── components/    # Reusable components
│   │   ├── navigation/    # Navigation setup
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   ├── types/         # TypeScript types
│   │   └── contexts/      # React contexts
│   ├── ios/               # iOS-specific code
│   ├── android/           # Android-specific code
│   └── package.json
├── backend/               # Node.js/Express backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Request controllers
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   └── package.json
├── web/                   # React.js web platform (future)
├── docs/                  # Documentation
├── database/              # Database schemas and migrations
└── README.md
```

## 🔄 Development Workflow

### Git Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following the coding standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

4. **Push and create pull request**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

### Branch Naming Convention

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

**Examples:**
```
feat(auth): add JWT token refresh
fix(appointments): resolve timezone issue
docs(api): update authentication endpoints
```

## 📝 Code Standards

### TypeScript Guidelines

#### Naming Conventions
```typescript
// Interfaces and types - PascalCase
interface UserProfile {
  firstName: string;
  lastName: string;
}

// Variables and functions - camelCase
const userProfile: UserProfile = {
  firstName: 'John',
  lastName: 'Doe'
};

// Constants - UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Enums - PascalCase
enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  NURSE = 'nurse'
}
```

#### Function Guidelines
```typescript
// Use explicit return types
function calculateAge(birthDate: Date): number {
  return new Date().getFullYear() - birthDate.getFullYear();
}

// Use async/await over promises
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch user');
  }
}

// Use optional parameters with defaults
function createUser(
  email: string,
  password: string,
  role: UserRole = UserRole.PATIENT
): User {
  // Implementation
}
```

### React Native Guidelines

#### Component Structure
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
}

const Button: React.FC<Props> = ({ title, onPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#2E7D32',
    borderRadius: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Button;
```

#### State Management
```typescript
// Use functional components with hooks
const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const userData = await userService.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // JSX
  );
};
```

### Backend Guidelines

#### API Route Structure
```typescript
import express from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// GET /api/users
router.get('/', asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.json({
    success: true,
    data: { users }
  });
}));

// POST /api/users
router.post('/', [
  body('email').isEmail().normalizeEmail(),
  body('firstName').trim().isLength({ min: 2 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const user = await User.create(req.body);
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user }
  });
}));

export default router;
```

#### Database Model Guidelines
```typescript
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserAttributes {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public firstName!: string;
  public lastName!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50],
    },
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50],
    },
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
});

export default User;
```

## 🧪 Testing Guidelines

### Unit Testing

#### React Native Components
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
```

#### Backend API Routes
```typescript
import request from 'supertest';
import app from '../app';

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  it('should return 401 with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
```

### Integration Testing

```typescript
describe('Appointment Flow', () => {
  it('should create and retrieve appointment', async () => {
    // Create user
    const user = await User.create({
      email: 'patient@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      // ... other fields
    });

    // Create appointment
    const appointment = await Appointment.create({
      patientId: user.id,
      doctorId: doctor.id,
      appointmentDate: new Date(),
      appointmentTime: '10:00 AM',
      type: 'video',
      specialty: 'General Medicine',
      reason: 'Checkup'
    });

    // Retrieve appointment
    const retrievedAppointment = await Appointment.findByPk(appointment.id);
    expect(retrievedAppointment).toBeTruthy();
    expect(retrievedAppointment.patientId).toBe(user.id);
  });
});
```

## 🚀 Deployment Process

### Development Environment

1. **Start all services**
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Mobile
   cd mobile && npm start
   ```

2. **Run tests**
   ```bash
   # Backend tests
   cd backend && npm test
   
   # Mobile tests
   cd mobile && npm test
   ```

### Staging Environment

1. **Build applications**
   ```bash
   # Backend
   cd backend && npm run build
   
   # Mobile
   cd mobile && npm run build:ios
   ```

2. **Deploy to staging**
   ```bash
   # Deploy backend to staging server
   # Deploy mobile app to TestFlight/Play Console
   ```

### Production Environment

1. **Prepare for production**
   ```bash
   # Update environment variables
   # Run database migrations
   # Build production assets
   ```

2. **Deploy to production**
   ```bash
   # Deploy backend to production server
   # Deploy mobile app to App Store/Google Play
   ```

## 🔧 Troubleshooting

### Common Issues

#### Mobile App Issues

**Metro bundler not starting:**
```bash
cd mobile
npx react-native start --reset-cache
```

**iOS build fails:**
```bash
cd mobile/ios
pod install
cd ..
npx react-native run-ios
```

**Android build fails:**
```bash
cd mobile/android
./gradlew clean
cd ..
npx react-native run-android
```

#### Backend Issues

**Database connection fails:**
```bash
# Check PostgreSQL is running
brew services start postgresql

# Check database exists
psql -l | grep iffahealth
```

**Port already in use:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**Node modules issues:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Debugging Tips

1. **Enable debug logging**
   ```typescript
   // Backend
   console.log('Debug info:', data);
   
   // Mobile
   console.log('Debug info:', data);
   ```

2. **Use React Native Debugger**
   - Install React Native Debugger
   - Enable remote debugging
   - Use Redux DevTools

3. **Database debugging**
   ```sql
   -- Check table structure
   \d users
   
   -- Check data
   SELECT * FROM users LIMIT 10;
   
   -- Check indexes
   \di
   ```

### Performance Optimization

1. **Mobile App**
   - Use FlatList for large lists
   - Optimize images
   - Implement lazy loading
   - Use React.memo for components

2. **Backend**
   - Add database indexes
   - Implement caching
   - Optimize database queries
   - Use connection pooling

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Express.js Documentation](https://expressjs.com/)
- [Sequelize Documentation](https://sequelize.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Read the [Contributing Guidelines](CONTRIBUTING.md)
2. Follow the code standards outlined in this guide
3. Write tests for new functionality
4. Update documentation as needed
5. Submit a pull request

---

**Happy coding! 🚀** For questions or support, reach out to the development team.
