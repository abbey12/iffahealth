import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SimpleIcon from '../components/SimpleIcon';
import {useData} from '../context/DataContext';
import apiService from '../services/apiService';
import { formatAppointmentTime, formatAppointmentDate, formatAppointmentDateTime } from '../utils/timeUtils';

interface Appointment {
  id: string;
  patientId?: string;
  patientName: string;
  patientAge: number;
  patientEmail: string;
  date: string;
  time: string;
  type: 'video';
  status: 'upcoming' | 'completed' | 'cancelled';
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  notes?: string;
}

interface DoctorAppointmentsScreenProps {
  navigation: any;
}

const DoctorAppointmentsScreen = ({navigation}: DoctorAppointmentsScreenProps): React.JSX.Element => {
  const {doctor} = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [findingsModalVisible, setFindingsModalVisible] = useState(false);
  const [findingsText, setFindingsText] = useState('');
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null);

  useEffect(() => {
    loadAppointments();
  }, [selectedFilter]);

  // If navigated back from video with a completion signal, open modal automatically
  useEffect(() => {
    const sub = navigation.addListener('focus', () => {
      const params = navigation.getState()?.routes?.find(r => r.name === 'DoctorAppointments')?.params as any;
      if (params?.completeAfterCall && params?.appointmentId) {
        const apt = appointments.find(a => a.id === params.appointmentId);
        if (apt && apt.status === 'upcoming') {
          setAppointmentToComplete(apt);
          setFindingsText('');
          setFindingsModalVisible(true);
        }
        // clear flag
        try { navigation.setParams({ completeAfterCall: false }); } catch {}
      }
    });
    return sub;
  }, [navigation, appointments]);

  // Transform API data to UI format
  const transformAppointment = (apiAppointment: any): Appointment => {
    return {
      id: apiAppointment.id,
      patientId: apiAppointment.patient_id || apiAppointment.patientId,
      patientName: apiAppointment.patientName || `${apiAppointment.patient_first_name || ''} ${apiAppointment.patient_last_name || ''}`.trim() || 'Unknown Patient',
      patientAge: apiAppointment.patientAge || 0, // Use real age from API
      patientEmail: apiAppointment.patientEmail || apiAppointment.patient_email || '',
      date: formatAppointmentDate(apiAppointment.date || apiAppointment.appointment_date),
      time: formatAppointmentTime(apiAppointment.time || apiAppointment.appointment_time || '', apiAppointment.date || apiAppointment.appointment_date),
      type: apiAppointment.type || 'video',
      status: mapApiStatusToUI(apiAppointment.status),
      reason: apiAppointment.notes || 'Consultation',
      urgency: 'medium' as const, // Default urgency
      notes: apiAppointment.notes || '',
    };
  };

  // Map API status to UI status
  const mapApiStatusToUI = (apiStatus: string): 'upcoming' | 'completed' | 'cancelled' => {
    switch (apiStatus?.toLowerCase()) {
      case 'confirmed':
      case 'scheduled':
        return 'upcoming';
      case 'completed':
      case 'finished':
        return 'completed';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      default:
        return 'upcoming';
    }
  };

  const loadAppointments = async () => {
    if (!doctor?.id) {
      console.log('No doctor ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading appointments for doctor:', doctor.id);
      console.log('🔍 Filter:', selectedFilter);

      // Map filter to API status
      let apiStatus: string | undefined;
      if (selectedFilter === 'upcoming') {
        apiStatus = 'upcoming';
      } else if (selectedFilter === 'completed') {
        apiStatus = 'completed';
      } else if (selectedFilter === 'cancelled') {
        apiStatus = 'cancelled';
      }

      const response = await apiService.getDoctorAppointments(doctor.id, {
        status: apiStatus,
        limit: 50, // Get more appointments
      });

      console.log('📊 Appointments API Response:', response);

      if (response.success && response.data && response.data.appointments) {
        const appointmentsData = response.data.appointments || [];
        const transformedAppointments = appointmentsData.map(transformAppointment);
        
        console.log('✅ Transformed appointments:', transformedAppointments.length);
        setAppointments(transformedAppointments);
      } else {
        console.log('❌ No appointments data in response');
        setAppointments([]);
      }
    } catch (err) {
      console.error('❌ Error loading appointments:', err);
      setError('Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const handleStartConsultation = (appointment: Appointment) => {
    Alert.alert(
      'Start Consultation',
      `Start video consultation with ${appointment.patientName}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Start',
          onPress: () => {
            navigation.navigate('VideoCall', {
              appointmentId: appointment.id,
              doctorId: doctor.id,
              patientId: appointment.patientId,
              doctorName: `${doctor.firstName} ${doctor.lastName}`,
              patientName: appointment.patientName,
              appointmentDate: appointment.date,
              appointmentTime: appointment.time,
              userType: 'doctor',
            });
          },
        },
      ]
    );
  };

  const handleViewDetails = (appointment: Appointment) => {
    Alert.alert(
      'Appointment Details',
      `Patient: ${appointment.patientName}\nAge: ${appointment.patientAge}\nEmail: ${appointment.patientEmail}\nDate: ${appointment.date}\nTime: ${appointment.time}\nReason: ${appointment.reason}\nStatus: ${appointment.status}\nUrgency: ${appointment.urgency}`,
      [{text: 'OK'}]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#1976D2';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const renderFilterButton = (filter: string, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter as any)}>
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderAppointmentCard = ({item}: {item: Appointment}) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.patientDetails}>Age: {item.patientAge} • {item.patientEmail}</Text>
        </View>
        <View style={styles.appointmentMeta}>
          <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status)}]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
          <View style={[styles.urgencyBadge, {backgroundColor: getUrgencyColor(item.urgency)}]}>
            <Text style={styles.urgencyText}>{item.urgency.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <SimpleIcon name="schedule" size={16} color="#666666" />
          <Text style={styles.detailText}>{item.date} at {item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <SimpleIcon name="videocam" size={16} color="#666666" />
          <Text style={styles.detailText}>Video Call</Text>
        </View>
        <View style={styles.detailRow}>
          <SimpleIcon name="description" size={16} color="#666666" />
          <Text style={styles.detailText}>{item.reason}</Text>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleViewDetails(item)}>
          <SimpleIcon name="info" size={16} color="#1976D2" />
          <Text style={styles.secondaryButtonText}>Details</Text>
        </TouchableOpacity>
        
        {item.status === 'upcoming' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleStartConsultation(item)}>
            <SimpleIcon name="videocam" size={16} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Start Call</Text>
          </TouchableOpacity>
        )}

        {item.status === 'upcoming' && (
          <TouchableOpacity
            style={[styles.secondaryButton, {backgroundColor: '#E8F5E9'}]}
            onPress={() => handleCompletePrompt(item)}>
            <SimpleIcon name="check" size={16} color="#388E3C" />
            <Text style={[styles.secondaryButtonText, {color: '#388E3C'}]}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const handleCompletePrompt = (appointment: Appointment) => {
    setAppointmentToComplete(appointment);
    setFindingsText('');
    setFindingsModalVisible(true);
  };

  const handleSaveCompletion = async () => {
    if (!appointmentToComplete) return;
    if (!findingsText.trim()) {
      Alert.alert('Findings required', 'Please enter brief findings/report before saving.');
      return;
    }

    // Optimistically remove from list
    const original = appointments;
    const filtered = original.filter(a => a.id !== appointmentToComplete.id);
    setAppointments(filtered);
    setSavingCompletion(true);

    try {
      // 1) Mark appointment completed
      await apiService.updateAppointment(appointmentToComplete.id, { status: 'completed' } as any);

      // 2) Create a medical record (consultation)
      const today = new Date().toISOString().slice(0,10);
      if (appointmentToComplete.patientId) {
        await apiService.createMedicalRecord({
          patient_id: appointmentToComplete.patientId,
          doctor_id: doctor?.id,
          type: 'consultation',
          title: 'Consultation Note',
          description: findingsText.trim(),
          record_date: today,
          attachments: [],
        });
      }

      // 3) Create doctor earning entry (pending payout)
      const amount = (doctor as any)?.consultationFee || (doctor as any)?.consultation_fee || 0;
      if (amount && amount > 0) {
        try {
          await apiService.createDoctorEarning({
            doctor_id: doctor!.id,
            appointment_id: appointmentToComplete.id,
            amount: Number(amount),
          });
        } catch (e) {
          console.log('⚠️ Failed to create earning, continuing:', (e as any)?.message);
        }
      }

      setFindingsModalVisible(false);
      setAppointmentToComplete(null);
      setFindingsText('');
    } catch (e) {
      // Rollback
      setAppointments(original);
      Alert.alert('Error', 'Failed to complete appointment. Please try again.');
    } finally {
      setSavingCompletion(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <SimpleIcon name="error" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAppointments}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('upcoming', 'Upcoming')}
        {renderFilterButton('completed', 'Completed')}
        {renderFilterButton('cancelled', 'Cancelled')}
      </View>

      {/* Appointments List */}
      <FlatList
        data={appointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SimpleIcon name="event-busy" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No appointments found</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === 'all' 
                ? 'You have no appointments scheduled'
                : `No ${selectedFilter} appointments found`
              }
            </Text>
          </View>
        }
      />

      {/* Findings Modal */}
      <Modal
        visible={findingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !savingCompletion && setFindingsModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView
              style={{flexGrow: 0}}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Complete Consultation</Text>
              <View style={styles.modalPatientBlock}>
                <Text style={styles.modalPatientName} numberOfLines={2}>
                  {appointmentToComplete?.patientName || 'Patient'}
                </Text>
                <Text style={styles.modalMeta} numberOfLines={2}>
                  {(appointmentToComplete?.date ? `${appointmentToComplete.date}` : '')}
                  {(appointmentToComplete?.time ? ` • ${appointmentToComplete.time}` : '')}
                </Text>
              </View>
              <Text style={styles.modalSubtitle}>Findings / Report</Text>
              <View style={styles.inputArea}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Type concise findings..."
                  value={findingsText}
                  onChangeText={setFindingsText}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  editable={!savingCompletion}
                />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                disabled={savingCompletion}
                onPress={() => setFindingsModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSave, (!findingsText.trim() || savingCompletion) && {opacity: 0.6}]}
                disabled={!findingsText.trim() || savingCompletion}
                onPress={handleSaveCompletion}>
                <Text style={styles.modalSaveText}>{savingCompletion ? 'Saving...' : 'Save & Complete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#1976D2',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
    alignSelf: 'stretch',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  patientDetails: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  appointmentMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appointmentDetails: {
    marginBottom: 12,
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
    flex: 1,
  },
  notesContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666666',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '90%',
  },
  modalScrollContent: {
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  modalPatientBlock: {
    marginBottom: 6,
  },
  modalPatientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  inputArea: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 8,
    minHeight: 120,
  },
  textArea: {
    minHeight: 100,
    fontSize: 14,
    color: '#1A1A1A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  modalButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  modalCancel: {
    backgroundColor: '#EEEEEE',
  },
  modalSave: {
    backgroundColor: '#1976D2',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

export default DoctorAppointmentsScreen;
