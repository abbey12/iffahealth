import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import SimpleIcon from '../components/SimpleIcon';
import {useData} from '../context/DataContext';
import {apiService} from '../services/apiService';
import { formatAppointmentTime, formatAppointmentDate } from '../utils/timeUtils';

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'scheduled' | 'confirmed';
  type: 'video' | 'in-person';
  meetingLink?: string;
  meetingId?: string;
  meetingPassword?: string;
  canJoinCall?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const AppointmentsScreen = ({navigation, route}: {navigation: any; route: any}): React.JSX.Element => {
  const {patient, isLoading, error, refreshAllData} = useData();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const highlightedPayment = route?.params?.highlightPayment;

  // Transform API data to UI format
  const transformAppointment = (apiAppointment: any): Appointment => {
    return {
      id: apiAppointment.id,
      doctorName: `${apiAppointment.doctor_first_name || ''} ${apiAppointment.doctor_last_name || ''}`.trim() || 'Dr. Unknown',
      specialty: apiAppointment.doctor_specialty || 'General Medicine',
      date: formatAppointmentDate(apiAppointment.appointment_date),
      time: formatAppointmentTime(apiAppointment.appointment_time, apiAppointment.appointment_date),
      status: apiAppointment.status || 'scheduled',
      type: apiAppointment.type || 'video',
      meetingLink: apiAppointment.meeting_link || '',
      meetingId: apiAppointment.meeting_link ? apiAppointment.meeting_link.split('/').pop() : '',
      meetingPassword: 'iffa_pt' + apiAppointment.id.slice(-3),
      canJoinCall: apiAppointment.status === 'confirmed' || apiAppointment.status === 'scheduled',
      notes: apiAppointment.notes || '',
      createdAt: apiAppointment.created_at,
      updatedAt: apiAppointment.updated_at,
    };
  };

  // Load appointments
  const loadAppointments = async () => {
    if (!patient?.id) return;
    
    try {
      setLoading(true);
      const profileId = patient.profileId || patient.id;
      const response = await apiService.getAppointments(profileId);
      const transformedAppointments = response.data.map(transformAppointment);
      setAppointments(transformedAppointments);
    } catch (err) {
      console.error('Error loading appointments:', err);
      Alert.alert('Error', 'Unable to load appointments. Please pull to refresh.');
      // Fallback to empty array if API fails
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh appointments
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  useEffect(() => {
    if (route?.params?.refresh) {
      loadAppointments();
    }
  }, [route?.params?.refresh]);

  // Load appointments on component mount
  useEffect(() => {
    if (patient?.id) {
      loadAppointments();
    }
  }, [patient?.id]);

  useEffect(() => {
    if (highlightedPayment?.status === 'success') {
      Alert.alert(
        'Payment Confirmed',
        'Your appointment has been confirmed and will appear in Upcoming appointments.',
        [
          {
            text: 'OK',
            onPress: () => navigation.setParams({highlightPayment: undefined}),
          },
        ],
      );
    }
  }, [highlightedPayment, navigation]);

  // Video call functions
  const handleJoinCall = async (appointment: Appointment) => {
    if (!appointment.meetingLink) {
      Alert.alert('Meeting Link Missing', 'Google Meet link is not available for this appointment. Please contact support.');
      return;
    }

    // Check if it's time for the appointment (within 15 minutes before or after)
    const now = new Date();
    const appointmentTime = new Date(`${appointment.date} ${appointment.time}`);
    const timeDiff = Math.abs(now.getTime() - appointmentTime.getTime()) / (1000 * 60); // minutes

    if (timeDiff > 15) {
      Alert.alert(
        'Appointment Not Ready',
        'You can only join the call 15 minutes before or after your scheduled appointment time.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to 100ms video call screen
    navigation.navigate('VideoCall', {
      appointmentId: appointment.id,
      doctorId: appointment.doctorId || '',
      patientId: patient?.profileId || patient?.id,
      doctorName: appointment.doctorName,
      patientName: `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient',
      appointmentDate: appointment.date,
      appointmentTime: appointment.time,
      userType: 'patient',
    });
  };

  const openVideoCall = async (appointment: Appointment) => {
    try {
      // Navigate to VideoCallScreen with Agora configuration
      (navigation as any).navigate('VideoCall', {
        appointmentId: appointment.id,
        doctorName: appointment.doctorName,
        channelName: appointment.meetingId || `appointment_${appointment.id}`,
        token: appointment.meetingPassword, // Using password as token for now
        isHost: false, // Patient is not the host
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to start video call. Please try again.');
    }
  };

  const copyMeetingDetails = (appointment: Appointment) => {
    const details = `Meeting ID: ${appointment.meetingId}\nPassword: ${appointment.meetingPassword}\nLink: ${appointment.meetingLink}`;
    // In a real app, you'd use Clipboard.setString(details)
    Alert.alert('Meeting Details', details, [{ text: 'OK' }]);
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
      case 'scheduled':
      case 'confirmed':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
      case 'scheduled':
      case 'confirmed':
        return 'schedule';
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'cancel';
      default:
        return 'help';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'confirmed':
        return 'Confirmed';
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{appointment.doctorName}</Text>
          <Text style={styles.specialty}>{appointment.specialty}</Text>
        </View>
        <View style={styles.statusContainer}>
          <SimpleIcon
            name={getStatusIcon(appointment.status)}
            size={20}
            color={getStatusColor(appointment.status)}
          />
          <Text
            style={[
              styles.statusText,
              {color: getStatusColor(appointment.status)},
            ]}>
            {getStatusText(appointment.status)}
          </Text>
        </View>
      </View>
      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <SimpleIcon name="calendar-today" size={16} color="#666666" />
          <Text style={styles.detailText}>{appointment.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <SimpleIcon name="access-time" size={16} color="#666666" />
          <Text style={styles.detailText}>{appointment.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <SimpleIcon
            name="videocam"
            size={16}
            color="#666666"
          />
          <Text style={styles.detailText}>
            Video Call
          </Text>
        </View>
      </View>
      {(appointment.status === 'upcoming' || appointment.status === 'confirmed') && appointment.meetingLink && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => handleJoinCall(appointment)}
          >
            <SimpleIcon name="videocam" size={16} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Join Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => copyMeetingDetails(appointment)}
          >
            <SimpleIcon name="info" size={16} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <SimpleIcon name="error" size={48} color="#F44336" />
        <Text style={styles.errorText}>Failed to load appointments</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAppointments}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
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
        {/* Appointments List */}
        <View style={styles.appointmentsSection}>
          <Text style={styles.sectionTitle}>My Appointments</Text>
          {appointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <SimpleIcon name="event" size={48} color="#9E9E9E" />
              <Text style={styles.emptyText}>No appointments found</Text>
              <Text style={styles.emptySubtext}>Your appointments will appear here</Text>
            </View>
          ) : (
            appointments.map(renderAppointmentCard)
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  appointmentsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    width: '100%',
    alignSelf: 'stretch',
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: '#666666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  appointmentDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
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
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default AppointmentsScreen;
