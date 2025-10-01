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

const EnhancedPatientProfileCompletionScreen = ({
  onComplete,
}: PatientProfileCompletionScreenProps): React.JSX.Element => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<string>('');

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
    setShowDatePicker(false);
    if (selectedDate && datePickerField) {
      handleInputChange(datePickerField as keyof PatientProfileData, selectedDate);
    }
  };

  const showDatePickerModal = (field: string) => {
    setDatePickerField(field);
    setShowDatePicker(true);
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

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={profileData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
            placeholder="Enter first name"
            autoCapitalize="words"
          />
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={profileData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
            placeholder="Enter last name"
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={profileData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={profileData.phone}
          onChangeText={(value) => handleInputChange('phone', value)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Details</Text>
      <Text style={styles.stepDescription}>Additional information about you</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date of Birth *</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => showDatePickerModal('dateOfBirth')}
        >
          <Text style={styles.dateText}>
            {profileData.dateOfBirth.toLocaleDateString()}
          </Text>
          <SimpleIcon name="calendar" size={20} color="#1976D2" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderContainer}>
            {['male', 'female', 'other'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderOption,
                  {backgroundColor: profileData.gender === gender ? '#1976D2' : '#F5F5F5'}
                ]}
                onPress={() => handleInputChange('gender', gender as 'male' | 'female' | 'other')}
              >
                <Text style={[
                  styles.genderText,
                  {color: profileData.gender === gender ? '#FFFFFF' : '#666666'}
                ]}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Marital Status *</Text>
          <View style={styles.genderContainer}>
            {['single', 'married', 'divorced', 'widowed', 'other'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.genderOption,
                  {backgroundColor: profileData.maritalStatus === status ? '#1976D2' : '#F5F5F5'}
                ]}
                onPress={() => handleInputChange('maritalStatus', status as any)}
              >
                <Text style={[
                  styles.genderText,
                  {color: profileData.maritalStatus === status ? '#FFFFFF' : '#666666'}
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>Occupation</Text>
          <TextInput
            style={styles.input}
            value={profileData.occupation}
            onChangeText={(value) => handleInputChange('occupation', value)}
            placeholder="Enter occupation"
          />
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Employer</Text>
          <TextInput
            style={styles.input}
            value={profileData.employer}
            onChangeText={(value) => handleInputChange('employer', value)}
            placeholder="Enter employer"
          />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Address Information</Text>
      <Text style={styles.stepDescription}>Where are you located?</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.address}
          onChangeText={(value) => handleInputChange('address', value)}
          placeholder="Enter your complete address"
          multiline
          numberOfLines={3}
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
          <Text style={styles.label}>State/Region</Text>
          <TextInput
            style={styles.input}
            value={profileData.state}
            onChangeText={(value) => handleInputChange('state', value)}
            placeholder="Enter state/region"
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>ZIP Code</Text>
          <TextInput
            style={styles.input}
            value={profileData.zipCode}
            onChangeText={(value) => handleInputChange('zipCode', value)}
            placeholder="Enter ZIP code"
            keyboardType="numeric"
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
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Emergency Contact</Text>
      <Text style={styles.stepDescription}>Who should we contact in case of emergency?</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Emergency Contact Name *</Text>
        <TextInput
          style={styles.input}
          value={profileData.emergencyContactName}
          onChangeText={(value) => handleInputChange('emergencyContactName', value)}
          placeholder="Enter emergency contact name"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Emergency Contact Phone *</Text>
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

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Emergency Contact Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.emergencyContactAddress}
          onChangeText={(value) => handleInputChange('emergencyContactAddress', value)}
          placeholder="Enter emergency contact address"
          multiline
          numberOfLines={2}
        />
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Medical Information</Text>
      <Text style={styles.stepDescription}>Help us provide better care (Optional)</Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>Blood Type</Text>
          <TextInput
            style={styles.input}
            value={profileData.bloodType}
            onChangeText={(value) => handleInputChange('bloodType', value)}
            placeholder="e.g., O+, A-, B+"
          />
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={profileData.height}
            onChangeText={(value) => handleInputChange('height', value)}
            placeholder="Enter height"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={profileData.weight}
          onChangeText={(value) => handleInputChange('weight', value)}
          placeholder="Enter weight"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Allergies</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.allergies.join(', ')}
          onChangeText={(value) => handleInputChange('allergies', value.split(', ').filter(item => item.trim() !== ''))}
          placeholder="List any allergies (comma separated)"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Medical Conditions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.medicalConditions.join(', ')}
          onChangeText={(value) => handleInputChange('medicalConditions', value.split(', ').filter(item => item.trim() !== ''))}
          placeholder="List any medical conditions (comma separated)"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Current Medications</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.currentMedications.join(', ')}
          onChangeText={(value) => handleInputChange('currentMedications', value.split(', ').filter(item => item.trim() !== ''))}
          placeholder="List current medications (comma separated)"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Previous Surgeries</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.previousSurgeries}
          onChangeText={(value) => handleInputChange('previousSurgeries', value)}
          placeholder="List any previous surgeries"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Family Medical History</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileData.familyHistory}
          onChangeText={(value) => handleInputChange('familyHistory', value)}
          placeholder="List any family medical history"
          multiline
          numberOfLines={2}
        />
      </View>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Insurance & Preferences</Text>
      <Text style={styles.stepDescription}>Your insurance and communication preferences</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Insurance Provider</Text>
        <TextInput
          style={styles.input}
          value={profileData.insuranceProvider}
          onChangeText={(value) => handleInputChange('insuranceProvider', value)}
          placeholder="Enter insurance company name"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>Insurance Number</Text>
          <TextInput
            style={styles.input}
            value={profileData.insuranceNumber}
            onChangeText={(value) => handleInputChange('insuranceNumber', value)}
            placeholder="Policy number"
          />
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Group Number</Text>
          <TextInput
            style={styles.input}
            value={profileData.insuranceGroupNumber}
            onChangeText={(value) => handleInputChange('insuranceGroupNumber', value)}
            placeholder="Group number"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Insurance Expiry Date</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => showDatePickerModal('insuranceExpiryDate')}
        >
          <Text style={styles.dateText}>
            {profileData.insuranceExpiryDate.toLocaleDateString()}
          </Text>
          <SimpleIcon name="calendar" size={20} color="#1976D2" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Preferred Language</Text>
        <TextInput
          style={styles.input}
          value={profileData.preferredLanguage}
          onChangeText={(value) => handleInputChange('preferredLanguage', value)}
          placeholder="e.g., English, French, Arabic"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Preferred Doctor Gender</Text>
        <View style={styles.genderContainer}>
          {['no-preference', 'male', 'female'].map((preference) => (
            <TouchableOpacity
              key={preference}
              style={[
                styles.genderOption,
                {backgroundColor: profileData.preferredDoctorGender === preference ? '#1976D2' : '#F5F5F5'}
              ]}
              onPress={() => handleInputChange('preferredDoctorGender', preference as any)}
            >
              <Text style={[
                styles.genderText,
                {color: profileData.preferredDoctorGender === preference ? '#FFFFFF' : '#666666'}
              ]}>
                {preference === 'no-preference' ? 'No Preference' : preference.charAt(0).toUpperCase() + preference.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Preferred Appointment Time</Text>
        <View style={styles.genderContainer}>
          {['any', 'morning', 'afternoon', 'evening'].map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.genderOption,
                {backgroundColor: profileData.preferredAppointmentTime === time ? '#1976D2' : '#F5F5F5'}
              ]}
              onPress={() => handleInputChange('preferredAppointmentTime', time as any)}
            >
              <Text style={[
                styles.genderText,
                {color: profileData.preferredAppointmentTime === time ? '#FFFFFF' : '#666666'}
              ]}>
                {time.charAt(0).toUpperCase() + time.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.consentContainer}>
        <TouchableOpacity
          style={styles.consentRow}
          onPress={() => handleInputChange('consentToTelehealth', !profileData.consentToTelehealth)}
        >
          <View style={[
            styles.checkbox,
            {backgroundColor: profileData.consentToTelehealth ? '#1976D2' : '#F5F5F5'}
          ]}>
            {profileData.consentToTelehealth && (
              <SimpleIcon name="check" size={16} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.consentText}>
            I consent to receive telehealth services and understand the limitations and benefits of virtual consultations.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.consentRow}
          onPress={() => handleInputChange('consentToDataSharing', !profileData.consentToDataSharing)}
        >
          <View style={[
            styles.checkbox,
            {backgroundColor: profileData.consentToDataSharing ? '#1976D2' : '#F5F5F5'}
          ]}>
            {profileData.consentToDataSharing && (
              <SimpleIcon name="check" size={16} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.consentText}>
            I consent to the sharing of my medical information with healthcare providers for treatment purposes.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return renderStep1();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <SimpleIcon name="arrow-left" size={24} color="#1976D2" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Complete Patient Profile</Text>
          <Text style={styles.headerSubtitle}>Step {currentStep} of {totalSteps}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.previousButton}
            onPress={handlePrevious}
          >
            <Text style={styles.previousButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            {marginLeft: currentStep === 1 ? 0 : 12}
          ]}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === totalSteps ? 'Complete Profile' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={profileData[datePickerField as keyof PatientProfileData] as Date || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 16,
    color: '#333333',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  consentContainer: {
    marginTop: 20,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  previousButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976D2',
    alignItems: 'center',
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#1976D2',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EnhancedPatientProfileCompletionScreen;
