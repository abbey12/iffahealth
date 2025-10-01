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
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';

interface PatientProfileCompletionScreenProps {
  onComplete?: (profileData: PatientProfileData) => void;
}

interface PatientProfileData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'other';
  
  // Address Information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  emergencyContactAddress: string;
  
  // Medical Information
  bloodType: string;
  height: string;
  weight: string;
  allergies: string[];
  medicalConditions: string[];
  currentMedications: string[];
  previousSurgeries: string;
  familyHistory: string;
  
  // Insurance Information
  insuranceProvider: string;
  insuranceNumber: string;
  insuranceGroupNumber: string;
  insuranceType: 'primary' | 'secondary' | 'tertiary';
  insuranceExpiryDate: Date;
  
  // Preferences
  preferredLanguage: string;
  preferredDoctorGender: 'male' | 'female' | 'no-preference';
  preferredAppointmentTime: 'morning' | 'afternoon' | 'evening' | 'any';
  communicationPreferences: string[];
  
  // Additional Information
  occupation: string;
  employer: string;
  referralSource: string;
  profilePicture?: string;
  consentToTelehealth: boolean;
  consentToDataSharing: boolean;
}

const PatientProfileCompletionScreen = ({
  onComplete,
}: PatientProfileCompletionScreenProps): React.JSX.Element => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [profileData, setProfileData] = useState<PatientProfileData>({
    // Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: new Date(1990, 0, 1),
    gender: 'male',
    maritalStatus: 'single',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Ghana',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    emergencyContactAddress: '',
    
    // Medical Information
    bloodType: '',
    height: '',
    weight: '',
    allergies: [],
    medicalConditions: [],
    currentMedications: [],
    previousSurgeries: '',
    familyHistory: '',
    
    // Insurance Information
    insuranceProvider: '',
    insuranceNumber: '',
    insuranceGroupNumber: '',
    insuranceType: 'primary',
    insuranceExpiryDate: new Date(2025, 11, 31),
    
    // Preferences
    preferredLanguage: 'English',
    preferredDoctorGender: 'no-preference',
    preferredAppointmentTime: 'any',
    communicationPreferences: ['SMS', 'Email'],
    
    // Additional Information
    occupation: '',
    employer: '',
    referralSource: '',
    consentToTelehealth: false,
    consentToDataSharing: false,
  });

  const totalSteps = 6;

  const handleInputChange = (field: keyof PatientProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayChange = (field: keyof PatientProfileData, value: string, action: 'add' | 'remove') => {
    setProfileData(prev => {
      const currentArray = prev[field] as string[];
      if (action === 'add') {
        return {...prev, [field]: [...currentArray, value]};
      } else {
        return {...prev, [field]: currentArray.filter(item => item !== value)};
      }
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleInputChange('dateOfBirth', selectedDate);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Information
        return !!(profileData.firstName && profileData.lastName && profileData.email && profileData.phone);
      case 2: // Personal Details
        return !!(profileData.dateOfBirth && profileData.gender && profileData.maritalStatus);
      case 3: // Address Information
        return !!(profileData.address && profileData.city && profileData.country);
      case 4: // Emergency Contact
        return !!(profileData.emergencyContactName && profileData.emergencyContactPhone && profileData.emergencyContactRelation);
      case 5: // Medical Information
        return true; // Optional fields
      case 6: // Insurance & Preferences
        return profileData.consentToTelehealth && profileData.consentToDataSharing;
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
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
              // Navigate to main app or home screen
              (navigation as any).navigate('Home');
            },
          },
        ]
      );
    } catch (error) {
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
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>Tell us about yourself</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={profileData.firstName}
          onChangeText={(text) => handleInputChange('firstName', text)}
          placeholder="Enter your first name"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={profileData.lastName}
          onChangeText={(text) => handleInputChange('lastName', text)}
          placeholder="Enter your last name"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={profileData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={profileData.phone}
          onChangeText={(text) => handleInputChange('phone', text)}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Details</Text>
      <Text style={styles.stepDescription}>Additional information about you</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Birth *</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {profileData.dateOfBirth.toLocaleDateString()}
          </Text>
          <SimpleIcon name="calendar-today" size={20} color="#1976D2" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.genderContainer}>
          {['male', 'female', 'other'].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.genderOption,
                profileData.gender === gender && styles.genderOptionSelected,
              ]}
              onPress={() => handleInputChange('gender', gender as 'male' | 'female' | 'other')}
            >
              <Text
                style={[
                  styles.genderText,
                  profileData.gender === gender && styles.genderTextSelected,
                ]}
              >
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          value={profileData.address}
          onChangeText={(text) => handleInputChange('address', text)}
          placeholder="Enter your address"
          multiline
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={profileData.city}
            onChangeText={(text) => handleInputChange('city', text)}
            placeholder="City"
          />
        </View>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            value={profileData.state}
            onChangeText={(text) => handleInputChange('state', text)}
            placeholder="State"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>ZIP Code</Text>
        <TextInput
          style={styles.input}
          value={profileData.zipCode}
          onChangeText={(text) => handleInputChange('zipCode', text)}
          placeholder="ZIP Code"
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Emergency Contact</Text>
      <Text style={styles.stepDescription}>Who should we contact in case of emergency?</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Emergency Contact Name *</Text>
        <TextInput
          style={styles.input}
          value={profileData.emergencyContactName}
          onChangeText={(text) => handleInputChange('emergencyContactName', text)}
          placeholder="Enter emergency contact name"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Emergency Contact Phone *</Text>
        <TextInput
          style={styles.input}
          value={profileData.emergencyContactPhone}
          onChangeText={(text) => handleInputChange('emergencyContactPhone', text)}
          placeholder="Enter emergency contact phone"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Relationship *</Text>
        <TextInput
          style={styles.input}
          value={profileData.emergencyContactRelation}
          onChangeText={(text) => handleInputChange('emergencyContactRelation', text)}
          placeholder="e.g., Spouse, Parent, Sibling"
          autoCapitalize="words"
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Medical Information</Text>
      <Text style={styles.stepDescription}>Help us provide better care (Optional)</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Blood Type</Text>
        <TextInput
          style={styles.input}
          value={profileData.bloodType}
          onChangeText={(text) => handleInputChange('bloodType', text)}
          placeholder="e.g., O+, A-, B+"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Allergies</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.allergies}
          onChangeText={(text) => handleInputChange('allergies', text)}
          placeholder="List any allergies you have"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Medical Conditions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.medicalConditions}
          onChangeText={(text) => handleInputChange('medicalConditions', text)}
          placeholder="List any medical conditions"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Current Medications</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.currentMedications}
          onChangeText={(text) => handleInputChange('currentMedications', text)}
          placeholder="List current medications"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Insurance Provider</Text>
        <TextInput
          style={styles.input}
          value={profileData.insuranceProvider}
          onChangeText={(text) => handleInputChange('insuranceProvider', text)}
          placeholder="Insurance company name"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Insurance Number</Text>
          <TextInput
            style={styles.input}
            value={profileData.insuranceNumber}
            onChangeText={(text) => handleInputChange('insuranceNumber', text)}
            placeholder="Policy number"
          />
        </View>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Group Number</Text>
          <TextInput
            style={styles.input}
            value={profileData.insuranceGroupNumber}
            onChangeText={(text) => handleInputChange('insuranceGroupNumber', text)}
            placeholder="Group number"
          />
        </View>
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
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Step {currentStep} of {totalSteps}</Text>
        {renderStepIndicator()}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.previousButton}
            onPress={handlePrevious}
            disabled={isLoading}
          >
            <SimpleIcon name="arrow-back" size={20} color="#1976D2" />
            <Text style={styles.previousButtonText}>Previous</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            !validateStep(currentStep) && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!validateStep(currentStep) || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === totalSteps ? 'Complete Profile' : 'Next'}
              </Text>
              {currentStep < totalSteps && (
                <SimpleIcon name="arrow-forward" size={20} color="#ffffff" />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={profileData.dateOfBirth}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: '#1976D2',
  },
  stepDotInactive: {
    backgroundColor: '#E0E0E0',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
    backgroundColor: '#ffffff',
  },
  dateText: {
    fontSize: 16,
    color: '#1A1A1A',
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
    backgroundColor: '#ffffff',
  },
  genderOptionSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  genderText: {
    fontSize: 16,
    color: '#666666',
  },
  genderTextSelected: {
    color: '#1976D2',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 0.48,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  previousButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976D2',
    backgroundColor: '#ffffff',
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 8,
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#1976D2',
  },
  nextButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
});

export default PatientProfileCompletionScreen;
