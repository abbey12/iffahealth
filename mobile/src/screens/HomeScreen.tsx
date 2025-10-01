import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import SimpleIcon from '../components/SimpleIcon';
import apiService from '../services/apiService';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import {useData} from '../context/DataContext';
import { formatAppointmentTime, formatAppointmentDate } from '../utils/timeUtils';

const {width, height} = Dimensions.get('window');

// Profile completion check function
const isProfileComplete = (patient: any): boolean => {
  if (!patient) return false;
  
  // First check if the database has marked the profile as complete
  if (patient.isProfileComplete === true) {
    return true;
  }
  
  // Fallback: Check if profile completion fields are filled
  // These are the fields required in the profile completion screen
  const requiredFields = [
    'dateOfBirth',
    'gender',
    'address',
    'city',
    'country',
    'emergencyContactName',
    'emergencyContactPhone',
    'emergencyContactRelation'
  ];
  
  return requiredFields.every(field => 
    patient[field] && patient[field].toString().trim() !== ''
  );
};

// Interfaces for structured data
interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  nextDose: string;
  status: 'active' | 'paused';
  color: string;
}

interface Appointment {
  id?: string;
  doctorId?: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: 'video';
  status: 'confirmed' | 'pending';
  color: string;
  meetingLink?: string;
  meetingId?: string;
  meetingPassword?: string;
  canJoinCall?: boolean;
}

interface Activity {
  title: string;
  description: string;
  time: string;
  type: 'medication' | 'lab' | 'appointment' | 'health' | 'notification';
  status: 'completed' | 'pending';
  icon: string;
  color: string;
}

interface LabTest {
  testName: string;
  testType: string;
  date: string;
  time: string;
  location: string;
  status: 'scheduled' | 'pending' | 'completed' | 'cancelled';
  color: string;
}

const HomeScreen = (): React.JSX.Element => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    patient,
    setPatient,
    upcomingAppointments,
    currentMedications,
    upcomingLabTests,
    healthRecords,
    recentHealthRecords,
    notifications,
    patientPrescriptions,
    isLoading,
    error,
    refreshAllData,
    loadUpcomingAppointments,
    loadCurrentMedications,
    loadUpcomingLabTests,
    loadPatientPrescriptions,
  } = useData();
  
  // Patient data
  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient';
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  
  // Load data on component mount
  useEffect(() => {
    if (patient && patient.profileId) {
      console.log('🏠 HomeScreen: Patient found, calling refreshAllData');
      console.log('🏠 HomeScreen: Patient profileId:', patient.profileId);
      refreshAllData(patient.profileId);
    }
  }, [patient?.profileId]);

  // Debug patient data
  useEffect(() => {
    console.log('🏠 HomeScreen: Patient data:', patient);
    console.log('🏠 HomeScreen: Patient ID:', patient?.id);
    console.log('🏠 HomeScreen: Patient profileId:', patient?.profileId);
  }, [patient]);

  // Debug upcoming appointments
  useEffect(() => {
    console.log('🏠 HomeScreen: Upcoming appointments state:', upcomingAppointments);
    console.log('🏠 HomeScreen: Upcoming appointments length:', upcomingAppointments?.length || 0);
  }, [upcomingAppointments]);

  // Pull to refresh function
  const onRefresh = async () => {
    if (!patient?.profileId) return;
    
    setRefreshing(true);
    try {
      console.log('🔄 HomeScreen: Pull to refresh triggered');
      await refreshAllData(patient.profileId);
      console.log('✅ HomeScreen: Pull to refresh completed');
    } catch (error) {
      console.error('❌ HomeScreen: Pull to refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Flag to hide legacy sections during the overhaul
  const SHOW_LEGACY_SECTIONS = false;

  // Tick to refresh time-based visibility (every 60s)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // Local loading state for Current Happenings only
  const [isHappeningsLoading, setIsHappeningsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paidFollowups, setPaidFollowups] = useState<Set<string>>(new Set());

  const loadCurrentHappenings = async () => {
    if (!patient?.profileId) return;
    try {
      setIsHappeningsLoading(true);
      // Fetch only what Current Happenings needs
      await Promise.all([
        // Fetch all scheduled/confirmed to include follow-ups
        (async () => {
          try {
            const resp = await apiService.getUpcomingAppointments(String(patient.profileId));
            // already updates context in DataContext; no-op here
          } catch {}
        })(),
        patient?.id ? loadCurrentMedications(patient.id) : Promise.resolve(),
        loadUpcomingLabTests(patient.profileId),
        loadPatientPrescriptions(patient.profileId),
      ]);
    } catch (e) {
      // Non-blocking
    } finally {
      setIsHappeningsLoading(false);
    }
  };

  // Refresh Current Happenings whenever the dashboard gains focus
  useFocusEffect(
    React.useCallback(() => {
      if (patient?.profileId) {
        loadCurrentHappenings();
      }
    }, [patient?.profileId, patient?.id])
  );

  // Helpers for appointment date/time normalization
  const normalizeAppointmentDateTime = (apt: any): Date | null => {
    try {
      const rawDate: string = apt.appointment_date || apt.date;
      const rawTime: string = apt.appointment_time || apt.time;
      if (!rawDate || !rawTime) return null;

      // Normalize date to YYYY-MM-DD if formatted like "Mon, Sep 29, 2025"
      let datePart = rawDate;
      // If ISO like 2025-09-29T00:00:00.000Z, extract date portion
      if (typeof rawDate === 'string' && rawDate.includes('T')) {
        datePart = rawDate.split('T')[0];
      }
      if (typeof rawDate === 'string' && rawDate.includes(',')) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, '0');
          const d = String(parsed.getDate()).padStart(2, '0');
          datePart = `${y}-${m}-${d}`;
        }
      }

      // Normalize time to 24h HH:mm
      const t = String(rawTime).trim();
      let hh = '00';
      let mm = '00';
      const ampm = /(\d{1,2}):(\d{2})\s*([AP]M)/i.exec(t);
      if (ampm) {
        let h = parseInt(ampm[1], 10);
        mm = ampm[2];
        const period = ampm[3].toUpperCase();
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        hh = String(h).padStart(2, '0');
      } else {
        const hm = /(\d{1,2}):(\d{2})/.exec(t);
        if (hm) {
          hh = String(parseInt(hm[1], 10)).padStart(2, '0');
          mm = hm[2];
        }
      }

      const candidate = new Date(`${datePart}T${hh}:${mm}`);
      if (isNaN(candidate.getTime())) return null;
      return candidate;
    } catch { return null; }
  };

  const isWithinJoinWindow = (start: Date): boolean => {
    const now = new Date();
    const fifteenMin = 15 * 60 * 1000;
    const thirtyMin = 30 * 60 * 1000;
    return now.getTime() >= start.getTime() - fifteenMin && now.getTime() <= start.getTime() + thirtyMin;
  };

  const isWithinDays = (start: Date, days: number): boolean => {
    const now = new Date();
    return start.getTime() - now.getTime() <= days * 24 * 60 * 60 * 1000 && start.getTime() >= now.getTime();
  };

  // Profile completion check disabled - patients go directly to dashboard after signup
  // useEffect(() => {
  //   if (patient && !isProfileComplete(patient)) {
  //     // Small delay to ensure navigation is ready
  //     const timer = setTimeout(() => {
  //       (navigation as any).navigate('PatientProfileCompletion');
  //     }, 100);
  //     return () => clearTimeout(timer);
  //   }
  // }, [patient, navigation]);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  // Determine greeting based on time of day
  const getGreeting = () => {
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Handle Quick Action navigation
  const handleQuickAction = (actionId: number) => {
    switch (actionId) {
      case 1: // Book Doctor
        navigation.navigate('DoctorList' as never);
        break;
      case 2: // AI Assistant
        navigation.navigate('AIAssistant' as never);
        break;
      case 3: // View Records
        navigation.navigate('HealthRecords' as never);
        break;
      case 4: // Medications
        navigation.navigate('Medications' as never);
        break;
      case 5: // Lab Tests
        navigation.navigate('PatientLabTest' as never);
        break;
      case 6: // Video Test
        // Navigate to Google Meet video call for testing
        if (upcomingAppointments && upcomingAppointments.length > 0) {
          const testAppointment = upcomingAppointments[0];
          openVideoCall(testAppointment);
        } else {
          Alert.alert('No Appointments', 'You need to have an upcoming appointment to test video calls.');
        }
        break;
      case 7: // Emergency
        // Handle emergency - could open phone dialer
        console.log('Emergency pressed');
        break;
      default:
        break;
    }
  };

  // Video call functions
  const handleJoinCall = async (appointment: any) => {
    // Always navigate to VideoCall; timing checks and room creation happen there
    openVideoCall(appointment);
  };

  const openVideoCall = async (appointment: any) => {
    try {
      // Normalize params from both mapped UI shape and potential raw API shape
      const normalizedAppointmentId = (appointment as any).id || (appointment as any).appointment_id || '';
      const normalizedDoctorId = (appointment as any).doctorId || (appointment as any).doctor_id || '';
      const normalizedDate = (appointment as any).date || (appointment as any).appointment_date || '';
      const normalizedTime = (appointment as any).time || (appointment as any).appointment_time || '';

      // Navigate to VideoCallScreen
      (navigation as any).navigate('VideoCall', {
        appointmentId: normalizedAppointmentId,
        doctorId: normalizedDoctorId,
        patientId: patient?.profileId || patient?.id,
        doctorName: (appointment as any).doctorName || `${(appointment as any).doctor_first_name || ''} ${(appointment as any).doctor_last_name || ''}`.trim() || 'Doctor',
        patientName: `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient',
        appointmentDate: normalizedDate,
        appointmentTime: normalizedTime,
        meetLink: appointment.meetingLink ? {
          meetingUrl: appointment.meetingLink,
          meetingId: appointment.meetingId || '',
          joinUrl: appointment.meetingLink,
          recordingEnabled: true
        } : undefined,
        userType: 'patient',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to start video call. Please try again.');
    }
  };

  const handleAcceptFollowUp = async (apt: any) => {
    try {
      if (!apt?.id || !patient?.email || !patient?.profileId) {
        Alert.alert('Missing info', 'Cannot start payment.');
      return;
    }
      setIsProcessingPayment(true);
      const amount = 50 * 100; // pesewas
      const init = await apiService.initializePayment({
        appointmentId: apt.id,
        amount,
        email: patient.email,
        patientId: patient.profileId,
        doctorId: apt.doctor_id || '',
        doctorName: `${apt.doctor_first_name || ''} ${apt.doctor_last_name || ''}`.trim(),
        appointmentDate: apt.appointment_date,
        appointmentTime: apt.appointment_time,
      });
      const url = (init as any)?.data?.authorization_url || (init as any)?.authorization_url;
      const reference = (init as any)?.data?.reference || (init as any)?.reference;
      if (!url || !reference) {
        Alert.alert('Payment', 'Unable to start payment.');
        setIsProcessingPayment(false);
      return;
    }

      // Open in-app browser to complete payment
      try {
        const available = await InAppBrowser.isAvailable();
        if (available) {
          await InAppBrowser.open(url, {
            showTitle: true,
            toolbarColor: '#1976D2',
            secondaryToolbarColor: '#42A5F5',
            enableUrlBarHiding: true,
            enableBarCollapsing: true,
            ephemeralWebSession: true,
          } as any);
        } else {
          await Linking.openURL(url);
        }
      } catch {
        // If user cancels, we still attempt verification below
      }

      // After browser dismiss, verify payment status with retries
      const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(() => resolve(), ms));
      let verified = false;
      for (let i = 0; i < 6 && !verified; i++) { // up to ~18s
        try {
          const v = await apiService.verifyPayment(reference);
          const status = (v as any)?.data?.status || (v as any)?.status;
          if (status && String(status).toLowerCase() === 'success') {
            verified = true;
            // mark appointment as paid for safety
            try {
              await apiService.updateAppointment(apt.id, {
                payment_status: 'paid',
                amount: 50,
              } as any);
            } catch {}
            // locally flag as paid so UI switches immediately
            setPaidFollowups((prev) => {
              const next = new Set(prev);
              if (apt?.id) next.add(String(apt.id));
              return next;
            });
            await loadCurrentHappenings();
            Alert.alert('Payment Successful', 'Your follow-up has been confirmed.');
            break;
          }
        } catch {}
        await sleep(3000);
      }
      if (!verified) {
        Alert.alert('Payment Pending', 'We could not confirm payment yet. It may take a moment to reflect.');
      }
    } catch (e) {
      Alert.alert('Payment', 'Failed to start payment.');
    }
    finally {
      setIsProcessingPayment(false);
    }
  };

  // Quick Actions data
  const quickActions = [
    {
      id: 1,
      title: 'Book Doctor',
      icon: 'event',
      color: '#1976D2',
      gradient: ['#1976D2', '#42A5F5'],
    },
    {
      id: 2,
      title: 'AI Assistant',
      icon: 'smart-toy',
      color: '#7B1FA2',
      gradient: ['#7B1FA2', '#BA68C8'],
    },
    {
      id: 3,
      title: 'View Records',
      icon: 'folder',
      color: '#388E3C',
      gradient: ['#388E3C', '#66BB6A'],
    },
    {
      id: 4,
      title: 'Medications',
      icon: 'medication',
      color: '#FF9800',
      gradient: ['#FF9800', '#FFB74D'],
    },
    {
      id: 5,
      title: 'Lab Tests',
      icon: 'science',
      color: '#F44336',
      gradient: ['#F44336', '#EF5350'],
    },
    {
      id: 6,
      title: 'Video Test',
      icon: 'videocam',
      color: '#9C27B0',
      gradient: ['#9C27B0', '#BA68C8'],
    },
    {
      id: 7,
      title: 'Emergency',
      icon: 'emergency',
      color: '#D32F2F',
      gradient: ['#D32F2F', '#F44336'],
    },
  ];

  // Transform API data to display format (medication list no longer shown here)

  // Derive Current Happenings data
  const nextAppointment = useMemo(() => {
    const items = (upcomingAppointments as any[])
      .map(a => ({ a, dt: normalizeAppointmentDateTime(a) }))
      .filter(x => x.dt && isWithinDays(x.dt as Date, 14))
      .sort((x, y) => (x.dt as Date).getTime() - (y.dt as Date).getTime());
    return items.length > 0 ? items[0].a : null;
  }, [upcomingAppointments, tick]);

  const nextDueMeds = useMemo(() => {
    // Prefer explicit reminders saved on device (My Medications screen)
    const key = patient?.id ? `patient:${patient.id}:medication_reminders` : undefined;
    if (key) {
      // Synchronously read is not possible; fallback to basic list below.
      // We will populate from AsyncStorage via an effect and cache locally.
    }
    // Fallback: show up to two active meds when reminders are not yet loaded
    return currentMedications.filter(m => m.status === 'active').slice(0, 2);
  }, [currentMedications, tick]);

  // Load reminders from storage so we can surface next-due items prominently
  const [storedReminders, setStoredReminders] = useState<any[]>([]);
  useEffect(() => {
    const loadStoredReminders = async () => {
      try {
        if (!patient?.id) return;
        const key = `patient:${patient.id}:medication_reminders`;
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setStoredReminders(parsed);
        }
      } catch {}
    };
    loadStoredReminders();
  }, [patient?.id, tick, isHappeningsLoading]);

  const nextLab = useMemo(() => {
    const items = (upcomingLabTests as any[])
      .map(t => ({ t, d: new Date(t.test_date) }))
      .filter(x => !isNaN(x.d.getTime()) && isWithinDays(x.d, 14))
      .sort((x, y) => x.d.getTime() - y.d.getTime());
    return items.length > 0 ? items[0].t : null;
  }, [upcomingLabTests, tick]);

  // Determine if anything is present to show in Current Happenings
  const hasAnyHappenings = useMemo(() => {
    const hasAppt = !!nextAppointment;
    const hasMeds = (storedReminders && storedReminders.length > 0) || (currentMedications?.some(m => m.status === 'active'));
    const hasLab = !!nextLab;
    return hasAppt || hasMeds || hasLab;
  }, [nextAppointment, storedReminders, currentMedications, nextLab]);

  // Helper: filter out past appointments from Upcoming
  const isFutureAppointment = (apt: any): boolean => {
    try {
      const rawDate: string = apt.appointment_date || apt.date;
      const rawTime: string = apt.appointment_time || apt.time;
      if (!rawDate || !rawTime) return true; // if uncertain, keep it visible

      // Normalize date to YYYY-MM-DD when possible
      let datePart = rawDate;
      if (typeof rawDate === 'string' && rawDate.includes(',')) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, '0');
          const d = String(parsed.getDate()).padStart(2, '0');
          datePart = `${y}-${m}-${d}`;
        }
      }

      // Normalize time to 24h HH:mm
      const t = String(rawTime).trim();
      let hh = '00';
      let mm = '00';
      const ampm = /(\d{1,2}):(\d{2})\s*([AP]M)/i.exec(t);
      if (ampm) {
        let h = parseInt(ampm[1], 10);
        mm = ampm[2];
        const period = ampm[3].toUpperCase();
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        hh = String(h).padStart(2, '0');
      } else {
        const hm = /(\d{1,2}):(\d{2})/.exec(t);
        if (hm) {
          hh = String(parseInt(hm[1], 10)).padStart(2, '0');
          mm = hm[2];
        }
      }

      const candidate = new Date(`${datePart}T${hh}:${mm}`);
      if (isNaN(candidate.getTime())) return true;
      const now = new Date();
      return candidate.getTime() >= now.getTime();
    } catch {
      return true;
    }
  };

  // Legacy appointments list removed; unified into Current Happenings

  // Legacy lab tests list removed; unified into Current Happenings

  // Recent activities section removed from dashboard

  if (isLoading && !patient) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading your health data...</Text>
      </View>
    );
  }

  // Show loading overlay when refreshing
  if (refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Refreshing your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1976D2']} // Android
            tintColor="#1976D2" // iOS
            title="Pull to refresh"
            titleColor="#666"
          />
        }>
        
        {/* Greetings Card */}
        <View style={styles.greetingsCardContainer}>
          <View style={styles.greetingsCard}>
            <LinearGradient
              colors={['#1976D2', '#42A5F5']}
              style={styles.greetingsGradient}>
              <View style={styles.greetingsContent}>
                <View style={styles.greetingsTextContainer}>
                  <Text style={styles.greetingText}>{getGreeting()}</Text>
                  <Text style={styles.patientNameText}>{patientName}</Text>
                  <Text style={styles.welcomeText}>Welcome to your health dashboard</Text>
                </View>
                <View style={styles.greetingsIconContainer}>
                  <SimpleIcon name="local-hospital" size={36} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
                 <ScrollView 
                   horizontal 
                   showsHorizontalScrollIndicator={false}
                   contentContainerStyle={styles.quickActionsContainer}>
                   {quickActions.map((action) => (
                     <TouchableOpacity 
                       key={action.id} 
                       style={styles.quickActionItem}
                       onPress={() => handleQuickAction(action.id)}>
                       <LinearGradient
                         colors={action.gradient}
                         style={styles.quickActionCircle}>
                         <SimpleIcon name={action.icon} size={28} color="#FFFFFF" />
                       </LinearGradient>
                       <Text style={styles.quickActionText}>{action.title}</Text>
                     </TouchableOpacity>
                   ))}
                 </ScrollView>
        </View>

        {/* Current Happenings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Happenings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HealthRecords' as never)}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.appointmentsList}>
            {isHappeningsLoading ? (
              <View style={styles.emptyStateContainer}>
                <ActivityIndicator size="small" color="#1976D2" />
                <Text style={[styles.emptyStateMessage, {marginTop: 8}]}>Loading current happenings…</Text>
              </View>
            ) : null}
            {/* Upcoming Appointment Row */}
            {nextAppointment ? (
              <View style={styles.appointmentCard}>
                  <View style={styles.appointmentInfo}>
                    <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{`${nextAppointment.doctor_first_name || ''} ${nextAppointment.doctor_last_name || ''}`.trim() || 'Doctor'}</Text>
                    <Text style={styles.specialty}>{nextAppointment.doctor_specialty || 'General Practice'}</Text>
                    </View>
                    <View style={styles.appointmentTime}>
                    <Text style={styles.appointmentDate}>{formatAppointmentDate(nextAppointment.appointment_date)}</Text>
                    <Text style={styles.appointmentTimeText}>{formatAppointmentTime(nextAppointment.appointment_time, nextAppointment.appointment_date)}</Text>
                    </View>
                  </View>
                  <View style={styles.appointmentType}>
                  <SimpleIcon name="videocam" size={16} color="#1976D2" />
                  <Text style={[styles.appointmentTypeText, {color: '#1976D2'}]}>Video Call</Text>
                  </View>
                {(() => {
                  const isFollowup = Boolean((nextAppointment as any)?.is_followup) || String(nextAppointment?.notes || '').toUpperCase().includes('FOLLOWUP');
                  if (!isFollowup) {
                    const dt = normalizeAppointmentDateTime(nextAppointment);
                    if (dt && isWithinJoinWindow(dt)) {
                      return (
                    <TouchableOpacity 
                      style={styles.joinCallButton}
                          onPress={() => handleJoinCall({
                            id: nextAppointment.id,
                            doctorId: nextAppointment.doctor_id,
                            doctorName: `${nextAppointment.doctor_first_name || ''} ${nextAppointment.doctor_last_name || ''}`.trim(),
                            appointment_date: nextAppointment.appointment_date,
                            appointment_time: nextAppointment.appointment_time,
                            type: nextAppointment.type,
                            status: nextAppointment.status,
                          })}
                          activeOpacity={0.9}
                        >
                          <LinearGradient colors={["#43A047", "#66BB6A"]} style={styles.joinCallGradient}>
                            <SimpleIcon name="video-call" size={18} color="#ffffff" />
                            <Text style={styles.joinCallButtonText}>Join Video Call</Text>
                          </LinearGradient>
                    </TouchableOpacity>
                      );
                    }
                    return null;
                  }

                  const isPaid = String((nextAppointment as any)?.payment_status || '').toLowerCase() === 'paid' || (nextAppointment?.id ? paidFollowups.has(String(nextAppointment.id)) : false);
                  if (isPaid) {
                    return (
                      <TouchableOpacity 
                        style={styles.joinCallButton}
                        onPress={() => handleJoinCall({
                          id: nextAppointment.id,
                          doctorId: nextAppointment.doctor_id,
                          doctorName: `${nextAppointment.doctor_first_name || ''} ${nextAppointment.doctor_last_name || ''}`.trim(),
                          appointment_date: nextAppointment.appointment_date,
                          appointment_time: nextAppointment.appointment_time,
                          type: nextAppointment.type,
                          status: nextAppointment.status,
                        })}
                        activeOpacity={0.9}
                      >
                        <LinearGradient colors={["#1976D2", "#42A5F5"]} style={styles.joinCallGradient}>
                          <SimpleIcon name="videocam" size={18} color="#ffffff" />
                          <Text style={styles.joinCallButtonText}>Start Video Call</Text>
                        </LinearGradient>
            </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity 
                      style={styles.joinCallButton}
                      onPress={() => handleAcceptFollowUp(nextAppointment)}
                      activeOpacity={0.9}
                    >
                      <LinearGradient colors={["#1976D2", "#42A5F5"]} style={styles.joinCallGradient}>
                        {isProcessingPayment ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <SimpleIcon name="payments" size={18} color="#ffffff" />
                        )}
                        <Text style={styles.joinCallButtonText}>{isProcessingPayment ? 'Processing…' : 'Accept & Pay GHC 50.00'}</Text>
                      </LinearGradient>
            </TouchableOpacity>
                  );
                })()}
          </View>
            ) : null}

            {/* Current Prescriptions Row */}
            {(storedReminders && storedReminders.length > 0) || (nextDueMeds && nextDueMeds.length > 0) ? (
              <View style={styles.medicationCard}>
                  <View style={styles.medicationInfo}>
                  <View style={[styles.medicationIcon, {backgroundColor: '#FF980020'}]}>
                    <SimpleIcon name="medication" size={20} color="#FF9800" />
                    </View>
                    <View style={styles.medicationDetails}>
                    <Text style={styles.medicationName}>Current Medications</Text>
                    <Text style={styles.medicationDosage} numberOfLines={1}>
                      {(storedReminders.length > 0
                        ? Array.from(new Set(storedReminders.map((r: any) => r.medicationName))).slice(0, 3)
                        : nextDueMeds.map((m) => m.name)
                      ).join(', ')}
                </Text>
              </View>
          </View>
                <TouchableOpacity onPress={() => navigation.navigate('Medications' as never)}>
                  <Text style={styles.seeAllText}>Manage</Text>
            </TouchableOpacity>
        </View>
            ) : null}

            {/* Upcoming Lab Row */}
            {nextLab ? (
              <TouchableOpacity style={styles.labTestCard} onPress={() => navigation.navigate('PatientLabTest' as never)}>
                  <View style={styles.labTestInfo}>
                    <View style={styles.labTestDetails}>
                    <Text style={styles.labTestName}>{nextLab.test_name || 'Lab Test'}</Text>
                    <Text style={styles.labTestType}>{nextLab.test_type}</Text>
                    {!!nextLab.location && <Text style={styles.labTestLocation}>{nextLab.location}</Text>}
          </View>
                    <View style={styles.labTestTime}>
                    <Text style={styles.labTestDate}>{new Date(nextLab.test_date).toLocaleDateString()}</Text>
                    <Text style={styles.labTestTimeText}>{nextLab.test_time}</Text>
                  </View>
                  </View>
                  <View style={styles.labTestStatus}>
                  <SimpleIcon name="science" size={16} color="#4CAF50" />
                  <Text style={[styles.labTestStatusText, {color: '#4CAF50'}]}>Scheduled</Text>
                  </View>
                </TouchableOpacity>
            ) : null}

            {!isHappeningsLoading && !hasAnyHappenings ? (
              <View style={styles.emptyStateContainer}>
                <SimpleIcon name="check-circle" size={48} color="#BDBDBD" />
                <Text style={styles.emptyStateTitle}>You’re all caught up</Text>
                <Text style={styles.emptyStateMessage}>No immediate items. Book a doctor, manage meds, or schedule a lab.</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Upcoming Lab Tests section removed */}

        {/* Current Medications section removed */}

        {/* Prescriptions section removed */}

        {/* Recent Activities section removed */}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  
  // Greetings Card
  greetingsCardContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  greetingsCard: {
    borderRadius: 24,
    height: 180,
    width: '100%',
    minHeight: 160,
    minWidth: 280,
  },
  greetingsGradient: {
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    height: '100%',
    width: '100%',
  },
  greetingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    flex: 1,
  },
  greetingsTextContainer: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 8,
  },
  greetingText: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  patientNameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 34,
    letterSpacing: 0.3,
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.85,
    lineHeight: 22,
    fontWeight: '400',
    paddingBottom: 8,
    marginBottom: 8,
  },
  greetingsIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginLeft: 8,
  },

  // Quick Actions
  quickActionsSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
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

  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },

  // Medications
  medicationsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  medicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  medicationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  medicationDetails: {
    flex: 1,
    minWidth: 0,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  medicationNext: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  medicationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },

  // Appointments
  appointmentsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  appointmentCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  appointmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: '#666666',
  },
  appointmentTime: {
    alignItems: 'flex-end',
  },
  appointmentDate: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 2,
  },
  appointmentTimeText: {
    fontSize: 12,
    color: '#666666',
  },
  appointmentType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  appointmentTypeText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  joinCallButton: {
    borderRadius: 999,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  joinCallGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    shadowColor: '#43A047',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  joinCallButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Lab Tests
  labTestsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  labTestCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  labTestInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  labTestDetails: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  labTestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  labTestType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  labTestLocation: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  labTestTime: {
    alignItems: 'flex-end',
  },
  labTestDate: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 2,
  },
  labTestTimeText: {
    fontSize: 12,
    color: '#666666',
  },
  labTestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  labTestStatusText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Activities
  activitiesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  activityStatus: {
    alignItems: 'center',
    marginLeft: 12,
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

export default HomeScreen;
