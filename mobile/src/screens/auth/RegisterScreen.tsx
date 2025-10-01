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
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import SimpleIcon from '../../components/SimpleIcon';
import SpecialtyDropdown from '../../components/SpecialtyDropdown';
import GenderDropdown from '../../components/GenderDropdown';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

const {width, height} = Dimensions.get('window');

interface RegisterScreenProps {
  navigation: any;
  route: any;
}

const RegisterScreen = ({navigation, route}: RegisterScreenProps): React.JSX.Element => {
  const {role} = route.params || {role: 'patient'};
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    // Address Information
    streetAddress: '',
    city: '',
    country: 'Ghana', // Default to Ghana
    // Insurance Information
    insuranceProvider: '',
    insuranceNumber: '',
    insuranceStartDate: '',
    insuranceExpiryDate: '',
    // Doctor fields
    specialty: '',
    medicalSchool: '',
    graduationYear: '',
    hospitalAffiliation: '',
    practiceAddress: '',
    consultationFee: '',
    bio: '',
    languages: '',
    experienceYears: '',
  });
  const [showPassword, setShowPassword] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showInsuranceStartDatePicker, setShowInsuranceStartDatePicker] = useState(false);
  const [showInsuranceExpiryDatePicker, setShowInsuranceExpiryDatePicker] = useState(false);
  const [selectedInsuranceStartDate, setSelectedInsuranceStartDate] = useState(new Date());
  const [selectedInsuranceExpiryDate, setSelectedInsuranceExpiryDate] = useState(new Date());

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      setFormData(prev => ({...prev, dateOfBirth: formattedDate}));
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const handleInsuranceStartDateChange = (event: any, selectedDate?: Date) => {
    setShowInsuranceStartDatePicker(false);
    if (selectedDate) {
      setSelectedInsuranceStartDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      setFormData(prev => ({...prev, insuranceStartDate: formattedDate}));
    }
  };

  const handleInsuranceExpiryDateChange = (event: any, selectedDate?: Date) => {
    setShowInsuranceExpiryDatePicker(false);
    if (selectedDate) {
      setSelectedInsuranceExpiryDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      setFormData(prev => ({...prev, insuranceExpiryDate: formattedDate}));
    }
  };

  const showInsuranceStartDatePickerModal = () => {
    setShowInsuranceStartDatePicker(true);
  };

  const showInsuranceExpiryDatePickerModal = () => {
    setShowInsuranceExpiryDatePicker(true);
  };

  const handleRegister = async () => {
    const {
      firstName, lastName, email, password, confirmPassword, phone, dateOfBirth, gender,
      streetAddress, city, country, insuranceProvider, insuranceNumber, insuranceStartDate, insuranceExpiryDate,
      specialty, medicalSchool, graduationYear, hospitalAffiliation, practiceAddress, consultationFee, bio, languages, experienceYears
    } = formData;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Patient-specific validation
    if (role === 'patient') {
      if (!dateOfBirth || !gender) {
        Alert.alert('Error', 'Please fill in all required patient profile fields (Date of Birth and Gender)');
        return;
      }
    }

    // Doctor-specific validation
    if (role === 'doctor') {
      if (!specialty || !medicalSchool || !graduationYear || !hospitalAffiliation || !practiceAddress || !city || !consultationFee || !bio || !languages || !experienceYears) {
        Alert.alert('Error', 'Please fill in all doctor profile fields');
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const registrationData = {
        firstName,
        lastName,
        email,
        password,
        role,
        phone,
        ...(role === 'patient' && {
          dateOfBirth,
          gender,
          streetAddress,
          city,
          country,
          insuranceProvider,
          insuranceNumber,
          ...(insuranceStartDate && { insuranceStartDate }),
          ...(insuranceExpiryDate && { insuranceExpiryDate }),
        }),
        ...(role === 'doctor' && { 
          specialty, 
          licenseNumber: `LIC-${Date.now()}`,
          medicalSchool,
          graduationYear,
          hospitalAffiliation,
          practiceAddress,
          city,
          consultationFee: parseFloat(consultationFee) || 0,
          bio,
          languages: languages.split(',').map(lang => lang.trim()),
          experienceYears: parseInt(experienceYears) || 0,
        }),
      };

      const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/register`, registrationData);

      if (response.data.success) {
        Alert.alert(
          'Registration Successful',
          `Your ${role} account has been created successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate directly to main app for both patients and doctors
                navigation.navigate('MainTabs');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle validation errors with detailed messages
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map((err: any) => {
          const field = err.path.charAt(0).toUpperCase() + err.path.slice(1);
          return `${field}: ${err.msg}`;
        });
        Alert.alert('Validation Error', errorMessages.join('\n'));
      } else {
        const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
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
          <Text style={styles.welcomeTitle}>
            {role === 'patient' ? 'Patient' : 'Doctor'} Registration
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Create your {role} account
          </Text>
        </View>

        {/* Registration Form */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account</Text>
          <Text style={styles.formSubtitle}>
            Fill in your details to get started
          </Text>

          {/* Name Fields */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <View style={styles.inputWrapper}>
                <SimpleIcon name="person" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="First name"
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <View style={styles.inputWrapper}>
                <SimpleIcon name="person" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Last name"
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address *</Text>
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

          {/* Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <View style={styles.inputWrapper}>
              <SimpleIcon name="phone" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Patient-specific fields */}
          {role === 'patient' && (
            <>
              {/* Date of Birth */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date of Birth *</Text>
                <TouchableOpacity style={styles.inputWrapper} onPress={showDatePickerModal}>
                  <SimpleIcon name="calendar-today" size={20} color="#666666" style={styles.inputIcon} />
                  <Text style={[styles.textInput, !formData.dateOfBirth && styles.placeholderText]}>
                    {formData.dateOfBirth || 'Select your date of birth'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Gender */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Gender *</Text>
                <GenderDropdown
                  selectedGender={formData.gender}
                  onGenderSelect={(gender) => handleInputChange('gender', gender)}
                  placeholder="Select your gender"
                />
              </View>

              {/* Address Section */}
              <Text style={styles.sectionTitle}>Address Information</Text>
              
              {/* Street Address */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Street Address</Text>
                <View style={styles.inputWrapper}>
                  <SimpleIcon name="home" size={20} color="#666666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your street address"
                    value={formData.streetAddress}
                    onChangeText={(value) => handleInputChange('streetAddress', value)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* City and Country */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>City</Text>
                  <View style={styles.inputWrapper}>
                    <SimpleIcon name="location-city" size={20} color="#666666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="City"
                      value={formData.city}
                      onChangeText={(value) => handleInputChange('city', value)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <View style={styles.inputWrapper}>
                    <SimpleIcon name="public" size={20} color="#666666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Country"
                      value={formData.country}
                      onChangeText={(value) => handleInputChange('country', value)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>

              {/* Insurance Section */}
              <Text style={styles.sectionTitle}>Insurance Information (Optional)</Text>
              
              {/* Insurance Provider */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Insurance Provider</Text>
                <View style={styles.inputWrapper}>
                  <SimpleIcon name="account-balance" size={20} color="#666666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., NHIS, Private Insurance"
                    value={formData.insuranceProvider}
                    onChangeText={(value) => handleInputChange('insuranceProvider', value)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Policy Number */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Policy Number</Text>
                <View style={styles.inputWrapper}>
                  <SimpleIcon name="credit-card" size={20} color="#666666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your policy number"
                    value={formData.insuranceNumber}
                    onChangeText={(value) => handleInputChange('insuranceNumber', value)}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Insurance Dates */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={showInsuranceStartDatePickerModal}
                  >
                    <SimpleIcon name="event" size={20} color="#666666" style={styles.inputIcon} />
                    <Text style={[
                      styles.textInput,
                      !formData.insuranceStartDate && styles.placeholderText
                    ]}>
                      {formData.insuranceStartDate || 'Select start date'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={showInsuranceExpiryDatePickerModal}
                  >
                    <SimpleIcon name="event" size={20} color="#666666" style={styles.inputIcon} />
                    <Text style={[
                      styles.textInput,
                      !formData.insuranceExpiryDate && styles.placeholderText
                    ]}>
                      {formData.insuranceExpiryDate || 'Select expiry date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* Specialty (for doctors) */}
          {role === 'doctor' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Medical Specialty *</Text>
              <View style={styles.dropdownWrapper}>
                <SimpleIcon name="medical-services" size={20} color="#666666" style={styles.inputIcon} />
                <SpecialtyDropdown
                  selectedSpecialty={formData.specialty}
                  onSpecialtySelect={(specialty) => handleInputChange('specialty', specialty)}
                  placeholder="Select your medical specialty"
                />
              </View>
            </View>
          )}

          {/* Medical School (for doctors) */}
          {role === 'doctor' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Medical School *</Text>
              <View style={styles.inputWrapper}>
                <SimpleIcon name="school" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Name of your medical school"
                  value={formData.medicalSchool}
                  onChangeText={(value) => handleInputChange('medicalSchool', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          {/* Graduation Year (for doctors) */}
          {role === 'doctor' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Graduation Year *</Text>
              <View style={styles.inputWrapper}>
                <SimpleIcon name="calendar-today" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Year of graduation"
                  value={formData.graduationYear}
                  onChangeText={(value) => handleInputChange('graduationYear', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Hospital Affiliation (for doctors) */}
          {role === 'doctor' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Hospital Affiliation *</Text>
              <View style={styles.inputWrapper}>
                <SimpleIcon name="local-hospital" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Current hospital or clinic"
                  value={formData.hospitalAffiliation}
                  onChangeText={(value) => handleInputChange('hospitalAffiliation', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          {/* Practice Address (for doctors) */}
          {role === 'doctor' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Practice Address *</Text>
              <View style={styles.inputWrapper}>
                <SimpleIcon name="location-on" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Your practice address"
                  value={formData.practiceAddress}
                  onChangeText={(value) => handleInputChange('practiceAddress', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          {/* City (for doctors) */}
          {role === 'doctor' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>City *</Text>
              <View style={styles.inputWrapper}>
                <SimpleIcon name="place" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="City where you practice"
                  value={formData.city}
                  onChangeText={(value) => handleInputChange('city', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          {/* Consultation Fee (for doctors) */}
          {role === 'doctor' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Consultation Fee (GHS) *</Text>
              <View style={styles.inputWrapper}>
                <SimpleIcon name="attach-money" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Your consultation fee"
                  value={formData.consultationFee}
                  onChangeText={(value) => handleInputChange('consultationFee', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Bio (for doctors) */}
          {role === 'doctor' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bio *</Text>
              <View style={styles.inputWrapper}>
                <SimpleIcon name="person" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Tell patients about yourself"
                  value={formData.bio}
                  onChangeText={(value) => handleInputChange('bio', value)}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          )}

          {/* Languages (for doctors) */}
          {role === 'doctor' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Languages *</Text>
              <View style={styles.inputWrapper}>
                <SimpleIcon name="language" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="English, French, Twi (comma separated)"
                  value={formData.languages}
                  onChangeText={(value) => handleInputChange('languages', value)}
                />
              </View>
            </View>
          )}

          {/* Experience Years (for doctors) */}
          {role === 'doctor' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Years of Experience *</Text>
              <View style={styles.inputWrapper}>
                <SimpleIcon name="work" size={20} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Years of medical experience"
                  value={formData.experienceYears}
                  onChangeText={(value) => handleInputChange('experienceYears', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password *</Text>
            <View style={styles.inputWrapper}>
              <SimpleIcon name="lock" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Create a password"
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

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password *</Text>
            <View style={styles.inputWrapper}>
              <SimpleIcon name="lock" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <SimpleIcon 
                  name={showConfirmPassword ? 'visibility' : 'visibility-off'} 
                  size={20} 
                  color="#666666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}>
            <LinearGradient
              colors={isLoading ? ['#BDBDBD', '#9E9E9E'] : ['#1976D2', '#42A5F5']}
              style={styles.registerButtonGradient}>
              {isLoading ? (
                <View style={styles.registerButtonContent}>
                  <Text style={styles.registerButtonText}>Creating Account...</Text>
                </View>
              ) : (
                <View style={styles.registerButtonContent}>
                  <Text style={styles.registerButtonText}>Create Account</Text>
                  <SimpleIcon name="arrow-forward" size={20} color="#FFFFFF" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text 
                style={styles.loginLink} 
                onPress={() => navigation.navigate(role === 'patient' ? 'PatientLogin' : 'DoctorLogin')}>
                Sign in here
              </Text>
            </Text>
          </View>
          </View>
        </ScrollView>

        {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}

      {/* Insurance Start Date Picker Modal */}
      {showInsuranceStartDatePicker && (
        <DateTimePicker
          value={selectedInsuranceStartDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleInsuranceStartDateChange}
          maximumDate={new Date(2100, 11, 31)}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}

      {/* Insurance Expiry Date Picker Modal */}
      {showInsuranceExpiryDatePicker && (
        <DateTimePicker
          value={selectedInsuranceExpiryDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleInsuranceExpiryDateChange}
          maximumDate={new Date(2100, 11, 31)}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
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
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    marginBottom: 20,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfInput: {
    width: '48%',
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
  dropdownWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  eyeButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  registerButton: {
    marginBottom: 24,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonGradient: {
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
  registerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
    textAlign: 'center',
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666666',
  },
  loginLink: {
    color: '#1976D2',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 20,
    marginBottom: 15,
    marginLeft: 5,
  },
  placeholderText: {
    color: '#999999',
  },
});

export default RegisterScreen;
