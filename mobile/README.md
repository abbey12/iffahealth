# IFFAHEALTH Mobile App

A comprehensive telehealth platform mobile application built with React Native for iOS and Android.

## 🏥 Overview

IFFAHEALTH is a modern telehealth platform designed to revolutionize healthcare delivery in Ghana and across Africa. The mobile app provides patients with easy access to healthcare services, AI-powered health assistance, and comprehensive post-discharge care management.

## ✨ Features

### 🏠 Home Dashboard
- Quick access to all major features
- Health tips and wellness information
- Emergency contact integration
- Personalized health recommendations

### 📅 Appointment Management
- Book video and in-person appointments
- View appointment history
- Reschedule and cancel appointments
- Real-time appointment status updates

### 🤖 AI Health Assistant
- Symptom checker and analysis
- Health education and tips
- Medication information
- 24/7 health guidance
- Interactive chat interface

### 🏥 Post-Discharge Care
- Personalized care plans
- Task management and tracking
- Nurse assignment and communication
- Recovery progress monitoring
- Medication reminders

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Iffa/mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running the App

#### iOS
```bash
npm run ios
# or
npx react-native run-ios
```

#### Android
```bash
npm run android
# or
npx react-native run-android
```

#### Development Server
```bash
npm start
```

## 📱 App Structure

```
src/
├── screens/           # Main app screens
│   ├── HomeScreen.tsx
│   ├── AppointmentsScreen.tsx
│   ├── AIAssistantScreen.tsx
│   └── PostDischargeScreen.tsx
├── components/        # Reusable components
├── navigation/        # Navigation configuration
├── services/          # API services
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
└── contexts/         # React contexts
```

## 🎨 Design System

### Colors
- **Primary Green**: #2E7D32
- **Secondary Blue**: #1976D2
- **Accent Purple**: #7B1FA2
- **Success Green**: #4CAF50
- **Warning Orange**: #FF9800
- **Error Red**: #F44336

### Typography
- **Headers**: Bold, 18-28px
- **Body**: Regular, 14-16px
- **Captions**: Regular, 12-14px

### Components
- **Cards**: Rounded corners (12px), elevation/shadow
- **Buttons**: Rounded (8px), consistent padding
- **Inputs**: Rounded (8px), clear focus states

## 🔧 Configuration

### Environment Variables
```env
API_BASE_URL=https://api.iffahealth.com
WEBSOCKET_URL=wss://api.iffahealth.com
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Navigation
The app uses React Navigation with:
- Bottom Tab Navigator for main navigation
- Stack Navigator for screen transitions
- Modal presentations for forms

## 📦 Dependencies

### Core Dependencies
- `react-native`: 0.81.4
- `@react-navigation/native`: Navigation
- `@react-navigation/bottom-tabs`: Tab navigation
- `react-native-vector-icons`: Icons
- `react-native-linear-gradient`: Gradients
- `@react-native-async-storage/async-storage`: Local storage

### Development Dependencies
- `typescript`: Type safety
- `eslint`: Code linting
- `prettier`: Code formatting

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📱 Platform-Specific Features

### iOS
- Native iOS design patterns
- HealthKit integration (future)
- Push notifications
- Background app refresh

### Android
- Material Design components
- Android-specific permissions
- Background services
- Adaptive icons

## 🔒 Security

- JWT token authentication
- Secure API communication
- Biometric authentication (future)
- Data encryption at rest

## 📊 Performance

- Optimized image loading
- Lazy loading for screens
- Memory management
- Bundle size optimization

## 🚀 Deployment

### iOS App Store
1. Configure signing certificates
2. Update version in `ios/IffaHealth/Info.plist`
3. Build and upload via Xcode

### Google Play Store
1. Generate signed APK/AAB
2. Update version in `android/app/build.gradle`
3. Upload to Play Console

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@iffahealth.com
- Documentation: https://docs.iffahealth.com
- Issues: GitHub Issues

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Core app structure
- ✅ Basic navigation
- ✅ Authentication flow
- ✅ Main screens implementation

### Phase 2 (Next)
- 🔄 Video calling integration
- 🔄 Real-time notifications
- 🔄 Offline functionality
- 🔄 Advanced AI features

### Phase 3 (Future)
- 📋 Health records integration
- 📋 Payment processing
- 📋 Multi-language support
- 📋 Advanced analytics

---

**Building the future of healthcare in Africa, one connection at a time.** 🌍🏥✨