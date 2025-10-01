import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import {useData} from '../context/DataContext';
import apiService from '../services/apiService';

interface PatientLabTest {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  testName: string;
  testType: string;
  type: string;
  patientAge?: number;
  patientGender?: string;
  status: 'scheduled' | 'pending' | 'completed' | 'cancelled' | 'failed';
  date: string;
  time: string;
  location: string;
  lab?: string;
  completedDate?: string;
  scheduledDate?: string;
  results?: any;
  notes?: string;
  doctorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const DoctorLabTestScreen = ({navigation}: any): React.JSX.Element => {
  const {doctor} = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [labTests, setLabTests] = useState<PatientLabTest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (doctor?.id) {
      loadLabTests();
    }
  }, [doctor?.id, selectedStatus]);

  const loadLabTests = async () => {
    if (!doctor?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading lab tests for doctor:', doctor.id);
      console.log('🔍 Selected status:', selectedStatus);
      
      // Map frontend status to backend status
      const backendStatus = selectedStatus === 'in_progress' ? 'pending' : selectedStatus;
      
      const response = await apiService.getDoctorLabTests(doctor.id, {
        page: 1,
        limit: 50,
        status: backendStatus === 'all' ? undefined : backendStatus
      });

      console.log('📊 Lab Tests API Response:', response);

      if (response.success && response.data) {
        // Transform API data to match our interface
        const transformedTests = response.data.map((test: any) => ({
          id: test.id,
          patientId: test.patientId,
          patientName: test.patientName || 'Unknown Patient',
          patientPhone: test.patientPhone,
          testName: test.testName || 'Unknown Test',
          testType: test.testType || 'unknown',
          type: test.testType || 'unknown', // Add type property
          status: test.status as 'scheduled' | 'pending' | 'completed' | 'cancelled' | 'failed',
          date: test.date || test.createdAt,
          time: test.time || '00:00',
          location: test.location || 'Unknown Location',
          results: test.results,
          notes: test.notes,
          doctorNotes: test.doctorNotes,
          createdAt: test.createdAt,
          updatedAt: test.updatedAt
        }));

        setLabTests(transformedTests);
        console.log('✅ Loaded lab tests:', transformedTests.length, 'tests');
      } else {
        console.log('❌ No lab tests data in response');
        setLabTests([]);
      }
    } catch (err) {
      console.error('❌ Error loading lab tests:', err);
      setError('Failed to load lab tests');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLabTests();
    setRefreshing(false);
  };

  const handleStatusFilter = (status: 'all' | 'scheduled' | 'in_progress' | 'completed' | 'pending') => {
    setSelectedStatus(status);
  };

  const handleViewResults = (test: PatientLabTest) => {
    // Navigate to results screen
    navigation.navigate('LabTestResults', {test});
  };

  const handleAddNotes = (test: PatientLabTest) => {
    // Navigate to add notes screen
    navigation.navigate('AddLabTestNotes', {test});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'scheduled':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'schedule';
      case 'scheduled':
        return 'event';
      case 'cancelled':
        return 'cancel';
      case 'failed':
        return 'error-outline';
      default:
        return 'help-outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'In Progress';
      case 'scheduled':
        return 'Scheduled';
      case 'cancelled':
        return 'Cancelled';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'blood':
        return 'bloodtype';
      case 'urine':
        return 'science';
      case 'x-ray':
      case 'mri':
      case 'ct':
        return 'image';
      default:
        return 'medical-services';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderStatusFilter = (status: 'all' | 'scheduled' | 'in_progress' | 'completed' | 'pending', label: string) => (
    <TouchableOpacity
      key={status}
      style={[
        styles.filterButton,
        selectedStatus === status && styles.activeFilterButton
      ]}
      onPress={() => handleStatusFilter(status)}>
      <Text style={[
        styles.filterButtonText,
        selectedStatus === status && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderLabTest = (test: PatientLabTest) => (
    <View key={test.id} style={styles.testCard}>
      <View style={styles.testHeader}>
        <View style={styles.testInfo}>
          <View style={styles.testTitleRow}>
            <SimpleIcon name={getTypeIcon(test.type)} size={20} color="#1976D2" />
            <Text style={styles.testName}>{test.testName}</Text>
          </View>
          <Text style={styles.patientName}>{test.patientName}</Text>
          <Text style={styles.patientPhone}>{test.patientPhone}</Text>
        </View>
        <View style={styles.statusContainer}>
          <SimpleIcon 
            name={getStatusIcon(test.status)} 
            size={16} 
            color={getStatusColor(test.status)} 
          />
          <Text style={[styles.statusText, {color: getStatusColor(test.status)}]}>
            {getStatusText(test.status)}
          </Text>
        </View>
      </View>

      <View style={styles.testDetails}>
        <View style={styles.detailRow}>
          <SimpleIcon name="event" size={16} color="#666666" />
          <Text style={styles.detailText}>
            {test.status === 'completed' ? 'Completed: ' : 'Scheduled: '}
            {formatDate(test.status === 'completed' ? test.date : test.date)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <SimpleIcon name="place" size={16} color="#666666" />
          <Text style={styles.detailText}>{test.location}</Text>
        </View>

        {test.results && (
          <View style={styles.detailRow}>
            <SimpleIcon 
              name={test.results.status === 'normal' ? 'check-circle' : 'warning'} 
              size={16} 
              color={test.results.status === 'normal' ? '#4CAF50' : '#FF9800'} 
            />
            <Text style={styles.detailText}>
              Results: {test.results.status === 'normal' ? 'Normal' : 'Abnormal'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.testActions}>
        {test.status === 'completed' && test.results && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleViewResults(test)}>
            <SimpleIcon name="eye" size={16} color="#1976D2" />
            <Text style={styles.actionButtonText}>View Results</Text>
          </TouchableOpacity>
        )}
        
        {test.status === 'pending' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.notesButton]}
            onPress={() => handleAddNotes(test)}>
            <SimpleIcon name="edit" size={16} color="#FF9800" />
            <Text style={styles.notesButtonText}>Add Notes</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading lab tests...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <SimpleIcon name="error" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadLabTests}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredTests = labTests.filter(test => {
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'in_progress') return test.status === 'pending';
    return test.status === selectedStatus;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lab Tests</Text>
          <TouchableOpacity style={styles.requestButton} onPress={() => navigation.navigate('RequestLabTest')}>
            <SimpleIcon name="add" size={20} color="#FFFFFF" />
            <Text style={styles.requestButtonText}>Request Test</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersContainer}>
          {renderStatusFilter('all', 'All')}
          {renderStatusFilter('scheduled', 'Scheduled')}
          {renderStatusFilter('in_progress', 'In Progress')}
          {renderStatusFilter('completed', 'Completed')}
        </View>

        <View style={styles.testsContainer}>
          {filteredTests.length > 0 ? (
            filteredTests.map(renderLabTest)
          ) : (
            <View style={styles.emptyState}>
              <SimpleIcon name="flask" size={64} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No Lab Tests Found</Text>
              <Text style={styles.emptyMessage}>
                {selectedStatus === 'all' 
                  ? "You haven't ordered any lab tests yet."
                  : `No ${selectedStatus} lab tests found.`
                }
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('RequestLabTest')}>
                <SimpleIcon name="add" size={20} color="#1976D2" />
                <Text style={styles.emptyButtonText}>Request Lab Test</Text>
              </TouchableOpacity>
            </View>
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#1976D2',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  testsContainer: {
    padding: 20,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  patientName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  patientPhone: {
    fontSize: 12,
    color: '#999999',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  testDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  testActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F8FF',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
    marginLeft: 4,
  },
  notesButton: {
    backgroundColor: '#FFF3E0',
  },
  notesButtonText: {
    color: '#FF9800',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
    marginLeft: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DoctorLabTestScreen;