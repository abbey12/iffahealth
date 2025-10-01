import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import {useData} from '../context/DataContext';

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
  results?: {
    status: 'normal' | 'abnormal' | 'pending';
    values: Array<{
      parameter: string;
      value: string;
      normalRange: string;
      status: 'normal' | 'high' | 'low';
    }>;
    notes: string;
    doctorNotes?: string;
  };
}

const PatientLabTestScreen = ({navigation}: any): React.JSX.Element => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');

  // Get data from context
  const { 
    patient, 
    labTests, 
    upcomingLabTests, 
    isLoading, 
    error, 
    loadLabTests, 
    loadUpcomingLabTests 
  } = useData();

  // Load data when component mounts
  useEffect(() => {
    if (patient?.id) {
      loadLabTests(patient.id);
      loadUpcomingLabTests(patient.id);
    }
  }, [patient?.id]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    if (patient?.id) {
      await Promise.all([
        loadLabTests(patient.id),
        loadUpcomingLabTests(patient.id)
      ]);
    }
    setRefreshing(false);
  };

  // Transform API data to match the UI interface
  const transformLabTest = (test: any): LabTest => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'scheduled':
          return '#FF9800';
        case 'in_progress':
          return '#2196F3';
        case 'completed':
          return '#4CAF50';
        case 'cancelled':
          return '#F44336';
        default:
          return '#666666';
      }
    };

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'blood':
          return 'water';
        case 'urine':
          return 'flask';
        case 'imaging':
          return 'scan';
        case 'other':
          return 'medical';
        default:
          return 'help';
      }
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return {
      id: test.id,
      name: test.testName || test.name,
      type: test.testType || test.type,
      status: test.status,
      scheduledDate: test.date ? `${test.date}T${test.time || '09:00:00'}Z` : test.scheduledDate,
      completedDate: test.completedDate,
      doctor: {
        name: test.orderedBy || 'Unknown Doctor',
        specialty: 'General Medicine',
      },
      lab: {
        name: test.location || 'Medical Lab',
        address: 'Lab Address',
        phone: '+233 24 123 4567',
      },
      instructions: test.notes || 'Follow standard preparation guidelines',
      results: test.results ? {
        status: test.results.status || 'normal',
        values: test.results.values || [],
        notes: test.results.notes || 'No additional notes',
        doctorNotes: test.doctorNotes || test.results.doctorNotes,
      } : undefined,
    };
  };

  // Use real data from context, fallback to empty array
  const displayLabTests = labTests.map(transformLabTest);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#FF9800';
      case 'in_progress': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#666666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return 'calendar';
      case 'in_progress': return 'refresh';
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      default: return 'help';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewResults = (test: LabTest) => {
    navigation.navigate('LabTestResult', {test});
  };

  const handleBookTest = () => {
    navigation.navigate('LabTestBooking');
  };

  const handleCancelTest = (testId: string) => {
    Alert.alert(
      'Cancel Lab Test',
      'Are you sure you want to cancel this lab test?',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // In real app, this would make API call
            Alert.alert('Success', 'Lab test cancelled successfully');
          },
        },
      ]
    );
  };

  const filteredTests = displayLabTests.filter(test => 
    selectedStatus === 'all' || test.status === selectedStatus
  );

  const renderStatusFilter = (status: string, label: string) => (
    <TouchableOpacity
      key={status}
      style={[
        styles.filterButton,
        selectedStatus === status && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedStatus(status as any)}>
      <Text style={[
        styles.filterButtonText,
        selectedStatus === status && styles.filterButtonTextActive,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderLabTest = (test: LabTest) => (
    <View key={test.id} style={styles.testCard}>
      <View style={styles.testHeader}>
        <View style={styles.testInfo}>
          <View style={styles.testTitleRow}>
            <SimpleIcon name={getTypeIcon(test.type)} size={20} color="#1976D2" />
            <Text style={styles.testName}>{test.name}</Text>
          </View>
          <Text style={styles.testType}>{test.type.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(test.status)}]}>
          <SimpleIcon name={getStatusIcon(test.status)} size={16} color="#FFFFFF" />
          <Text style={styles.statusText}>{getStatusText(test.status)}</Text>
        </View>
      </View>

      <View style={styles.testDetails}>
        <View style={styles.detailRow}>
          <SimpleIcon name="calendar" size={16} color="#666666" />
          <Text style={styles.detailText}>
            {test.status === 'completed' ? 'Completed: ' : 'Scheduled: '}
            {formatDate(test.status === 'completed' ? test.completedDate! : test.scheduledDate)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <SimpleIcon name="person" size={16} color="#666666" />
          <Text style={styles.detailText}>
            {test.doctor.name} - {test.doctor.specialty}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <SimpleIcon name="location" size={16} color="#666666" />
          <Text style={styles.detailText}>{test.lab.name}</Text>
        </View>

        {test.instructions && (
          <View style={styles.detailRow}>
            <SimpleIcon name="information" size={16} color="#666666" />
            <Text style={styles.detailText} numberOfLines={2}>
              {test.instructions}
            </Text>
          </View>
        )}

        {test.results && (
          <View style={styles.detailRow}>
            <SimpleIcon 
              name={test.results.status === 'normal' ? 'checkmark-circle' : 'warning'} 
              size={16} 
              color={test.results.status === 'normal' ? '#4CAF50' : '#FF9800'} 
            />
            <Text style={[
              styles.detailText,
              {color: test.results.status === 'normal' ? '#4CAF50' : '#FF9800'}
            ]}>
              Results: {test.results.status === 'normal' ? 'Normal' : 'Abnormal'}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {test.status === 'scheduled' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelTest(test.id)}>
            <SimpleIcon name="close" size={16} color="#F44336" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        
        {test.status === 'completed' && test.results && (
          <TouchableOpacity
            style={styles.resultsButton}
            onPress={() => handleViewResults(test)}>
            <SimpleIcon name="document" size={16} color="#1976D2" />
            <Text style={styles.resultsButtonText}>View Results</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Loading state
  if (isLoading && displayLabTests.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading lab tests...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <SimpleIcon name="error" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Error Loading Lab Tests</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Header with Book Test Button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lab Tests</Text>
          <TouchableOpacity style={styles.bookButton} onPress={handleBookTest}>
            <SimpleIcon name="add" size={20} color="#FFFFFF" />
            <Text style={styles.bookButtonText}>Book Test</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderStatusFilter('all', 'All')}
            {renderStatusFilter('scheduled', 'Scheduled')}
            {renderStatusFilter('in_progress', 'In Progress')}
            {renderStatusFilter('completed', 'Completed')}
          </ScrollView>
        </View>

        {/* Lab Tests */}
        <View style={styles.testsContainer}>
          {filteredTests.length > 0 ? (
            filteredTests.map(renderLabTest)
          ) : (
            <View style={styles.emptyContainer}>
              <SimpleIcon name="flask" size={60} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No Lab Tests</Text>
              <Text style={styles.emptySubtitle}>
                {selectedStatus === 'all' 
                  ? 'You don\'t have any lab tests yet'
                  : `No ${selectedStatus} lab tests found`
                }
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleBookTest}>
                <Text style={styles.emptyButtonText}>Book Your First Test</Text>
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
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  filtersContainer: {
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
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#1976D2',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  filterButtonTextActive: {
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  testType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  testDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 4,
  },
  resultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  resultsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Loading, Error, and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F44336',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PatientLabTestScreen;
