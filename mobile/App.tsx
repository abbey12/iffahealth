import React, {useState, useEffect, useCallback} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {TouchableOpacity, View, Text, ActivityIndicator, Linking} from 'react-native';
import SimpleIcon from './src/components/SimpleIcon';
import {getAuthState, saveAuthState, clearAuthState, isAuthStateValid, testAsyncStorage, AuthState} from './src/utils/authStorage';
import axios from 'axios';
import {DataProvider, useData} from './src/context/DataContext';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MedicationsScreen from './src/screens/MedicationsScreen';
import LabTestsScreen from './src/screens/LabTestsScreen';
import HealthRecordsScreen from './src/screens/HealthRecordsScreen';
import AIAssistantScreen from './src/screens/AIAssistantScreen';

// Import doctor booking screens
import DoctorListScreen from './src/screens/DoctorListScreen';
import DoctorProfileScreen from './src/screens/DoctorProfileScreen';
import BookAppointmentScreen from './src/screens/BookAppointmentScreen';
import VideoCallScreen from './src/screens/VideoCallScreen';

// Import profile completion screen
import PatientProfileCompletionScreen from './src/screens/PatientProfileCompletionScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
// Import payment screen
import PaymentScreen from './src/screens/PaymentScreen';

// Import auth screens
import LoginScreen from './src/screens/auth/LoginScreen';
import PatientLoginScreen from './src/screens/auth/PatientLoginScreen';
import DoctorLoginScreen from './src/screens/auth/DoctorLoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Import doctor screens
import DoctorDashboardScreen from './src/screens/DoctorDashboardScreen';
import DoctorAppointmentsScreen from './src/screens/DoctorAppointmentsScreen';
import DoctorPatientsScreen from './src/screens/DoctorPatientsScreen';
import DoctorMedicalRecordsScreen from './src/screens/DoctorMedicalRecordsScreen';
import DoctorEarningsScreen from './src/screens/DoctorEarningsScreen';
import AddPayoutMethodScreen from './src/screens/AddPayoutMethodScreen';
import PayoutTrackingScreen from './src/screens/PayoutTrackingScreen';
import PaymentMethodsScreen from './src/screens/PaymentMethodsScreen';
import PatientLabTestScreen from './src/screens/PatientLabTestScreen';
import LabTestResultScreen from './src/screens/LabTestResultScreen';
import LabTestBookingScreen from './src/screens/LabTestBookingScreen';
import DoctorLabTestScreen from './src/screens/DoctorLabTestScreen';
import RequestLabTestScreen from './src/screens/RequestLabTestScreen';
import AddLabTestNotesScreen from './src/screens/AddLabTestNotesScreen';
import DoctorPrescriptionsScreen from './src/screens/DoctorPrescriptionsScreen';
import PrescriptionDetailScreen from './src/screens/PrescriptionDetailScreen';
import NewPrescriptionScreen from './src/screens/NewPrescriptionScreen';
import MedicationLibraryScreen from './src/screens/MedicationLibraryScreen';
import AddMedicalRecordScreen from './src/screens/AddMedicalRecordScreen';
import DoctorAvailabilitySettingsScreen from './src/screens/DoctorAvailabilitySettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Authentication Stack
const AuthStack = ({onLogin}: {onLogin: (role: 'patient' | 'doctor', token?: string, userData?: any) => Promise<void>}) => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PatientLogin">
        {(props) => <PatientLoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="DoctorLogin">
        {(props) => <DoctorLoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Patient App Stack
const PatientApp = ({onLogout}: {onLogout: () => void}) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        options={{headerShown: false}}>
        {() => (
          <Tab.Navigator
            screenOptions={({route}) => ({
              tabBarIcon: ({focused, color, size}) => {
                let iconName: string;

                if (route.name === 'Home') {
                  iconName = 'home';
                } else if (route.name === 'Appointments') {
                  iconName = 'calendar';
                } else if (route.name === 'Profile') {
                  iconName = 'person-circle';
                } else {
                  iconName = 'help';
                }

                return <SimpleIcon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#1976D2',
              tabBarInactiveTintColor: '#9E9E9E',
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
                marginTop: 4,
              },
              tabBarStyle: {
                backgroundColor: '#FFFFFF',
                borderTopWidth: 0,
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                paddingBottom: 8,
                paddingTop: 8,
                height: 70,
                borderRadius: 0,
              },
              headerStyle: {
                backgroundColor: '#1976D2',
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
            })}>
            <Tab.Screen
              name="Home"
              component={PatientHomeStack}
              options={{
                title: 'Home',
                headerShown: false,
              }}
            />
            <Tab.Screen
              name="Appointments"
              component={AppointmentsScreen}
              options={{
                title: 'Appointments',
                headerTitle: 'My Appointments',
              }}
            />
            <Tab.Screen
              name="Profile"
              options={{
                title: 'Profile',
                headerTitle: 'My Profile',
              }}>
              {(props) => <ProfileScreen {...props} onLogout={onLogout} userType="patient" />}
            </Tab.Screen>
          </Tab.Navigator>
        )}
      </Stack.Screen>
      <Stack.Screen 
        name="AIAssistant" 
        component={AIAssistantScreen} 
        options={{
          title: 'Dr. Iffa - AI Health Assistant',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="PatientProfileCompletion" 
        component={PatientProfileCompletionScreen} 
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{
          title: 'Edit Profile',
          headerTitle: 'Edit Profile',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
    </Stack.Navigator>
  );
};

// Doctor App Stack
const DoctorApp = ({onLogout}: {onLogout: () => void}) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        options={{headerShown: false}}>
        {() => (
          <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

                if (route.name === 'Dashboard') {
                  iconName = 'dashboard';
                } else if (route.name === 'Patients') {
                  iconName = 'people';
                } else if (route.name === 'Profile') {
                  iconName = 'person-circle';
                } else {
                  iconName = 'help';
                }

          return <SimpleIcon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          borderRadius: 0,
        },
        headerStyle: {
          backgroundColor: '#1976D2',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}>
      <Tab.Screen
        name="Dashboard"
        component={DoctorDashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'Doctor Dashboard',
        }}
      />
      <Tab.Screen
        name="Patients"
        component={DoctorPatientsScreen}
        options={{
          title: 'Patients',
          headerTitle: 'Patient Management',
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
        }}>
        {(props) => <ProfileScreen {...props} onLogout={onLogout} userType="doctor" />}
      </Tab.Screen>
          </Tab.Navigator>
        )}
      </Stack.Screen>
      <Stack.Screen 
        name="DoctorAppointments" 
        component={DoctorAppointmentsScreen} 
        options={{
          title: 'Appointments',
          headerTitle: 'Appointment Management',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="Records" 
        component={DoctorMedicalRecordsScreen} 
        options={{
          title: 'Records',
          headerTitle: 'Medical Records',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="DoctorEarnings" 
        component={DoctorEarningsScreen} 
        options={{
          title: 'Earnings',
          headerTitle: 'Earnings & Payouts',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="AddPayoutMethod" 
        component={AddPayoutMethodScreen} 
        options={{
          title: 'Add Payout Method',
          headerTitle: 'Add Payout Method',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="PayoutTracking" 
        component={PayoutTrackingScreen} 
        options={{
          title: 'Track Payouts',
          headerTitle: 'Payout Tracking',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="PaymentMethods" 
        component={PaymentMethodsScreen} 
        options={{
          title: 'Payment Methods',
          headerTitle: 'Manage Payment Methods',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="DoctorLabTest" 
        component={DoctorLabTestScreen} 
        options={{
          title: 'Lab Tests',
          headerTitle: 'Lab Tests',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="RequestLabTest" 
        component={RequestLabTestScreen} 
        options={{
          title: 'Request Test',
          headerTitle: 'Request Lab Test',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="AddLabTestNotes" 
        component={AddLabTestNotesScreen} 
        options={{
          title: 'Add Notes',
          headerTitle: 'Add Doctor Notes',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="DoctorPrescriptions" 
        component={DoctorPrescriptionsScreen} 
        options={{
          title: 'Prescriptions',
          headerTitle: 'Prescriptions',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="PrescriptionDetail" 
        component={PrescriptionDetailScreen} 
        options={{
          title: 'Prescription',
          headerTitle: 'Prescription Details',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="NewPrescription" 
        component={NewPrescriptionScreen} 
        options={{
          title: 'New Prescription',
          headerTitle: 'New Prescription',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="MedicationLibrary" 
        component={MedicationLibraryScreen} 
        options={{
          title: 'Medications',
          headerTitle: 'Medication Library',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="AddMedicalRecord" 
        component={AddMedicalRecordScreen} 
        options={{
          title: 'Add Record',
          headerTitle: 'Add Medical Record',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{
          title: 'Edit Profile',
          headerTitle: 'Edit Profile',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="DoctorAvailabilitySettings" 
        component={DoctorAvailabilitySettingsScreen} 
        options={{
          title: 'Availability Settings',
          headerTitle: 'Availability Settings',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="VideoCall" 
        component={VideoCallScreen} 
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

// Home Stack Navigator for additional screens
const PatientHomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{
          title: 'Home',
          headerTitle: 'Home',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold', fontSize: 18},
        }}
      />
      <Stack.Screen 
        name="Medications" 
        component={MedicationsScreen} 
        options={{
          title: 'My Medications',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="LabTests" 
        component={LabTestsScreen} 
        options={{
          title: 'Lab Tests',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="HealthRecords" 
        component={HealthRecordsScreen} 
        options={{
          title: 'Health Records',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="DoctorList" 
        component={DoctorListScreen} 
        options={{
          title: 'Available Doctors',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="DoctorProfile" 
        component={DoctorProfileScreen} 
        options={{
          title: 'Doctor Profile',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="BookAppointment" 
        component={BookAppointmentScreen} 
        options={{
          title: 'Book Appointment',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="PatientProfileCompletion" 
        component={PatientProfileCompletionScreen} 
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen} 
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="PatientLabTest" 
        component={PatientLabTestScreen} 
        options={{
          title: 'Lab Tests',
          headerTitle: 'Lab Tests',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="LabTestResult" 
        component={LabTestResultScreen} 
        options={{
          title: 'Test Results',
          headerTitle: 'Lab Test Results',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="LabTestBooking" 
        component={LabTestBookingScreen} 
        options={{
          title: 'Book Test',
          headerTitle: 'Book Lab Test',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="AddLabTestNotes" 
        component={AddLabTestNotesScreen} 
        options={{
          title: 'Doctor Notes',
          headerTitle: 'Doctor Notes',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{
          title: 'Edit Profile',
          headerTitle: 'Edit Profile',
          headerStyle: {backgroundColor: '#1976D2'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen 
        name="VideoCall" 
        component={VideoCallScreen} 
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
};

// Inner App component that has access to DataContext
const AppContent = ({navigation, route}: any): React.JSX.Element => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setPatientFromLogin, setDoctorFromLogin, doctor } = useData();

  useEffect(() => {
    // Check for existing authentication on app startup
    checkAuthState();
  }, []);

  // Global Linking listener for payment callbacks
  useEffect(() => {
    const handleDeepLink = ({url}: {url: string}) => {
      try {
        console.log('🔗 Deep link received:', url);
        
        // Parse the URL manually for React Native compatibility
        if (url.startsWith('iffahealth://payment-callback')) {
          const urlParts = url.split('?');
          let reference = null;
          
          if (urlParts.length > 1) {
            const params = urlParts[1];
            const referenceMatch = params.match(/reference=([^&]+)/);
            if (referenceMatch) {
              reference = referenceMatch[1];
            }
          }
          
          console.log('💳 Payment callback received with reference:', reference);
          
          if (reference) {
            // Store the reference for the PaymentScreen to pick up
            // The PaymentScreen will handle the verification
            console.log('✅ Payment reference stored for verification:', reference);
          }
        }
      } catch (error) {
        console.error('❌ Error processing deep link:', error);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL when app is opened from a deep link
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        handleDeepLink({url: initialUrl});
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('🔍 Checking authentication state...');
      
      // Test AsyncStorage first
      const asyncStorageWorking = await testAsyncStorage();
      if (!asyncStorageWorking) {
        console.error('❌ AsyncStorage is not working properly');
        setIsLoading(false);
        return;
      }
      
      const storedAuth = await getAuthState();
      console.log('📱 Stored auth state:', storedAuth);
      
      if (storedAuth && isAuthStateValid(storedAuth)) {
        console.log('✅ Valid auth state found, restoring session...');
        
        // Restore axios header first
        if (storedAuth.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedAuth.token}`;
          console.log('🔑 Axios header set with token');
        }
        
        // Restore user data first, then set authentication state
        if (storedAuth.userRole === 'patient' && storedAuth.userData) {
          console.log('👤 Restoring patient data...');
          setPatientFromLogin(storedAuth.userData);
        }
        
        if (storedAuth.userRole === 'doctor' && storedAuth.userData) {
          console.log('👨‍⚕️ Restoring doctor data...');
          setDoctorFromLogin(storedAuth.userData);
        }
        
        // Set authentication state after data is restored
        setUserRole(storedAuth.userRole);
        setIsAuthenticated(storedAuth.isAuthenticated);
        
        console.log('✅ User session restored successfully');
      } else {
        // No valid auth state found, user needs to login
        console.log('❌ No valid auth state found, user needs to login');
        if (storedAuth) {
          console.log('🔍 Auth state exists but is invalid:', {
            isAuthenticated: storedAuth.isAuthenticated,
            userRole: storedAuth.userRole,
            hasToken: !!storedAuth.token,
            tokenValid: storedAuth.token ? isAuthStateValid(storedAuth) : false
          });
        }
      }
    } catch (error) {
      console.error('❌ Error checking auth state:', error);
      // If there's an error, clear the auth state to be safe
      await clearAuthState();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (role: 'patient' | 'doctor', token?: string, userData?: any) => {
    try {
      console.log('🔐 Starting login process for role:', role);
      
      const authState: AuthState = {
        isAuthenticated: true,
        userRole: role,
        loginTime: Date.now(),
        token,
        userData,
      };

      console.log('💾 Saving auth state:', authState);
      // Save auth state to storage first
      await saveAuthState(authState);
      
      // Set up axios default header for API calls
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Axios header set with token');
      }
      
      // Set user data first
      if (role === 'patient' && userData) {
        console.log('👤 Setting patient data...');
        setPatientFromLogin(userData);
      }
      
      if (role === 'doctor' && userData) {
        console.log('👨‍⚕️ Setting doctor data...');
        setDoctorFromLogin(userData);
      }
      
      // Update local state last
      setUserRole(role);
      setIsAuthenticated(true);
      
      console.log('✅ User logged in and auth state saved successfully');
    } catch (error) {
      console.error('❌ Error during login process:', error);
      // If login fails, clear any partial auth state
      await clearAuthState();
      throw error;
    }
  };

  const handleLogout = async () => {
    // Clear stored auth state
    await clearAuthState();
    
    // Update local state
    setIsAuthenticated(false);
    setUserRole(null);
    
    console.log('User logged out and auth state cleared');
  };

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1976D2'}}>
        <SimpleIcon name="hospital" size={60} color="#FFFFFF" />
        <Text style={{color: '#FFFFFF', fontSize: 24, marginTop: 16, fontWeight: 'bold'}}>
          IFFAHEALTH
        </Text>
        <Text style={{color: '#FFFFFF', fontSize: 16, marginTop: 8, opacity: 0.8}}>
          Loading...
        </Text>
        <ActivityIndicator 
          size="large" 
          color="#FFFFFF" 
          style={{marginTop: 20}} 
        />
      </View>
    );
  }

  // If user is a doctor but not verified, show verification message
  if (isAuthenticated && userRole === 'doctor' && doctor && doctor.isVerified === false) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1976D2', padding: 20}}>
        <SimpleIcon name="hospital" size={60} color="#FFFFFF" />
        <Text style={{color: '#FFFFFF', fontSize: 24, marginTop: 16, fontWeight: 'bold', textAlign: 'center'}}>
          Account Pending Verification
        </Text>
        <Text style={{color: '#FFFFFF', fontSize: 16, marginTop: 8, opacity: 0.8, textAlign: 'center', lineHeight: 24}}>
          Your doctor account is currently under review by our admin team. You will be notified once your account is verified and you can access your dashboard.
        </Text>
        <TouchableOpacity 
          style={{backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 20}}
          onPress={handleLogout}
        >
          <Text style={{color: '#1976D2', fontSize: 16, fontWeight: 'bold'}}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    !isAuthenticated ? (
      <AuthStack onLogin={handleLogin} />
    ) : userRole === 'patient' ? (
      <PatientApp onLogout={handleLogout} />
    ) : (
      <DoctorApp onLogout={handleLogout} />
    )
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </DataProvider>
    </SafeAreaProvider>
  );
};

export default App;