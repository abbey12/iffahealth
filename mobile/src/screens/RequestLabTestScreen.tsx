import React, {useEffect, useState} from 'react';
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
import {useData} from '../context/DataContext';
import { apiService } from '../services/apiService';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
}

interface LabTest {
  id: string;
  name: string;
  type: 'blood' | 'urine' | 'imaging' | 'other';
  description: string;
  category: string;
}

interface Lab {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
}

const RequestLabTestScreen = ({navigation}: any): React.JSX.Element => {
  const { doctor } = useData();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Load real patients for this doctor
  useEffect(() => {
    const loadPatients = async () => {
      if (!doctor?.id) return;
      try {
        setLoadingPatients(true);
        const resp = await apiService.getDoctorPatients(doctor.id, { limit: 100 });
        if (resp.success && Array.isArray(resp.data)) {
          const mapped: Patient[] = resp.data.map((p: any) => ({
            id: p.id || p.patient_id,
            name: `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim() || 'Patient',
            age: p.age || 0,
            gender: p.gender || 'Unknown',
            phone: p.phone || p.contact_phone || '',
          }));
          setPatients(mapped);
        } else {
          setPatients([]);
        }
      } catch (e) {
        setPatients([]);
      } finally {
        setLoadingPatients(false);
      }
    };
    loadPatients();
  }, [doctor?.id]);

  // Patients are loaded from API (see useEffect above)

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery) ||
    patient.id.includes(searchQuery)
  );

  const availableTests: LabTest[] = [
    {
      id: '1',
      name: 'Complete Blood Count (CBC)',
      type: 'blood',
      description: 'Measures different components of blood including red and white blood cells, platelets, and hemoglobin.',
      category: 'General Health',
    },
    {
      id: '2',
      name: 'Lipid Profile',
      type: 'blood',
      description: 'Measures cholesterol levels, triglycerides, and other fats in the blood.',
      category: 'Cardiovascular',
    },
    {
      id: '3',
      name: 'Blood Glucose Test',
      type: 'blood',
      description: 'Measures blood sugar levels to screen for diabetes.',
      category: 'Diabetes',
    },
    {
      id: '4',
      name: 'Urinalysis',
      type: 'urine',
      description: 'Analyzes urine for various substances to detect infections or diseases.',
      category: 'General Health',
    },
    {
      id: '5',
      name: 'Chest X-Ray',
      type: 'imaging',
      description: 'X-ray imaging of the chest to examine lungs, heart, and chest wall.',
      category: 'Imaging',
    },
    {
      id: '6',
      name: 'Thyroid Function Test',
      type: 'blood',
      description: 'Measures thyroid hormone levels to assess thyroid function.',
      category: 'Endocrine',
    },
    {
      id: '7',
      name: 'Liver Function Test',
      type: 'blood',
      description: 'Measures enzymes and proteins to assess liver health.',
      category: 'General Health',
    },
    {
      id: '8',
      name: 'Kidney Function Test',
      type: 'blood',
      description: 'Measures creatinine and other markers to assess kidney function.',
      category: 'General Health',
    },
  ];

  const availableLabs: Lab[] = [
    {
      id: '1',
      name: 'Accra Medical Lab',
      address: '123 Lab Street, Accra',
      phone: '+233 24 123 4567',
      rating: 4.8,
    },
    {
      id: '2',
      name: 'Ghana Health Lab',
      address: '456 Health Avenue, Accra',
      phone: '+233 24 987 6543',
      rating: 4.6,
    },
    {
      id: '3',
      name: 'Radiology Center',
      address: '789 Imaging Road, Accra',
      phone: '+233 24 555 1234',
      rating: 4.9,
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blood': return 'water';
      case 'urine': return 'flask';
      case 'imaging': return 'scan';
      case 'other': return 'medical';
      default: return 'help';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blood': return '#F44336';
      case 'urine': return '#FF9800';
      case 'imaging': return '#2196F3';
      case 'other': return '#9C27B0';
      default: return '#666666';
    }
  };

  const getUrgencyColor = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'routine': return '#4CAF50';
      case 'urgent': return '#FF9800';
      case 'stat': return '#F44336';
      default: return '#666666';
    }
  };

  const handleRequestTest = async () => {
    if (!selectedPatient || !selectedTest || !selectedLab) {
      Alert.alert('Missing Information', 'Please select a patient, test, and lab.');
      return;
    }
    try {
      // Build API payload using existing service
      const payload = {
        patient_id: selectedPatient.id,
        test_name: selectedTest.name,
        test_type: selectedTest.type,
        ordered_by: doctor?.id,
        test_date: new Date().toISOString().slice(0,10),
        test_time: '09:00',
        location: selectedLab.address || selectedLab.name,
        notes,
      } as any;
      await apiService.createDoctorLabTest(payload);
      Alert.alert('Success', 'Lab test requested successfully!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to request lab test. Please try again.');
    }
  };

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
        <Text style={styles.patientPhone}>{patient.phone}</Text>
      </View>
      {selectedPatient?.id === patient.id && (
        <SimpleIcon name="checkmark-circle" size={20} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );

  const renderTestCard = (test: LabTest) => (
    <TouchableOpacity
      key={test.id}
      style={[
        styles.testCard,
        selectedTest?.id === test.id && styles.testCardSelected,
      ]}
      onPress={() => setSelectedTest(test)}>
      <View style={styles.testHeader}>
        <View style={styles.testInfo}>
          <View style={styles.testTitleRow}>
            <SimpleIcon 
              name={getTypeIcon(test.type)} 
              size={20} 
              color={getTypeColor(test.type)} 
            />
            <Text style={styles.testName}>{test.name}</Text>
          </View>
          <Text style={styles.testCategory}>{test.category}</Text>
        </View>
        {selectedTest?.id === test.id && (
          <SimpleIcon name="checkmark-circle" size={20} color="#4CAF50" />
        )}
      </View>
      
      <Text style={styles.testDescription}>{test.description}</Text>
    </TouchableOpacity>
  );

  const renderLabCard = (lab: Lab) => (
    <TouchableOpacity
      key={lab.id}
      style={[
        styles.labCard,
        selectedLab?.id === lab.id && styles.labCardSelected,
      ]}
      onPress={() => setSelectedLab(lab)}>
      <View style={styles.labHeader}>
        <View style={styles.labInfo}>
          <Text style={styles.labName}>{lab.name}</Text>
          <View style={styles.labRating}>
            <SimpleIcon name="star" size={14} color="#FFC107" />
            <Text style={styles.ratingText}>{lab.rating}</Text>
          </View>
        </View>
        {selectedLab?.id === lab.id && (
          <SimpleIcon name="checkmark-circle" size={20} color="#4CAF50" />
        )}
      </View>
      
      <Text style={styles.labAddress}>{lab.address}</Text>
      <Text style={styles.labPhone}>{lab.phone}</Text>
    </TouchableOpacity>
  );

  const renderUrgencyButton = (urgencyLevel: string, label: string) => (
    <TouchableOpacity
      key={urgencyLevel}
      style={[
        styles.urgencyButton,
        {backgroundColor: getUrgencyColor(urgencyLevel)},
        urgency === urgencyLevel && styles.urgencyButtonSelected,
      ]}
      onPress={() => setUrgency(urgencyLevel as any)}>
      <Text style={[
        styles.urgencyButtonText,
        urgency === urgencyLevel && styles.urgencyButtonTextSelected,
      ]}>
        {label}
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

        {/* Step 1: Select Patient */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Select Patient</Text>
            {searchQuery.length > 0 && (
              <Text style={styles.resultsCount}>
                {filteredPatients.length} result{filteredPatients.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          {loadingPatients ? (
            <View style={styles.noResultsContainer}><Text>Loading patients…</Text></View>
          ) : filteredPatients.length > 0 ? (
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

        {/* Step 2: Select Test */}
        {selectedPatient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Select Test</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableTests.map(renderTestCard)}
            </ScrollView>
          </View>
        )}

        {/* Step 3: Select Lab */}
        {selectedPatient && selectedTest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Select Lab</Text>
            {availableLabs.map(renderLabCard)}
          </View>
        )}

        {/* Step 4: Set Urgency */}
        {selectedPatient && selectedTest && selectedLab && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Set Urgency Level</Text>
            <View style={styles.urgencyContainer}>
              {renderUrgencyButton('routine', 'Routine')}
              {renderUrgencyButton('urgent', 'Urgent')}
              {renderUrgencyButton('stat', 'STAT')}
            </View>
          </View>
        )}

        {/* Step 5: Instructions */}
        {selectedPatient && selectedTest && selectedLab && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Test Instructions</Text>
            <TextInput
              style={styles.instructionsInput}
              placeholder="Enter specific instructions for the lab..."
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* Step 6: Additional Notes */}
        {selectedPatient && selectedTest && selectedLab && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Additional Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Any additional notes or special requirements..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* Request Summary */}
        {selectedPatient && selectedTest && selectedLab && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Request Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Patient:</Text>
              <Text style={styles.summaryValue}>{selectedPatient.name}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Test:</Text>
              <Text style={styles.summaryValue}>{selectedTest.name}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Lab:</Text>
              <Text style={styles.summaryValue}>{selectedLab.name}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Urgency:</Text>
              <Text style={[styles.summaryValue, {color: getUrgencyColor(urgency)}]}>
                {urgency.toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {/* Request Button */}
        {selectedPatient && selectedTest && selectedLab && (
          <View style={styles.requestButtonContainer}>
            <TouchableOpacity style={styles.requestButton} onPress={handleRequestTest}>
              <SimpleIcon name="send" size={20} color="#FFFFFF" />
              <Text style={styles.requestButtonText}>Request Lab Test</Text>
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
  patientPhone: {
    fontSize: 10,
    color: '#1976D2',
    marginTop: 2,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  testCardSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  testInfo: {
    flex: 1,
  },
  testTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  testCategory: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  testDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  labCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  labCardSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  labHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  labInfo: {
    flex: 1,
  },
  labName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  labRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 4,
  },
  labAddress: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  labPhone: {
    fontSize: 14,
    color: '#1976D2',
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  urgencyButtonSelected: {
    borderColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  urgencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  urgencyButtonTextSelected: {
    fontWeight: 'bold',
  },
  instructionsInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    textAlignVertical: 'top',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
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
  requestButtonContainer: {
    padding: 20,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    paddingVertical: 16,
    borderRadius: 8,
  },
  requestButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default RequestLabTestScreen;
