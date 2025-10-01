import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SimpleIcon from '../../components/SimpleIcon';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

const {width, height} = Dimensions.get('window');

interface DoctorLoginScreenProps {
  navigation: any;
  onLogin?: (role: 'patient' | 'doctor', token?: string, userData?: any) => Promise<void>;
}

const DoctorLoginScreen = ({navigation, onLogin}: DoctorLoginScreenProps): React.JSX.Element => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleLogin = async () => {
    const {email, password} = formData;

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/login`, {
        email,
        password,
        role: 'doctor',
      });

      if (response.data.success) {
        const userData = response.data.data.user;
        const profile = userData.profile;
        
        // Check if doctor is verified
        if (profile && profile.is_verified === false) {
          Alert.alert(
            'Account Pending Verification',
            'Your doctor account is currently under review by our admin team. You will be notified once your account is verified and you can access your dashboard.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Call the onLogin callback if provided
        if (onLogin) {
          await onLogin('doctor', response.data.data.token, response.data.data.user);
        } else {
          // Fallback navigation
          Alert.alert(
            'Login Successful',
            'Welcome back, Doctor!',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigate to doctor dashboard
                  navigation.navigate('DoctorDashboard');
                },
              },
            ]
          );
        }
      } else {
        Alert.alert('Error', response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorData = error.response?.data;
      
      // Handle specific verification status
      if (errorData?.code === 'PENDING_VERIFICATION') {
        Alert.alert(
          'Account Pending Verification',
          'Your doctor account is currently under review by our admin team. You will be notified once your account is verified and you can access your dashboard.',
          [{ text: 'OK' }]
        );
      } else {
        const errorMessage = errorData?.message || 'Login failed. Please try again.';
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1976D2', '#42A5F5', '#90CAF9']}
        style={styles.backgroundGradient}
      >
        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Doctor Login</Text>
        </View>

        {/* Login Form */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Welcome Back, Doctor</Text>
            <Text style={styles.headerSubtitle}>
              Sign in to access your medical dashboard and manage your patients
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>
              Sign in to your doctor account
            </Text>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <SimpleIcon name="email" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <SimpleIcon name="lock" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}>
                <SimpleIcon 
                  name={showPassword ? 'visibility' : 'visibility-off'} 
                  size={20} 
                  color="#666666" 
                />
              </TouchableOpacity>
            </View>
          </View>


          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}>
            <LinearGradient
              colors={isLoading ? ['#BDBDBD', '#9E9E9E'] : ['#1976D2', '#42A5F5']}
              style={styles.loginButtonGradient}>
              {isLoading ? (
                <View style={styles.loginButtonContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>Signing In...</Text>
                </View>
              ) : (
                <View style={styles.loginButtonContent}>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <SimpleIcon name="arrow-forward" size={20} color="#FFFFFF" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text 
                style={styles.registerLink} 
                onPress={() => navigation.navigate('Register', {role: 'doctor'})}>
                Register here
              </Text>
            </Text>
          </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1976D2',
  },
  
  // Background and Decorative Elements
  backgroundGradient: {
    flex: 1,
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 100,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: -100,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  // Welcome Section
  welcomeSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Content Layout
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginTop: 0,
    marginBottom: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  loginButton: {
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
    textAlign: 'center',
  },
  registerContainer: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#666666',
  },
  registerLink: {
    color: '#1976D2',
    fontWeight: '600',
  },
});

export default DoctorLoginScreen;