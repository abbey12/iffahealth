import React, {useState, useEffect} from 'react';
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
import {useData} from '../context/DataContext';
import apiService from '../services/apiService';

interface EditProfileScreenProps {
  route?: {
    params?: {
      userType?: 'patient' | 'doctor';
    };
  };
}

interface PatientProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  country: string;
  bloodType: string;
  allergies: string;
  currentMedications: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
}

interface DoctorProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  medicalSchool: string;
  graduationYear: string;
  hospitalAffiliation: string;
  practiceAddress: string;
  city: string;
  consultationFee: string;
  bio: string;
  languages: string;
  experienceYears: string;
}

const EditProfileScreen = ({route}: EditProfileScreenProps): React.JSX.Element => {
  const userType = route?.params?.userType || 'patient';
  const navigation = useNavigation();
  const {patient, doctor, refreshAllData} = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<string>('');

  // Get current user data
  const currentUser = userType === 'patient' ? patient : doctor;

  // Initialize with real data from context
  const [patientData, setPatientData] = useState<PatientProfileData>({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    dateOfBirth: currentUser?.dateOfBirth ? new Date(currentUser.dateOfBirth) : new Date(1990, 5, 15),
    gender: (currentUser as any)?.gender || 'other',
    address: (currentUser as any)?.address || '',
    city: (currentUser as any)?.city || '',
    country: (currentUser as any)?.country || 'Ghana',
    bloodType: (currentUser as any)?.bloodType || '',
    allergies: Array.isArray((currentUser as any)?.allergies) ? (currentUser as any).allergies.join(', ') : ((currentUser as any)?.allergies || ''),
    currentMedications: Array.isArray((currentUser as any)?.currentMedications) ? (currentUser as any).currentMedications.join(', ') : ((currentUser as any)?.currentMedications || ''),
    emergencyContactName: (currentUser as any)?.emergencyContactName || '',
    emergencyContactPhone: (currentUser as any)?.emergencyContactPhone || '',
    emergencyContactRelation: (currentUser as any)?.emergencyContactRelation || '',
  });

  const [doctorData, setDoctorData] = useState<DoctorProfileData>({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    specialty: (currentUser as any)?.specialty || '',
    licenseNumber: (currentUser as any)?.licenseNumber || '',
    medicalSchool: (currentUser as any)?.medicalSchool || '',
    graduationYear: (currentUser as any)?.graduationYear || '',
    hospitalAffiliation: (currentUser as any)?.hospitalAffiliation || '',
    practiceAddress: (currentUser as any)?.practiceAddress || '',
    city: (currentUser as any)?.city || '',
    consultationFee: (currentUser as any)?.consultationFee?.toString() || '',
    bio: (currentUser as any)?.bio || '',
    languages: Array.isArray((currentUser as any)?.languages) ? (currentUser as any).languages.join(', ') : ((currentUser as any)?.languages || ''),
    experienceYears: (currentUser as any)?.experienceYears?.toString() || '',
  });

  const currentData = userType === 'patient' ? patientData : doctorData;
  const setCurrentData = userType === 'patient' ? setPatientData : setDoctorData;

  // Update data when user data changes
  useEffect(() => {
    if (currentUser) {
      if (userType === 'patient') {
        setPatientData({
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          dateOfBirth: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth) : new Date(1990, 5, 15),
          gender: (currentUser as any)?.gender || 'other',
          address: (currentUser as any)?.address || '',
          city: (currentUser as any)?.city || '',
          country: (currentUser as any)?.country || 'Ghana',
          bloodType: (currentUser as any)?.bloodType || '',
          allergies: Array.isArray((currentUser as any)?.allergies) ? (currentUser as any).allergies.join(', ') : ((currentUser as any)?.allergies || ''),
          currentMedications: Array.isArray((currentUser as any)?.currentMedications) ? (currentUser as any).currentMedications.join(', ') : ((currentUser as any)?.currentMedications || ''),
          emergencyContactName: (currentUser as any)?.emergencyContactName || '',
          emergencyContactPhone: (currentUser as any)?.emergencyContactPhone || '',
          emergencyContactRelation: (currentUser as any)?.emergencyContactRelation || '',
        });
      } else {
        setDoctorData({
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          specialty: (currentUser as any)?.specialty || '',
          licenseNumber: (currentUser as any)?.licenseNumber || '',
          medicalSchool: (currentUser as any)?.medicalSchool || '',
          graduationYear: (currentUser as any)?.graduationYear || '',
          hospitalAffiliation: (currentUser as any)?.hospitalAffiliation || '',
          practiceAddress: (currentUser as any)?.practiceAddress || '',
          city: (currentUser as any)?.city || '',
          consultationFee: (currentUser as any)?.consultationFee?.toString() || '',
          bio: (currentUser as any)?.bio || '',
          languages: Array.isArray((currentUser as any)?.languages) ? (currentUser as any).languages.join(', ') : ((currentUser as any)?.languages || ''),
          experienceYears: (currentUser as any)?.experienceYears?.toString() || '',
        });
      }
    }
  }, [currentUser, userType]);

  // Force refresh form data when context data changes (after save)
  useEffect(() => {
    if (currentUser) {
      console.log('Context data updated, refreshing form data:', currentUser);
      if (userType === 'patient') {
        setPatientData({
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          dateOfBirth: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth) : new Date(1990, 5, 15),
          gender: (currentUser as any)?.gender || 'other',
          address: (currentUser as any)?.address || '',
          city: (currentUser as any)?.city || '',
          country: (currentUser as any)?.country || 'Ghana',
          bloodType: (currentUser as any)?.bloodType || '',
          allergies: Array.isArray((currentUser as any)?.allergies) ? (currentUser as any).allergies.join(', ') : ((currentUser as any)?.allergies || ''),
          currentMedications: Array.isArray((currentUser as any)?.currentMedications) ? (currentUser as any).currentMedications.join(', ') : ((currentUser as any)?.currentMedications || ''),
          emergencyContactName: (currentUser as any)?.emergencyContactName || '',
          emergencyContactPhone: (currentUser as any)?.emergencyContactPhone || '',
          emergencyContactRelation: (currentUser as any)?.emergencyContactRelation || '',
        });
      } else {
        setDoctorData({
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          specialty: (currentUser as any)?.specialty || '',
          licenseNumber: (currentUser as any)?.licenseNumber || '',
          medicalSchool: (currentUser as any)?.medicalSchool || '',
          graduationYear: (currentUser as any)?.graduationYear || '',
          hospitalAffiliation: (currentUser as any)?.hospitalAffiliation || '',
          practiceAddress: (currentUser as any)?.practiceAddress || '',
          city: (currentUser as any)?.city || '',
          consultationFee: (currentUser as any)?.consultationFee?.toString() || '',
          bio: (currentUser as any)?.bio || '',
          languages: Array.isArray((currentUser as any)?.languages) ? (currentUser as any).languages.join(', ') : ((currentUser as any)?.languages || ''),
          experienceYears: (currentUser as any)?.experienceYears?.toString() || '',
        });
      }
    }
  }, [currentUser?.id, currentUser?.firstName, currentUser?.lastName, currentUser?.phone, currentUser?.dateOfBirth, (currentUser as any)?.address, (currentUser as any)?.city, (currentUser as any)?.bloodType, (currentUser as any)?.allergies, (currentUser as any)?.currentMedications, userType]);

  const handleInputChange = (field: string, value: any) => {
    setCurrentData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && datePickerField) {
      handleInputChange(datePickerField, selectedDate);
    }
  };

  const showDatePickerModal = (field: string) => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (userType === 'patient') {
        // Simple patient data mapping - only essential fields
        const patientUpdateData = {
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          phone: patientData.phone,
          dateOfBirth: patientData.dateOfBirth.toISOString(),
          gender: patientData.gender,
          address: patientData.address,
          city: patientData.city,
          country: patientData.country,
          bloodType: patientData.bloodType,
          // Only send array fields if they have content
          ...(patientData.allergies && patientData.allergies.trim() && { 
            allergies: patientData.allergies.split(',').map(item => item.trim()).filter(item => item) 
          }),
          ...(patientData.currentMedications && patientData.currentMedications.trim() && { 
            currentMedications: patientData.currentMedications.split(',').map(item => item.trim()).filter(item => item) 
          }),
          emergencyContactName: patientData.emergencyContactName,
          emergencyContactPhone: patientData.emergencyContactPhone,
          emergencyContactRelation: patientData.emergencyContactRelation,
        };

        // Debug: Log the data we're sending
        console.log('Sending patient update data:', JSON.stringify(patientUpdateData, null, 2));
        
        // Call API to update patient profile
        await apiService.updatePatientProfile(currentUser?.id, patientUpdateData);
        
        // Refresh patient data - this will trigger the useEffect to update form data
        if (currentUser?.id) {
          await refreshAllData(currentUser.id);
        }
      } else {
        // Simple doctor data mapping
        const doctorUpdateData = {
          firstName: doctorData.firstName,
          lastName: doctorData.lastName,
          phone: doctorData.phone,
          specialty: doctorData.specialty,
          licenseNumber: doctorData.licenseNumber,
          medicalSchool: doctorData.medicalSchool,
          graduationYear: doctorData.graduationYear,
          hospitalAffiliation: doctorData.hospitalAffiliation,
          practiceAddress: doctorData.practiceAddress,
          city: doctorData.city,
          consultationFee: doctorData.consultationFee ? parseFloat(doctorData.consultationFee) : 0,
          bio: doctorData.bio,
          experienceYears: doctorData.experienceYears ? parseInt(doctorData.experienceYears) : 0,
          // Only send array fields if they have content
          ...(doctorData.languages && doctorData.languages.trim() && { 
            languages: doctorData.languages.split(',').map(item => item.trim()).filter(item => item) 
          }),
        };

        // Call API to update doctor profile
        await apiService.updateDoctorProfile(currentUser?.id, doctorUpdateData);
      }
      
      Alert.alert(
        'Profile Updated!',
        'Your profile has been successfully updated.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPatientForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      
      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={patientData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
            placeholder="Enter first name"
          />
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={patientData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
            placeholder="Enter last name"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={patientData.email}
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
          value={patientData.phone}
          onChangeText={(value) => handleInputChange('phone', value)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>Date of Birth *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => showDatePickerModal('dateOfBirth')}
          >
            <Text style={styles.dateText}>
              {patientData.dateOfBirth.toLocaleDateString()}
            </Text>
            <SimpleIcon name="calendar" size={20} color="#1976D2" />
          </TouchableOpacity>
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderContainer}>
            {['male', 'female', 'other'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderOption,
                  patientData.gender === gender && styles.genderOptionSelected,
                ]}
                onPress={() => handleInputChange('gender', gender)}
              >
                <Text
                  style={[
                    styles.genderText,
                    patientData.gender === gender && styles.genderTextSelected,
                  ]}
                >
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Address Information</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Street Address</Text>
        <TextInput
          style={styles.input}
          value={patientData.address}
          onChangeText={(value) => handleInputChange('address', value)}
          placeholder="Enter street address"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={patientData.city}
            onChangeText={(value) => handleInputChange('city', value)}
            placeholder="Enter city"
          />
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={patientData.country}
            onChangeText={(value) => handleInputChange('country', value)}
            placeholder="Enter country"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Health Information</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Blood Type</Text>
        <TextInput
          style={styles.input}
          value={patientData.bloodType}
          onChangeText={(value) => handleInputChange('bloodType', value)}
          placeholder="e.g., O+, A-, B+"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Allergies</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={patientData.allergies}
          onChangeText={(value) => handleInputChange('allergies', value)}
          placeholder="List any allergies (comma-separated)"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Current Medications</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={patientData.currentMedications}
          onChangeText={(value) => handleInputChange('currentMedications', value)}
          placeholder="List current medications (comma-separated)"
          multiline
          numberOfLines={2}
        />
      </View>

      <Text style={styles.sectionTitle}>Emergency Contact</Text>
      
      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>Contact Name</Text>
          <TextInput
            style={styles.input}
            value={patientData.emergencyContactName}
            onChangeText={(value) => handleInputChange('emergencyContactName', value)}
            placeholder="Enter contact name"
          />
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Contact Phone</Text>
          <TextInput
            style={styles.input}
            value={patientData.emergencyContactPhone}
            onChangeText={(value) => handleInputChange('emergencyContactPhone', value)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Relationship</Text>
        <TextInput
          style={styles.input}
          value={patientData.emergencyContactRelation}
          onChangeText={(value) => handleInputChange('emergencyContactRelation', value)}
          placeholder="e.g., Spouse, Parent, Sibling"
        />
      </View>
    </View>
  );

  const renderDoctorForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={doctorData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
            placeholder="Enter first name"
          />
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={doctorData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
            placeholder="Enter last name"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={doctorData.email}
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
          value={doctorData.phone}
          onChangeText={(value) => handleInputChange('phone', value)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>

      <Text style={styles.sectionTitle}>Professional Information</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Specialty *</Text>
        <TextInput
          style={styles.input}
          value={doctorData.specialty}
          onChangeText={(value) => handleInputChange('specialty', value)}
          placeholder="Enter medical specialty"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, {flex: 1, marginRight: 8}]}>
          <Text style={styles.label}>License Number *</Text>
          <TextInput
            style={styles.input}
            value={doctorData.licenseNumber}
            onChangeText={(value) => handleInputChange('licenseNumber', value)}
            placeholder="Enter license number"
          />
        </View>
        <View style={[styles.inputContainer, {flex: 1, marginLeft: 8}]}>
          <Text style={styles.label}>Consultation Fee</Text>
          <TextInput
            style={styles.input}
            value={doctorData.consultationFee}
            onChangeText={(value) => handleInputChange('consultationFee', value)}
            placeholder="Enter fee"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Medical School</Text>
        <TextInput
          style={styles.input}
          value={doctorData.medicalSchool}
          onChangeText={(value) => handleInputChange('medicalSchool', value)}
          placeholder="Enter medical school"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Hospital Affiliation</Text>
        <TextInput
          style={styles.input}
          value={doctorData.hospitalAffiliation}
          onChangeText={(value) => handleInputChange('hospitalAffiliation', value)}
          placeholder="Enter hospital affiliation"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Practice Address</Text>
        <TextInput
          style={styles.input}
          value={doctorData.practiceAddress}
          onChangeText={(value) => handleInputChange('practiceAddress', value)}
          placeholder="Enter practice address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={doctorData.bio}
          onChangeText={(value) => handleInputChange('bio', value)}
          placeholder="Enter bio"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Languages</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={doctorData.languages}
          onChangeText={(value) => handleInputChange('languages', value)}
          placeholder="Enter languages (comma-separated)"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          value={doctorData.experienceYears}
          onChangeText={(value) => handleInputChange('experienceYears', value)}
          placeholder="Enter years of medical experience"
          keyboardType="numeric"
        />
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {userType === 'patient' ? renderPatientForm() : renderDoctorForm()}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <SimpleIcon name="save" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={currentData.dateOfBirth}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formContainer: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
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
    color: '#333333',
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  genderOptionSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
  saveContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#1976D2',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EditProfileScreen;