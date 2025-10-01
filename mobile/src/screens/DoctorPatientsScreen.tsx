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
import DateTimePicker from '@react-native-community/datetimepicker';
import SimpleIcon from '../components/SimpleIcon';
import {useData} from '../context/DataContext';
import apiService from '../services/apiService';

interface DoctorPatientsScreenProps {
  navigation: any;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  profilePictureUrl?: string;
  lastAppointmentDate?: string;
  totalAppointments: number;
  createdAt: string;
  // Computed fields for display
  name: string;
  age: number;
  lastVisit: string;
  nextAppointment?: string;
  status: 'active' | 'inactive' | 'new';
  conditions: string[];
  avatar?: string;
}

const DoctorPatientsScreen = ({navigation}: DoctorPatientsScreenProps): React.JSX.Element => {
  const {doctor} = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [followUpTarget, setFollowUpTarget] = useState<Patient | null>(null);
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
  const [followUpTime, setFollowUpTime] = useState<Date | null>(null);

  useEffect(() => {
    if (doctor?.id) {
      loadPatients();
    }
  }, [doctor?.id]);

  useEffect(() => {
    if (doctor?.id) {
      loadPatients();
    }
  }, [searchQuery]);

  const loadPatients = async () => {
    if (!doctor?.id) {
      console.log('No doctor ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('👥 Loading patients for doctor:', doctor.id);
      console.log('🔍 Search query:', searchQuery);

      const response = await apiService.getDoctorPatients(doctor.id, {
        page: 1,
        limit: 50,
        search: searchQuery || undefined
      });

      console.log('📊 Patients API Response:', response);

      if (response.success && response.data) {
        // Transform API data to match our interface
        const transformedPatients = response.data.map((patient: any) => {
          const age = calculateAge(patient.dateOfBirth);
          const name = `${patient.firstName} ${patient.lastName}`;
          const lastVisit = patient.lastAppointmentDate ? 
            new Date(patient.lastAppointmentDate).toISOString().split('T')[0] : 
            'Never';
          
          // Determine status based on appointments and recent activity
          let status: 'active' | 'inactive' | 'new' = 'new';
          if (patient.totalAppointments > 0) {
            const lastVisitDate = patient.lastAppointmentDate ? new Date(patient.lastAppointmentDate) : null;
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            if (lastVisitDate && lastVisitDate > thirtyDaysAgo) {
              status = 'active';
            } else {
              status = 'inactive';
            }
          }

          return {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            phone: patient.phone,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            profilePictureUrl: patient.profilePictureUrl,
            lastAppointmentDate: patient.lastAppointmentDate,
            totalAppointments: patient.totalAppointments,
            createdAt: patient.createdAt,
            // Computed fields for display
            name,
            age,
            lastVisit,
            nextAppointment: undefined, // Not available in current API
            status,
            conditions: [], // Not available in current API
            avatar: patient.profilePictureUrl
          };
        });

        setPatients(transformedPatients);
        console.log('✅ Loaded patients:', transformedPatients.length, 'patients');
      } else {
        console.log('❌ No patients data in response');
        setPatients([]);
      }
    } catch (err) {
      console.error('❌ Error loading patients:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  const handlePatientPress = (patient: Patient) => {
    navigation.navigate('DoctorPatientDetails', {patient});
  };

  const handleNewPatient = () => {
    Alert.alert('New Patient', 'Add new patient functionality will be implemented');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'inactive': return '#9E9E9E';
      case 'new': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'new': return 'New Patient';
      default: return 'Unknown';
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.conditions.some(condition => 
                           condition.toLowerCase().includes(searchQuery.toLowerCase())
                         );
    
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && patient.status === selectedFilter;
  });

  const openFollowUp = (patient: Patient) => {
    setFollowUpTarget(patient);
    setFollowUpDate(new Date());
    setFollowUpTime(new Date());
    setShowDatePicker(true);
  };

  const onPickDate = (_: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setFollowUpDate(date);
      setShowTimePicker(true);
    }
  };

  const onPickTime = (_: any, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      setFollowUpTime(time);
      confirmFollowUp();
    }
  };

  const confirmFollowUp = async () => {
    try {
      if (!doctor?.id || !followUpTarget || !followUpDate || !followUpTime) return;
      const y = followUpDate.getFullYear();
      const m = String(followUpDate.getMonth() + 1).padStart(2, '0');
      const d = String(followUpDate.getDate()).padStart(2, '0');
      const hh = String(followUpTime.getHours()).padStart(2, '0');
      const mm = String(followUpTime.getMinutes()).padStart(2, '0');
      const payload = {
        patient_id: followUpTarget.id,
        doctor_id: doctor.id,
        appointment_date: `${y}-${m}-${d}`,
        appointment_time: `${hh}:${mm}`,
        type: 'video',
        status: 'scheduled',
        notes: 'FOLLOWUP',
      } as any;
      const resp = await apiService.createAppointment(payload);
      if (resp?.success) {
        Alert.alert('Follow-up Scheduled', 'The patient can accept and pay from their dashboard.');
        setFollowUpTarget(null);
        setFollowUpDate(null);
        setFollowUpTime(null);
      } else {
        Alert.alert('Error', 'Failed to schedule follow-up.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to schedule follow-up.');
    }
  };

  const renderPatientCard = (patient: Patient) => (
    <TouchableOpacity
      key={patient.id}
      style={styles.patientCard}
      onPress={() => handlePatientPress(patient)}>
      <View style={styles.patientHeader}>
        <View style={styles.patientInfo}>
          <View style={styles.avatarContainer}>
            <SimpleIcon 
              name={patient.gender === 'male' ? 'male' : 'female'} 
              size={24} 
              color="#1976D2" 
            />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientAge}>Age: {patient.age} • {patient.gender}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(patient.status)}]}>
          <Text style={styles.statusText}>{getStatusText(patient.status)}</Text>
        </View>
      </View>
      
      <View style={styles.conditionsContainer}>
        <Text style={styles.conditionsTitle}>Conditions:</Text>
        <View style={styles.conditionsList}>
          {patient.conditions.map((condition, index) => (
            <View key={index} style={styles.conditionTag}>
              <Text style={styles.conditionText}>{condition}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.visitInfo}>
        <Text style={styles.lastVisit}>Last Visit: {patient.lastVisit}</Text>
        {patient.nextAppointment && (
          <Text style={styles.nextAppointment}>Next: {patient.nextAppointment}</Text>
        )}
        <View style={styles.patientActionsRow}>
          <TouchableOpacity style={styles.followAction} onPress={() => openFollowUp(patient)}>
            <SimpleIcon name="event" size={16} color="#4CAF50" />
            <Text style={styles.followActionText}>Follow Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleNewPatient}>
          <SimpleIcon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SimpleIcon name="search" size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients or conditions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666666"
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'active', 'inactive', 'new'].map((filter) => (
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
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPatients}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Patients List */}
      {!loading && !error && (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{patients.length}</Text>
              <Text style={styles.statLabel}>Total Patients</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{patients.filter(p => p.status === 'active').length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{patients.filter(p => p.status === 'new').length}</Text>
              <Text style={styles.statLabel}>New</Text>
            </View>
          </View>

          {filteredPatients.length > 0 ? (
            filteredPatients.map(renderPatientCard)
          ) : (
            <View style={styles.centerContent}>
              <SimpleIcon name="people" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>No patients found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search terms' : 'Patients will appear here once they register'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
      {showDatePicker && (
        <DateTimePicker value={followUpDate || new Date()} mode="date" display="default" onChange={onPickDate} />
      )}
      {showTimePicker && (
        <DateTimePicker value={followUpTime || new Date()} mode="time" display="default" onChange={onPickTime} />
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#1976D2',
  },
  filterText: {
    fontSize: 14,
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
  patientCard: {
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
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  patientAge: {
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
  conditionsContainer: {
    marginBottom: 12,
  },
  conditionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 6,
  },
  conditionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  conditionTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  conditionText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '500',
  },
  visitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lastVisit: {
    fontSize: 12,
    color: '#666666',
  },
  nextAppointment: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  patientActionsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  followAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  followActionText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DoctorPatientsScreen;
