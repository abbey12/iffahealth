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
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SimpleIcon from '../../components/SimpleIcon';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

const {width, height} = Dimensions.get('window');

interface PatientLoginScreenProps {
  navigation: any;
  onLogin?: (role: 'patient' | 'doctor', token?: string, userData?: any) => Promise<void>;
}

const PatientLoginScreen = ({navigation, onLogin}: PatientLoginScreenProps): React.JSX.Element => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('Starting login process...');
    console.log('API URL:', `${API_CONFIG.BASE_URL}/auth/login`);
    console.log('Email:', email);
    
    setIsLoading(true);
    
    try {
      console.log('Making API request...');
      const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/login`, {
        email,
        password,
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        // Store token and user data
        const { token, user } = response.data.data;
        console.log('Login successful, calling onLogin...');
        
        // Call the login function passed from parent
        if (onLogin) {
          await onLogin('patient', token, user);
        }
      } else {
        console.log('Login failed:', response.data.message);
        Alert.alert('Error', response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      console.log('Login process completed, setting loading to false');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality will be implemented');
  };

  const handleRegister = () => {
    navigation.navigate('Register', { role: 'patient' });
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
          <Text style={styles.welcomeTitle}>Patient Login</Text>
        </View>

        {/* Login Form */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Welcome Back, Patient</Text>
            <Text style={styles.headerSubtitle}>
              Sign in to access your health records and book appointments
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to your patient account</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <SimpleIcon name="email" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <SimpleIcon name="lock" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
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

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

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
                  <Text style={[styles.loginButtonText, {marginLeft: 8}]}>Signing In...</Text>
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
              <Text style={styles.registerLink} onPress={handleRegister}>
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
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

export default PatientLoginScreen;
