import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';

interface LabTestResult {
  status: 'normal' | 'abnormal' | 'pending';
  values: Array<{
    parameter: string;
    value: string;
    normalRange: string;
    status: 'normal' | 'high' | 'low';
  }>;
  notes: string;
  doctorNotes?: string;
}

interface LabTest {
  id: string;
  name: string;
  type: 'blood' | 'urine' | 'imaging' | 'other';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  completedDate?: string;
  doctor: {
    name: string;
    specialty: string;
  };
  lab: {
    name: string;
    address: string;
    phone: string;
  };
  instructions: string;
  results?: LabTestResult;
}

interface LabTestResultScreenProps {
  route: {
    params: {
      test: LabTest;
    };
  };
  navigation: any;
}

const LabTestResultScreen = ({route, navigation}: LabTestResultScreenProps): React.JSX.Element => {
  const {test} = route.params;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#4CAF50';
      case 'abnormal': return '#FF9800';
      case 'pending': return '#2196F3';
      default: return '#666666';
    }
  };

  const getValueStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#4CAF50';
      case 'high': return '#F44336';
      case 'low': return '#FF9800';
      default: return '#666666';
    }
  };

  const getValueStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return 'checkmark-circle';
      case 'high': return 'arrow-up';
      case 'low': return 'arrow-down';
      default: return 'help';
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = `Lab Test Results - ${test.name}\n\n` +
        `Test Date: ${formatDate(test.completedDate!)}\n` +
        `Doctor: ${test.doctor.name}\n` +
        `Lab: ${test.lab.name}\n\n` +
        `Results: ${test.results?.status === 'normal' ? 'Normal' : 'Abnormal'}\n` +
        `Notes: ${test.results?.notes}`;
      
      await Share.share({
        message: shareContent,
        title: 'Lab Test Results',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderResultValue = (value: any, index: number) => (
    <View key={index} style={styles.valueRow}>
      <View style={styles.valueHeader}>
        <Text style={styles.parameterName}>{value.parameter}</Text>
        <View style={[
          styles.valueStatusBadge,
          {backgroundColor: getValueStatusColor(value.status)}
        ]}>
          <SimpleIcon 
            name={getValueStatusIcon(value.status)} 
            size={12} 
            color="#FFFFFF" 
          />
          <Text style={styles.valueStatusText}>
            {value.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.valueDetails}>
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Your Value:</Text>
          <Text style={[
            styles.valueText,
            {color: getValueStatusColor(value.status)}
          ]}>
            {value.value}
          </Text>
        </View>
        
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Normal Range:</Text>
          <Text style={styles.normalRangeText}>{value.normalRange}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.testInfo}>
              <Text style={styles.testName}>{test.name}</Text>
              <Text style={styles.testType}>{test.type.toUpperCase()}</Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(test.results?.status || 'pending')}
            ]}>
              <SimpleIcon 
                name={test.results?.status === 'normal' ? 'checkmark-circle' : 'warning'} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.statusText}>
                {test.results?.status === 'normal' ? 'Normal' : 
                 test.results?.status === 'abnormal' ? 'Abnormal' : 'Pending'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <SimpleIcon name="share" size={20} color="#1976D2" />
          </TouchableOpacity>
        </View>

        {/* Test Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Information</Text>
          
          <View style={styles.detailRow}>
            <SimpleIcon name="calendar" size={16} color="#666666" />
            <Text style={styles.detailText}>
              Completed: {formatDate(test.completedDate!)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <SimpleIcon name="person" size={16} color="#666666" />
            <Text style={styles.detailText}>
              Doctor: {test.doctor.name} - {test.doctor.specialty}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <SimpleIcon name="location" size={16} color="#666666" />
            <Text style={styles.detailText}>{test.lab.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <SimpleIcon name="phone" size={16} color="#666666" />
            <Text style={styles.detailText}>{test.lab.phone}</Text>
          </View>
        </View>

        {/* Results */}
        {test.results && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            
            {test.results.values.map(renderResultValue)}
          </View>
        )}

        {/* Lab Notes */}
        {test.results?.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lab Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{test.results.notes}</Text>
            </View>
          </View>
        )}

        {/* Doctor Notes */}
        {test.results?.doctorNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Doctor's Notes</Text>
            <View style={styles.doctorNotesContainer}>
              <Text style={styles.doctorNotesText}>{test.results.doctorNotes}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => {
              // In real app, this would open phone dialer
              console.log('Contact lab:', test.lab.phone);
            }}>
            <SimpleIcon name="phone" size={16} color="#1976D2" />
            <Text style={styles.contactButtonText}>Contact Lab</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.appointmentButton}
            onPress={() => {
              // In real app, this would navigate to appointment booking
              console.log('Book follow-up appointment');
            }}>
            <SimpleIcon name="calendar" size={16} color="#FFFFFF" />
            <Text style={styles.appointmentButtonText}>Book Follow-up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  testType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  shareButton: {
    padding: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  valueRow: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  valueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  parameterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  valueStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  valueStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  valueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueItem: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  normalRangeText: {
    fontSize: 14,
    color: '#666666',
  },
  notesContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  notesText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  doctorNotesContainer: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  doctorNotesText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 8,
  },
  appointmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    borderRadius: 8,
  },
  appointmentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default LabTestResultScreen;
