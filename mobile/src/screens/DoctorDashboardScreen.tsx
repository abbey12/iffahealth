import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
// import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import SimpleIcon from '../components/SimpleIcon';
import {useData} from '../context/DataContext';
import apiService from '../services/apiService';
import { formatAppointmentTime, formatAppointmentDate, formatAppointmentDateTime, isAppointmentInPast } from '../utils/timeUtils';

const {width, height} = Dimensions.get('window');

// Doctor profile completion check function
const isDoctorProfileComplete = (doctor: any): boolean => {
  if (!doctor) return false;
  
  // First check if the database has marked the profile as complete
  if (doctor.isProfileComplete === true) {
    return true;
  }
  
  // Fallback: Check if doctor profile completion fields are filled
  // These are the fields required in the doctor profile completion screen
  const requiredFields = [
    'specialty',
    'licenseNumber',
    'medicalSchool',
    'graduationYear',
    'hospitalAffiliation',
    'practiceAddress',
    'consultationFee',
    'emergencyContactName',
    'emergencyContactPhone'
  ];
  
  return requiredFields.every(field => 
    doctor[field] && doctor[field].toString().trim() !== ''
  );
};

interface DoctorDashboardScreenProps {
  navigation: any;
}

interface Appointment {
  id: string;
  patientId?: string;
  patientName: string;
  patientAge: number;
  patientEmail: string;
  time: string;
  type: 'video';
  status: 'upcoming' | 'completed' | 'cancelled';
  reason: string;
  urgency: 'low' | 'medium' | 'high';
}

interface Stats {
  totalAppointments: number;
  todayAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  totalEarnings: number;
  averageRating: number;
}

const DoctorDashboardScreen = ({navigation}: DoctorDashboardScreenProps): React.JSX.Element => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalAppointments: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    totalEarnings: 0,
    averageRating: 0,
  });

  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  // Removed recent appointments per request
  
  // Call useData hook after all useState calls
  const {doctor} = useData() as any;

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Add focus listener to refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Doctor dashboard focused, refreshing data...');
      loadDashboardData();
    });

    return unsubscribe;
  }, [navigation]);

  // Check profile completion and redirect if incomplete
  useEffect(() => {
    // Profile completion check removed - all data collected during signup
  }, [doctor, navigation]);


  const loadDashboardData = async () => {
    if (!doctor?.id) {
      console.log('No doctor ID available');
      setLoading(false);
      return;
    }

    const doctorProfileId = (doctor && (doctor.profileId || doctor.id)) || null;

    if (!doctorProfileId) {
      console.log('No doctor profile ID available for dashboard');
      setLoading(false);
      setError('Doctor profile information is incomplete. Please contact support.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, validate the token
      console.log('🔐 Validating token before API calls...');
      const isTokenValid = await apiService.validateToken();
      if (!isTokenValid) {
        console.log('❌ Token validation failed');
        setError('Session expired. Please log in again.');
        return;
      }
      console.log('✅ Token is valid, proceeding with API calls...');

      // Fetch all data in parallel
      const [statsResponse, upcomingResponse, earningsResponse] = await Promise.all([
        apiService.getDoctorStats(doctorProfileId),
        apiService.getDoctorAppointments(doctorProfileId, { 
          status: 'upcoming', 
          limit: 5,
          date: new Date().toISOString().split('T')[0] // Today's date and future
        }),
        apiService.getDoctorEarnings(doctorProfileId, 'month')
      ]);

      console.log('Dashboard API Responses:', {
        stats: statsResponse,
        upcoming: upcomingResponse,
        earnings: earningsResponse
      });

      console.log('🔍 Upcoming appointments data:', {
        success: upcomingResponse.success,
        hasData: !!upcomingResponse.data,
        hasAppointments: !!upcomingResponse.data?.appointments,
        appointmentsLength: upcomingResponse.data?.appointments?.length || 0,
        appointments: upcomingResponse.data?.appointments
      });

      // Additional debug logging
      console.log('🔍 Full upcoming response structure:', JSON.stringify(upcomingResponse, null, 2));

      // recent section removed

      // Update stats
      if (statsResponse.success) {
        const statsData = statsResponse.data;
        setStats({
          totalAppointments: statsData.totalAppointments || 0,
          todayAppointments: statsData.todayAppointments || 0,
          completedAppointments: statsData.totalAppointments || 0,
          pendingAppointments: statsData.totalPatients || 0,
          totalEarnings: earningsResponse.success ? (earningsResponse.data?.summary?.totalEarnings || 0) : 0,
          averageRating: 4.8,
        });
      }

      // Update upcoming appointments
      if (upcomingResponse.success && upcomingResponse.data && upcomingResponse.data.appointments && Array.isArray(upcomingResponse.data.appointments)) {
        const appointments = upcomingResponse.data.appointments
          .map((apt: any) => ({
            id: apt.id,
            patientId: apt.patient_id || apt.patientId,
            patientName: apt.patientName || `${apt.patient_first_name || 'Patient'} ${apt.patient_last_name || ''}`,
            patientAge: apt.patientAge || 0, // Use real age from API
            patientEmail: apt.patientEmail || apt.patient_email || '', // Use real email from API
            time: formatAppointmentTime(apt.time || apt.appointment_time || '', apt.date || apt.appointment_date),
            date: formatAppointmentDate(apt.date || apt.appointment_date),
            type: apt.type || 'video',
            status: 'upcoming' as const,
            reason: apt.notes || 'Consultation',
            urgency: 'medium' as const, // Default urgency
            appointmentDate: apt.date || apt.appointment_date,
            appointmentTime: apt.time || apt.appointment_time,
          }))
          // Ensure no past items leak into Upcoming (defensive client-side filter)
          .filter((apt: any) => {
            if (apt.appointmentDate && apt.appointmentTime) {
              return !isAppointmentInPast(apt.appointmentDate, apt.appointmentTime);
            }
            return true;
          })
          // Backend already returns only future/today; no extra filtering to avoid losing items
          .sort((a: any, b: any) => {
            // Sort by date and time (most upcoming first) using UTC comparison
            if (a.appointmentDate && b.appointmentDate && a.appointmentTime && b.appointmentTime) {
              const dateA = new Date(`${a.appointmentDate.split('T')[0]}T${a.appointmentTime}Z`);
              const dateB = new Date(`${b.appointmentDate.split('T')[0]}T${b.appointmentTime}Z`);
              return dateA.getTime() - dateB.getTime();
            }
            return 0;
          });
        
        console.log('✅ Transformed upcoming appointments:', appointments.length);
        setUpcomingAppointments(appointments);
      } else {
        console.log('❌ No upcoming appointments data');
        setUpcomingAppointments([]);
      }

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      
          // Check if it's a 401 error (unauthorized)
          if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            setError('Session expired. Please log in again.');
          } else {
            setError('Failed to load dashboard data');
          }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleStartConsultation = (appointment: Appointment & { date?: string; time?: string; patientId?: string }) => {
    Alert.alert(
      'Start Consultation',
      `Start video consultation with ${appointment.patientName}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Start',
          onPress: () => {
            // Navigate to video call at root stack level (Tab -> Stack)
            (navigation.getParent()?.getParent() || navigation).navigate('VideoCall', {
              appointmentId: appointment.id,
              doctorId: doctor?.id,
              patientId: appointment.patientId,
              doctorName: `${doctor?.firstName || 'Doctor'} ${doctor?.lastName || ''}`.trim(),
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

  const handleViewAllAppointments = () => {
    navigation.navigate('DoctorAppointments');
  };

  const handleViewProfile = () => {
    navigation.navigate('DoctorProfile');
  };

  const handleViewEarnings = () => {
    navigation.navigate('DoctorEarnings');
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const renderStatsCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statsCard, {backgroundColor: color}]}>
      <View style={styles.statsGradient}>
        <SimpleIcon name={icon} size={24} color="#FFFFFF" />
        <Text style={styles.statsValue}>
          {value}
        </Text>
        <Text style={styles.statsTitle}>
          {title}
        </Text>
      </View>
    </View>
  );

  const renderAppointmentCard = (appointment: Appointment, isUpcoming: boolean = true) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      {/* Header Section */}
      <View style={styles.appointmentHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName} numberOfLines={1}>
            {appointment.patientName}
          </Text>
          <Text style={styles.patientAge}>Age: {appointment.patientAge}</Text>
        </View>
        <View style={styles.appointmentTime}>
          <Text style={styles.timeText}>{appointment.time}</Text>
          <View style={[styles.urgencyBadge, {backgroundColor: getUrgencyColor(appointment.urgency)}]}>
            <Text style={styles.urgencyText} numberOfLines={1}>
              {appointment.urgency.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Reason Section */}
      <View style={styles.reasonSection}>
        <Text style={styles.reasonText} numberOfLines={2}>
          {appointment.reason}
        </Text>
      </View>
      
      {/* Action Button Section */}
      {isUpcoming && appointment.status === 'upcoming' && (
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStartConsultation(appointment)}>
            <View style={styles.startButtonContent}>
              <SimpleIcon name="videocam" size={16} color="#FFFFFF" />
              <Text style={styles.startButtonText}>
                Start Call
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.doctorName}>
              {doctor?.firstName || 'Dr.'} {doctor?.lastName || 'Doctor'}
            </Text>
            <Text style={styles.specialty}>{doctor?.specialty || 'General Practice'}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.profileButton} onPress={handleViewProfile}>
              <SimpleIcon name="person-circle" size={40} color="#42A5F5" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
       {renderStatsCard('Today', stats.todayAppointments, 'calendar', '#4CAF50')}
       {renderStatsCard('Total Appointments', stats.completedAppointments, 'checkmark-circle', '#66BB6A')}
     </View>
     <View style={styles.statsRow}>
       {renderStatsCard('Patients', stats.pendingAppointments, 'people', '#42A5F5')}
       {renderStatsCard('Earnings', `₵${stats.totalEarnings.toLocaleString()}`, 'cash', '#1976D2')}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContainer}>
                   <TouchableOpacity 
                     style={styles.quickActionItem} 
                     onPress={handleViewAllAppointments}>
                     <LinearGradient
                       colors={['#42A5F5', '#64B5F6']}
                       style={styles.quickActionCircle}>
                       <SimpleIcon name="calendar" size={28} color="#FFFFFF" />
                     </LinearGradient>
                     <Text style={styles.quickActionText}>Appointments</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity 
                     style={styles.quickActionItem} 
                     onPress={handleViewEarnings}>
                     <LinearGradient
                       colors={['#1976D2', '#42A5F5']}
                       style={styles.quickActionCircle}>
                       <SimpleIcon name="cash" size={28} color="#FFFFFF" />
                     </LinearGradient>
                     <Text style={styles.quickActionText}>Earnings</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity 
                     style={styles.quickActionItem} 
                     onPress={() => navigation.navigate('Records')}>
                     <LinearGradient
                       colors={['#9C27B0', '#BA68C8']}
                       style={styles.quickActionCircle}>
                       <SimpleIcon name="folder" size={28} color="#FFFFFF" />
                     </LinearGradient>
                     <Text style={styles.quickActionText}>Records</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity 
                     style={styles.quickActionItem} 
                     onPress={() => navigation.navigate('DoctorLabTest')}>
                     <LinearGradient
                       colors={['#4CAF50', '#66BB6A']}
                       style={styles.quickActionCircle}>
                       <SimpleIcon name="flask" size={28} color="#FFFFFF" />
                     </LinearGradient>
                     <Text style={styles.quickActionText}>Lab Tests</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity 
                     style={styles.quickActionItem} 
                     onPress={() => navigation.navigate('DoctorPrescriptions')}>
                     <LinearGradient
                       colors={['#F44336', '#EF5350']}
                       style={styles.quickActionCircle}>
                       <SimpleIcon name="medical" size={28} color="#FFFFFF" />
                     </LinearGradient>
                     <Text style={styles.quickActionText}>Prescriptions</Text>
                   </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={handleViewAllAppointments}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(appointment => renderAppointmentCard(appointment, true))
          ) : (
            <View style={styles.emptyStateContainer}>
              <SimpleIcon name="calendar-outline" size={48} color="#BDBDBD" />
              <Text style={styles.emptyStateTitle}>No Upcoming Appointments</Text>
              <Text style={styles.emptyStateMessage}>
                You currently have no upcoming appointments at the moment
              </Text>
            </View>
          )}
        </View>

        {/* Recent Appointments removed per request */}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#666666',
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 4,
  },
  specialty: {
    fontSize: 14,
    color: '#42A5F5',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsContainer: {
    marginTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    width: '48%',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    minHeight: 110,
  },
  statsGradient: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 110,
    backgroundColor: 'transparent',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  statsTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  section: {
    marginTop: 24,
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
  viewAllText: {
    fontSize: 14,
    color: '#42A5F5',
    fontWeight: '600',
  },
  // Quick Actions
  quickActionsSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  quickActionsContainer: {
    paddingRight: 20,
  },
  quickActionItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  quickActionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 200, // Increased height to ensure button text is visible
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  patientInfo: {
    flex: 1,
    marginRight: 12,
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
  appointmentTime: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#42A5F5',
  },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    minWidth: 45,
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reasonSection: {
    marginBottom: 8, // Reduced to give more space for button
    minHeight: 36,
  },
  reasonText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  buttonSection: {
    marginTop: 20, // Increased spacing from content
    marginBottom: 12, // More margin from card bottom
  },
  startButton: {
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    backgroundColor: '#42A5F5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 52,
    width: '100%',
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#42A5F5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Empty State Styles
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  },
});

export default DoctorDashboardScreen;
