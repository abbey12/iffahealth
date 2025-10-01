import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  recentVisit?: string;
}

interface AddMedicalRecordScreenProps {
  navigation: any;
}

const AddMedicalRecordScreen = ({navigation}: AddMedicalRecordScreenProps): React.JSX.Element => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [recordType, setRecordType] = useState<string>('');
  const [quickNotes, setQuickNotes] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string>('');
  const [selectedTreatment, setSelectedTreatment] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [vitalSigns, setVitalSigns] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
  });

  const patients: Patient[] = [
    {
      id: '1',
      name: 'John Doe',
      age: 35,
      gender: 'Male',
      phone: '+233 24 123 4567',
      recentVisit: '2 days ago',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      age: 28,
      gender: 'Female',
      phone: '+233 24 987 6543',
      recentVisit: '1 week ago',
    },
    {
      id: '3',
      name: 'Michael Brown',
      age: 45,
      gender: 'Male',
      phone: '+233 24 555 1234',
      recentVisit: '3 days ago',
    },
    {
      id: '4',
      name: 'Emily Davis',
      age: 32,
      gender: 'Female',
      phone: '+233 24 777 8888',
      recentVisit: '5 days ago',
    },
    {
      id: '5',
      name: 'David Wilson',
      age: 52,
      gender: 'Male',
      phone: '+233 24 111 2222',
      recentVisit: '1 day ago',
    },
    {
      id: '6',
      name: 'Lisa Anderson',
      age: 29,
      gender: 'Female',
      phone: '+233 24 333 4444',
      recentVisit: '4 days ago',
    },
    {
      id: '7',
      name: 'Robert Taylor',
      age: 41,
      gender: 'Male',
      phone: '+233 24 555 6666',
      recentVisit: '6 days ago',
    },
    {
      id: '8',
      name: 'Maria Garcia',
      age: 38,
      gender: 'Female',
      phone: '+233 24 777 9999',
      recentVisit: '2 weeks ago',
    },
    {
      id: '9',
      name: 'James Miller',
      age: 56,
      gender: 'Male',
      phone: '+233 24 888 0000',
      recentVisit: '3 days ago',
    },
    {
      id: '10',
      name: 'Jennifer White',
      age: 33,
      gender: 'Female',
      phone: '+233 24 999 1111',
      recentVisit: '1 week ago',
    },
  ];

  const recordTypes = [
    {id: 'consultation', name: 'Quick Consultation', icon: 'medical-services', color: '#2196F3'},
    {id: 'follow_up', name: 'Follow-up', icon: 'refresh', color: '#4CAF50'},
    {id: 'emergency', name: 'Emergency', icon: 'warning', color: '#F44336'},
  ];

  const commonDiagnoses = [
    'Hypertension', 'Diabetes Type 2', 'Upper Respiratory Infection', 'Gastroenteritis',
    'Headache', 'Back Pain', 'Anxiety', 'Depression', 'Allergic Rhinitis', 'UTI',
    'Common Cold', 'Flu', 'Migraine', 'Arthritis', 'Asthma'
  ];

  const commonTreatments = [
    'Prescription Medication', 'Rest & Hydration', 'Physical Therapy', 'Diet Modification',
    'Lifestyle Changes', 'Follow-up in 1 week', 'Refer to Specialist', 'Immediate Care',
    'Pain Management', 'Antibiotics', 'Anti-inflammatory', 'Blood Pressure Monitoring'
  ];

  const handleCreateRecord = () => {
    if (!selectedPatient) {
      Alert.alert('Quick Fix', 'Please select a patient.');
      return;
    }

    if (!recordType) {
      Alert.alert('Quick Fix', 'Please select visit type.');
      return;
    }

    // Auto-generate title based on selections
    const autoTitle = `${recordType.replace('_', ' ').toUpperCase()} - ${selectedPatient.name}`;
    
    Alert.alert(
      'Save Record',
      `Save ${recordType} for ${selectedPatient.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Save',
          onPress: () => {
            // In real app, this would make API call
            Alert.alert('✅ Saved', 'Record saved successfully!');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleQuickDiagnosis = (diagnosis: string) => {
    setSelectedDiagnosis(diagnosis);
    setQuickNotes(prev => prev ? `${prev}\n• ${diagnosis}` : `• ${diagnosis}`);
  };

  const handleQuickTreatment = (treatment: string) => {
    setSelectedTreatment(treatment);
    setQuickNotes(prev => prev ? `${prev}\n• ${treatment}` : `• ${treatment}`);
  };

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery) ||
    patient.id.includes(searchQuery)
  );

  const renderPatientCard = (patient: Patient) => (
    <TouchableOpacity
      key={patient.id}
      style={[
        styles.patientCard,
        selectedPatient?.id === patient.id && styles.patientCardSelected,
      ]}
      onPress={() => setSelectedPatient(patient)}>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{patient.name}</Text>
        <Text style={styles.patientDetails}>
          {patient.age}y • {patient.gender}
        </Text>
        {patient.recentVisit && (
          <Text style={styles.recentVisit}>Last visit: {patient.recentVisit}</Text>
        )}
      </View>
      {selectedPatient?.id === patient.id && (
        <SimpleIcon name="checkmark-circle" size={20} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );

  const renderRecordType = (type: any) => (
    <TouchableOpacity
      key={type.id}
      style={[
        styles.recordTypeCard,
        recordType === type.id && styles.recordTypeCardSelected,
        {borderColor: type.color},
      ]}
      onPress={() => setRecordType(type.id)}>
      <SimpleIcon 
        name={type.icon} 
        size={20} 
        color={recordType === type.id ? '#FFFFFF' : type.color} 
      />
      <Text style={[
        styles.recordTypeText,
        recordType === type.id && styles.recordTypeTextSelected,
      ]}>
        {type.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <SimpleIcon name="search" size={20} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search patients by name, phone, or ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <SimpleIcon name="close" size={16} color="#666666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Patient Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👤 Select Patient</Text>
            {searchQuery.length > 0 && (
              <Text style={styles.resultsCount}>
                {filteredPatients.length} result{filteredPatients.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          {filteredPatients.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filteredPatients.map(renderPatientCard)}
            </ScrollView>
          ) : (
            <View style={styles.noResultsContainer}>
              <SimpleIcon name="search" size={40} color="#CCCCCC" />
              <Text style={styles.noResultsText}>No patients found</Text>
              <Text style={styles.noResultsSubtext}>Try a different search term</Text>
            </View>
          )}
        </View>

        {/* Quick Visit Type */}
        {selectedPatient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏥 Visit Type</Text>
            <View style={styles.recordTypesContainer}>
              {recordTypes.map(renderRecordType)}
            </View>
          </View>
        )}

        {/* Quick Vitals (Optional) */}
        {selectedPatient && recordType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Quick Vitals (Optional)</Text>
            <View style={styles.vitalsGrid}>
              <View style={styles.vitalInput}>
                <Text style={styles.vitalLabel}>BP</Text>
                <TextInput
                  style={styles.vitalTextInput}
                  placeholder="120/80"
                  value={vitalSigns.bloodPressure}
                  onChangeText={(text) => setVitalSigns(prev => ({...prev, bloodPressure: text}))}
                />
              </View>
              <View style={styles.vitalInput}>
                <Text style={styles.vitalLabel}>HR</Text>
                <TextInput
                  style={styles.vitalTextInput}
                  placeholder="72"
                  value={vitalSigns.heartRate}
                  onChangeText={(text) => setVitalSigns(prev => ({...prev, heartRate: text}))}
                />
              </View>
              <View style={styles.vitalInput}>
                <Text style={styles.vitalLabel}>Temp</Text>
                <TextInput
                  style={styles.vitalTextInput}
                  placeholder="98.6°F"
                  value={vitalSigns.temperature}
                  onChangeText={(text) => setVitalSigns(prev => ({...prev, temperature: text}))}
                />
              </View>
              <View style={styles.vitalInput}>
                <Text style={styles.vitalLabel}>Weight</Text>
                <TextInput
                  style={styles.vitalTextInput}
                  placeholder="70kg"
                  value={vitalSigns.weight}
                  onChangeText={(text) => setVitalSigns(prev => ({...prev, weight: text}))}
                />
              </View>
            </View>
          </View>
        )}

        {/* Quick Diagnosis */}
        {selectedPatient && recordType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 Quick Diagnosis</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {commonDiagnoses.map((diagnosis, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickButton,
                    selectedDiagnosis === diagnosis && styles.quickButtonSelected
                  ]}
                  onPress={() => handleQuickDiagnosis(diagnosis)}>
                  <Text style={[
                    styles.quickButtonText,
                    selectedDiagnosis === diagnosis && styles.quickButtonTextSelected
                  ]}>
                    {diagnosis}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Treatment */}
        {selectedPatient && recordType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💊 Quick Treatment</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {commonTreatments.map((treatment, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickButton,
                    selectedTreatment === treatment && styles.quickButtonSelected
                  ]}
                  onPress={() => handleQuickTreatment(treatment)}>
                  <Text style={[
                    styles.quickButtonText,
                    selectedTreatment === treatment && styles.quickButtonTextSelected
                  ]}>
                    {treatment}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Notes */}
        {selectedPatient && recordType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Quick Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Add any additional notes..."
              value={quickNotes}
              onChangeText={setQuickNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Save Button */}
        {selectedPatient && recordType && (
          <View style={styles.createButtonContainer}>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateRecord}>
              <SimpleIcon name="save" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Save Record</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  resultsCount: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginTop: 12,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 160,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  patientCardSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  patientDetails: {
    fontSize: 12,
    color: '#666666',
  },
  recentVisit: {
    fontSize: 10,
    color: '#1976D2',
    marginTop: 2,
  },
  recordTypesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  recordTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recordTypeCardSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  recordTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    marginTop: 4,
    textAlign: 'center',
  },
  recordTypeTextSelected: {
    color: '#FFFFFF',
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  vitalInput: {
    flex: 1,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  vitalTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    color: '#1A1A1A',
    textAlign: 'center',
    width: '100%',
  },
  quickButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickButtonSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  quickButtonTextSelected: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  createButtonContainer: {
    padding: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    paddingVertical: 16,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default AddMedicalRecordScreen;
