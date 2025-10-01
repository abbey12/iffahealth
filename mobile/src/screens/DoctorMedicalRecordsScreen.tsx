import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import {useData} from '../context/DataContext';
import apiService from '../services/apiService';

interface DoctorMedicalRecordsScreenProps {
  navigation: any;
}

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  date: string;
  type: 'consultation' | 'lab_result' | 'prescription' | 'diagnosis' | 'treatment';
  title: string;
  description: string;
  doctor?: string;
  doctorSpecialty?: string;
  hospital?: string;
  status: 'active' | 'archived' | 'pending';
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

const DoctorMedicalRecordsScreen = ({navigation}: DoctorMedicalRecordsScreenProps): React.JSX.Element => {
  const {doctor} = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useEffect triggered - selectedFilter:', selectedFilter);
    loadRecords();
  }, [selectedFilter]);

  useEffect(() => {
    console.log('🔄 useEffect triggered - doctor changed:', doctor?.id);
    if (doctor?.id) {
      loadRecords();
    }
  }, [doctor?.id]);

  const loadRecords = async () => {
    if (!doctor?.id) {
      console.log('No doctor ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📋 Loading medical records for doctor:', doctor.id);
      console.log('📋 Selected filter:', selectedFilter);

      const response = await apiService.getDoctorMedicalRecords(doctor.id, {
        page: 1,
        limit: 50,
        type: selectedFilter === 'all' ? undefined : selectedFilter
      });

      console.log('📊 Medical Records API Response:', response);
      console.log('📊 Response success:', response.success);
      console.log('📊 Response data length:', response.data?.length);

      if (response.success && response.data) {
        // Transform API data to match our interface
        const transformedRecords = response.data.map((record: any) => {
          console.log('🔄 Transforming record:', record);
          return {
            id: record.id,
            patientId: record.patientId,
            patientName: record.patientName || 'Unknown Patient',
            patientPhone: record.patientPhone,
            date: record.recordDate || record.createdAt,
            type: record.type as 'consultation' | 'lab_result' | 'prescription' | 'diagnosis' | 'treatment',
            title: record.title || 'Untitled Record',
            description: record.description || 'No description available',
            doctor: record.doctor,
            doctorSpecialty: record.doctorSpecialty,
            hospital: record.hospital,
            status: 'active' as 'active' | 'archived' | 'pending', // Default to active since API doesn't have status
            attachments: record.attachments || [],
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
          };
        });

        setRecords(transformedRecords);
        console.log('✅ Loaded medical records:', transformedRecords.length, 'records');
        console.log('✅ First record:', transformedRecords[0]);
      } else {
        console.log('❌ No medical records data in response');
        setRecords([]);
      }
    } catch (err) {
      console.error('❌ Error loading medical records:', err);
      setError('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  };

  const handleRecordPress = (record: MedicalRecord) => {
    navigation.navigate('DoctorRecordDetails', {record});
  };

  const handleAddRecord = () => {
    navigation.navigate('AddMedicalRecord');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return 'medical-services';
      case 'lab_result': return 'science';
      case 'prescription': return 'medication';
      case 'diagnosis': return 'assignment';
      case 'treatment': return 'healing';
      default: return 'description';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return '#2196F3';
      case 'lab_result': return '#4CAF50';
      case 'prescription': return '#FF9800';
      case 'diagnosis': return '#F44336';
      case 'treatment': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'archived': return '#9E9E9E';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && record.type === selectedFilter;
  });

  console.log('🔍 Current records state:', records.length, 'records');
  console.log('🔍 Filtered records:', filteredRecords.length, 'records');

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading medical records...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <SimpleIcon name="error" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRecords}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderRecordCard = (record: MedicalRecord) => (
    <TouchableOpacity
      key={record.id}
      style={styles.recordCard}
      onPress={() => handleRecordPress(record)}>
      <View style={styles.recordHeader}>
        <View style={styles.recordInfo}>
          <View style={[styles.typeIcon, {backgroundColor: getTypeColor(record.type)}]}>
            <SimpleIcon name={getTypeIcon(record.type)} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.recordDetails}>
            <Text style={styles.recordTitle}>{record.title}</Text>
            <Text style={styles.patientName}>{record.patientName}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(record.status)}]}>
          <Text style={styles.statusText}>{record.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.recordDescription} numberOfLines={2}>
        {record.description}
      </Text>
      
      <View style={styles.recordFooter}>
        <View style={styles.recordFooterLeft}>
          <Text style={styles.recordDate}>{new Date(record.date).toLocaleDateString()}</Text>
          {record.hospital && (
            <Text style={styles.recordHospital}>{record.hospital}</Text>
          )}
        </View>
        <View style={styles.recordFooterRight}>
          {record.attachments && record.attachments.length > 0 && (
            <View style={styles.attachmentIndicator}>
              <SimpleIcon name="attach-file" size={16} color="#1976D2" />
              <Text style={styles.attachmentCount}>{record.attachments.length}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddRecord}>
          <SimpleIcon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SimpleIcon name="search" size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search records, patients, or conditions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666666"
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'consultation', 'lab_result', 'prescription', 'diagnosis', 'treatment'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter)}>
              <Text style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive
              ]}>
                {filter.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Records List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{records.length}</Text>
            <Text style={styles.statLabel}>Total Records</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{records.filter(r => r.status === 'active').length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{records.filter(r => r.status === 'pending').length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {filteredRecords.length > 0 ? (
          filteredRecords.map(renderRecordCard)
        ) : (
          <View style={styles.emptyStateContainer}>
            <SimpleIcon name="description" size={64} color="#BDBDBD" />
            <Text style={styles.emptyStateTitle}>No Medical Records Found</Text>
            <Text style={styles.emptyStateMessage}>
              {selectedFilter === 'all' 
                ? 'You currently have no medical records at the moment'
                : `No ${selectedFilter.replace('_', ' ')} records found`
              }
            </Text>
            <TouchableOpacity style={styles.addRecordButton} onPress={handleAddRecord}>
              <SimpleIcon name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addRecordText}>Add New Record</Text>
            </TouchableOpacity>
          </View>
        )}
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
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1A1A1A',
  },
  filterContainer: {
    marginTop: 4,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#1976D2',
  },
  filterText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordDetails: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  patientName: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recordDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 12,
    color: '#666666',
  },
  recordDoctor: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentCount: {
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 4,
  },
  // Loading and Error States
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Empty State
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  addRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addRecordText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Updated Footer Styles
  recordFooterLeft: {
    flex: 1,
  },
  recordFooterRight: {
    alignItems: 'flex-end',
  },
  recordHospital: {
    fontSize: 11,
    color: '#999999',
    marginTop: 2,
  },
});

export default DoctorMedicalRecordsScreen;
