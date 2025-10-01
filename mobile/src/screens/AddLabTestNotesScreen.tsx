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

interface PatientLabTest {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  testName: string;
  type: 'blood' | 'urine' | 'imaging' | 'other';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  requestedDate: string;
  scheduledDate: string;
  completedDate?: string;
  lab: {
    name: string;
    address: string;
    phone: string;
  };
  results?: {
    status: 'normal' | 'abnormal' | 'pending';
    values: Array<{
      parameter: string;
      value: string;
      normalRange: string;
      status: 'normal' | 'high' | 'low';
    }>;
    notes: string;
  };
  doctorNotes?: string;
}

interface AddLabTestNotesScreenProps {
  route: {
    params: {
      test: PatientLabTest;
    };
  };
  navigation: any;
}

const AddLabTestNotesScreen = ({route, navigation}: AddLabTestNotesScreenProps): React.JSX.Element => {
  const {test} = route.params;
  const [notes, setNotes] = useState(test.doctorNotes || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveNotes = async () => {
    if (!notes.trim()) {
      Alert.alert('Error', 'Please enter some notes before saving.');
      return;
    }

    setIsLoading(true);
    try {
      // In real app, this would make API call
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      Alert.alert('Success', 'Doctor notes saved successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <SimpleIcon name="arrow-back" size={24} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Doctor Notes</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Test Information */}
        <View style={styles.testInfoCard}>
          <View style={styles.testHeader}>
            <View style={styles.testInfo}>
              <View style={styles.testTitleRow}>
                <SimpleIcon 
                  name={getTypeIcon(test.type)} 
                  size={20} 
                  color={getTypeColor(test.type)} 
                />
                <Text style={styles.testName}>{test.testName}</Text>
              </View>
              <Text style={styles.patientInfo}>
                {test.patientName} • {test.patientAge}y • {test.patientGender}
              </Text>
            </View>
          </View>

          <View style={styles.testDetails}>
            <View style={styles.detailRow}>
              <SimpleIcon name="calendar" size={16} color="#666666" />
              <Text style={styles.detailText}>
                Completed: {formatDate(test.completedDate!)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <SimpleIcon name="location" size={16} color="#666666" />
              <Text style={styles.detailText}>{test.lab.name}</Text>
            </View>
          </View>
        </View>

        {/* Test Results Summary */}
        {test.results && (
          <View style={styles.resultsCard}>
            <Text style={styles.sectionTitle}>Test Results Summary</Text>
            
            <View style={styles.resultsSummary}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Status:</Text>
                <Text style={[
                  styles.resultValue,
                  {color: test.results.status === 'normal' ? '#4CAF50' : '#FF9800'}
                ]}>
                  {test.results.status === 'normal' ? 'Normal' : 'Abnormal'}
                </Text>
              </View>
              
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Parameters:</Text>
                <Text style={styles.resultValue}>{test.results.values.length} tested</Text>
              </View>
            </View>

            {test.results.notes && (
              <View style={styles.labNotesContainer}>
                <Text style={styles.labNotesTitle}>Lab Notes:</Text>
                <Text style={styles.labNotesText}>{test.results.notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Doctor Notes Input */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Doctor Notes</Text>
          <Text style={styles.sectionSubtitle}>
            Add your professional interpretation and recommendations for this patient.
          </Text>
          
          <TextInput
            style={styles.notesInput}
            placeholder="Enter your notes here..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
          
          <View style={styles.characterCount}>
            <Text style={styles.characterCountText}>
              {notes.length} characters
            </Text>
          </View>
        </View>

        {/* Guidelines */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>Guidelines for Doctor Notes</Text>
          <View style={styles.guidelinesList}>
            <View style={styles.guidelineItem}>
              <SimpleIcon name="checkmark" size={16} color="#4CAF50" />
              <Text style={styles.guidelineText}>Interpret abnormal values and their clinical significance</Text>
            </View>
            <View style={styles.guidelineItem}>
              <SimpleIcon name="checkmark" size={16} color="#4CAF50" />
              <Text style={styles.guidelineText}>Provide clear recommendations for follow-up care</Text>
            </View>
            <View style={styles.guidelineItem}>
              <SimpleIcon name="checkmark" size={16} color="#4CAF50" />
              <Text style={styles.guidelineText}>Explain any concerns or red flags to the patient</Text>
            </View>
            <View style={styles.guidelineItem}>
              <SimpleIcon name="checkmark" size={16} color="#4CAF50" />
              <Text style={styles.guidelineText}>Suggest lifestyle modifications if applicable</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSaveNotes}
            disabled={isLoading}>
            {isLoading ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <>
                <SimpleIcon name="save" size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Notes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 32,
  },
  testInfoCard: {
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
  testHeader: {
    marginBottom: 12,
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
  patientInfo: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  testDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultItem: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  labNotesContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  labNotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  labNotesText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  notesSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  notesInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    textAlignVertical: 'top',
    minHeight: 120,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: '#666666',
  },
  guidelinesCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  guidelinesList: {
    gap: 8,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guidelineText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#1976D2',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A0C4E8',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default AddLabTestNotesScreen;
