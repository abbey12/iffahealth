import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SimpleIcon from '../components/SimpleIcon';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';
import {useData} from '../context/DataContext';
import apiService from '../services/apiService';

interface PatientProfileCompletionScreenProps {
  onComplete?: (profileData: PatientProfileData) => void;
}

interface PatientProfileData {
  // Only additional fields not collected during signup
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  country: string;
  bloodType: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
}

const PatientProfileCompletionScreen = ({onComplete}: PatientProfileCompletionScreenProps): React.JSX.Element => {
  const navigation = useNavigation();
  const {patient, refreshAllData} = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [profileData, setProfileData] = useState<PatientProfileData>({
    dateOfBirth: new Date(1990, 0, 1),
    gender: 'other',
    address: '',
    city: '',
    country: 'Ghana',
    bloodType: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  const totalSteps = 3;

  const handleInputChange = (field: keyof PatientProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('dateOfBirth', selectedDate);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Details (Date of Birth, Gender)
        return !!(profileData.dateOfBirth && profileData.gender);
      case 2: // Location & Health Info (Address, City, Country, Blood Type, Allergies)
        return !!(profileData.address && profileData.city && profileData.country);
      case 3: // Emergency Contact
        return !!(profileData.emergencyContactName && profileData.emergencyContactPhone && profileData.emergencyContactRelation);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    } else {
      Alert.alert('Incomplete Information', 'Please fill in all required fields before proceeding.');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!patient?.id) {
      Alert.alert('Error', 'Patient ID not found. Please try logging in again.');
      return;
    }

    setIsLoading(true);
    try {
      // Token should be available since login now waits for it to be saved
      console.log('Profile completion - Proceeding with API call');
      
      // Prepare the profile data for the API - only send additional fields
      const profileUpdateData: any = {
        dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.toISOString() : '',
        gender: profileData.gender || '',
        address: profileData.address || '',
        city: profileData.city || '',
        country: profileData.country || '',
        bloodType: profileData.bloodType || '',
        allergies: profileData.allergies || '',
        emergencyContactName: profileData.emergencyContactName || '',
        emergencyContactPhone: profileData.emergencyContactPhone || '',
        emergencyContactRelation: profileData.emergencyContactRelation || '',
      };
      
      console.log('Profile update data:', profileUpdateData);

      // Update patient profile via API - use user ID from JWT token
      await apiService.updatePatientProfile(patient.id, profileUpdateData);
      
      // Refresh patient data - only if patient ID exists
      if (patient?.id) {
        await refreshAllData(patient.id);
      }
      
      if (onComplete) {
        onComplete(profileData);
      }
      
      Alert.alert(
        'Profile Completed!',
        'Your profile has been successfully created. You can now access all features of IFFA Health.',
        [
          {
            text: 'Continue',
            onPress: () => {
              (navigation as any).navigate('MainTabs');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Profile completion error:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({length: totalSteps}, (_, index) => (
        <View key={index} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            {backgroundColor: index + 1 <= currentStep ? '#1976D2' : '#E0E0E0'}
          ]}>
            <Text style={[
              styles.stepText,
              {color: index + 1 <= currentStep ? '#FFFFFF' : '#666666'}
            ]}>
              {index + 1}
            </Text>
          </View>
          {index < totalSteps - 1 && (
            <View style={[
              styles.stepLine,
              {backgroundColor: index + 1 < currentStep ? '#1976D2' : '#E0E0E0'}
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Details</Text>
      <Text style={styles.stepDescription}>Tell us about your personal information</Text>

      {/* Show existing user info */}
      <View style={styles.existingInfoContainer}>
        <Text style={styles.existingInfoTitle}>Your Information:</Text>
        <Text style={styles.existingInfoText}>Name: {patient?.firstName} {patient?.lastName}</Text>
        <Text style={styles.existingInfoText}>Email: {patient?.email}</Text>
        <Text style={styles.existingInfoText}>Phone: {patient?.phone || 'Not provided'}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date of Birth *</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerText}>
            {profileData.dateOfBirth.toLocaleDateString()}
          </Text>
          <SimpleIcon name="calendar" size={20} color="#666" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={profileData.dateOfBirth}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                handleInputChange('dateOfBirth', selectedDate);
              }
            }}
            maximumDate={new Date()}
          />
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.genderContainer}>
          {['male', 'female', 'other'].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.genderOption,
                profileData.gender === gender && styles.genderOptionSelected,
              ]}
              onPress={() => handleInputChange('gender', gender)}
            >
              <Text
                style={[
                  styles.genderOptionText,
                  profileData.gender === gender && styles.genderOptionTextSelected,
                ]}
              >
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Location & Health Info</Text>
      <Text style={styles.stepDescription}>Where you live and basic health information</Text>


      <View style={styles.inputContainer}>
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          value={profileData.address}
          onChangeText={(value) => handleInputChange('address', value)}
          placeholder="Enter your address"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={profileData.city}
            onChangeText={(value) => handleInputChange('city', value)}
            placeholder="Enter city"
          />
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Country *</Text>
          <TextInput
            style={styles.input}
            value={profileData.country}
            onChangeText={(value) => handleInputChange('country', value)}
            placeholder="Enter country"
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>Blood Type</Text>
          <TextInput
            style={styles.input}
            value={profileData.bloodType}
            onChangeText={(value) => handleInputChange('bloodType', value)}
            placeholder="e.g., O+, A-"
          />
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Allergies</Text>
          <TextInput
            style={styles.input}
            value={profileData.allergies}
            onChangeText={(value) => handleInputChange('allergies', value)}
            placeholder="e.g., Penicillin, Nuts"
          />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Emergency Contact</Text>
      <Text style={styles.stepDescription}>Who should we contact in case of emergency?</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Contact Name *</Text>
        <TextInput
          style={styles.input}
          value={profileData.emergencyContactName}
          onChangeText={(value) => handleInputChange('emergencyContactName', value)}
          placeholder="Enter emergency contact name"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Contact Phone *</Text>
        <TextInput
          style={styles.input}
          value={profileData.emergencyContactPhone}
          onChangeText={(value) => handleInputChange('emergencyContactPhone', value)}
          placeholder="Enter emergency contact phone"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Relationship *</Text>
        <TextInput
          style={styles.input}
          value={profileData.emergencyContactRelation}
          onChangeText={(value) => handleInputChange('emergencyContactRelation', value)}
          placeholder="e.g., Spouse, Parent, Sibling"
          autoCapitalize="words"
        />
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
        <Text style={styles.headerSubtitle}>Step {currentStep} of {totalSteps}</Text>
      </View>

      {renderStepIndicator()}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.previousButton}
              onPress={handlePrevious}
            >
              <SimpleIcon name="chevron-left" size={20} color="#1976D2" />
              <Text style={styles.previousButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              {flex: currentStep === 1 ? 1 : 0.6}
            ]}
            onPress={handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === totalSteps ? 'Complete' : 'Next'}
                </Text>
                <SimpleIcon name="chevron-right" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={profileData.dateOfBirth}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#1976D2',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stepContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 16,
    color: '#333333',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
  },
  genderOptionSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  genderText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976D2',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  previousButtonText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '600',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#1976D2',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 8,
  },
  existingInfoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  existingInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  existingInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  genderOptionSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
});

export default PatientProfileCompletionScreen;