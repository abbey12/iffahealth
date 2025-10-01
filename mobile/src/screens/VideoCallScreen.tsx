import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Share,
  ScrollView,
  Linking,
} from 'react-native';
// Using browser-based join; in-app RTC view not used
import { SafeAreaView } from 'react-native-safe-area-context';
import SimpleIcon from '../components/SimpleIcon';
import LinearGradient from 'react-native-linear-gradient';
import { dailyService, DailyConfig } from '../services/hmsService';
import InAppBrowser from 'react-native-inappbrowser-reborn';

interface VideoCallScreenProps {
  navigation: any;
  route: {
    params: {
      appointmentId: string;
      doctorId: string;
      patientId: string;
      doctorName: string;
      patientName: string;
      appointmentDate: string;
      appointmentTime: string;
      userType: 'doctor' | 'patient';
    };
  };
}

const VideoCallScreen: React.FC<VideoCallScreenProps> = ({
  navigation,
  route,
}) => {
  const {
    appointmentId,
    doctorId,
    patientId,
    doctorName,
    patientName,
    appointmentDate,
    appointmentTime,
    userType,
  } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [roomConfig, setRoomConfig] = useState<any>(null);
  const [meetingInstructions, setMeetingInstructions] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  // In-app call state removed for browser-based join

  useEffect(() => {
    initializeVideoCall();
    return () => {};
  }, []);

  const openInAppBrowser = async (url: string) => {
    try {
      const available = await InAppBrowser.isAvailable();
      if (available) {
        await InAppBrowser.open(url, {
          // iOS options
          dismissButtonStyle: 'close',
          preferredBarTintColor: '#1a1a2e',
          preferredControlTintColor: '#ffffff',
          readerMode: false,
          animated: true,
          modalEnabled: true,
          enableBarCollapsing: true,
          ephemeralWebSession: true,
          // Android options
          showTitle: true,
          toolbarColor: '#1a1a2e',
          secondaryToolbarColor: '#16213e',
          navigationBarColor: '#0f3460',
          enableUrlBarHiding: true,
        } as any);
        // When the in-app browser is closed, navigate back and trigger completion prompt for doctors
        try {
          if (userType === 'doctor') {
            navigation.navigate('DoctorAppointments', {
              completeAfterCall: true,
              appointmentId,
              patientId,
              patientName,
            });
          }
        } catch {}
        return;
      }
    } catch (e) {
      console.warn('⚠️ InAppBrowser not available, falling back to Linking:', e);
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Cannot open video call URL. Please ensure you have a browser installed.');
    }
  };

  const initializeVideoCall = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔍 VideoCallScreen params:', {
        appointmentId,
        doctorId,
        patientId,
        doctorName,
        patientName,
        appointmentDate,
        appointmentTime,
        userType
      });
      
      if (!appointmentId || !patientId || !doctorId || !doctorName || !patientName || !appointmentDate || !appointmentTime) {
        console.log('❌ Missing required params for video call:', {
          appointmentId,
          doctorId,
          patientId,
          doctorName,
          patientName,
          appointmentDate,
          appointmentTime,
        });
        Alert.alert('Missing Info', 'Some appointment details are missing. Please try again from the appointments list.');
        navigation.goBack();
        return;
      }
      
      // Check if it's the right time for the appointment
      const isValidTime = dailyService.isAppointmentTimeValid(appointmentDate, appointmentTime);
      if (!isValidTime) {
        Alert.alert(
          'Appointment Not Ready',
          'You can join 15 minutes before and up to 30 minutes after your appointment time.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Create room configuration
      const config: DailyConfig = {
        appointmentId,
        doctorId,
        patientId,
        doctorName,
        patientName,
        appointmentDate,
        appointmentTime,
      };
      
      console.log('🔍 DailyConfig created:', config);

      const roomConfig = await dailyService.createRoomConfig(config, userType);
      setRoomConfig(roomConfig);
      
      // Set meeting instructions
      const instructions = dailyService.getMeetingInstructions(userType);
      setMeetingInstructions(instructions);
      
      console.log('🎥 Video call initialized:', roomConfig);

      // Auto-open in in-app browser (SFSafariViewController/Custom Tabs) with secure token
      try {
        const urlWithToken = roomConfig?.token
          ? `${roomConfig.roomUrl}?t=${encodeURIComponent(roomConfig.token)}`
          : roomConfig.roomUrl;
        console.log('🌐 Opening Daily room in in-app browser:', urlWithToken);
        await openInAppBrowser(urlWithToken);
      } catch (openErr) {
        console.warn('⚠️ Could not open browser automatically, user can tap Join button:', openErr);
      }
    } catch (error) {
      console.error('❌ Error initializing video call:', error);
      Alert.alert(
        'Error',
        'Failed to initialize video call. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCall = async (cfg?: any) => {
    const effectiveConfig = cfg || roomConfig;
    if (!effectiveConfig) {
      Alert.alert('Error', 'Room configuration not available');
      return;
    }
    if (isJoining) return;
    try {
      setIsJoining(true);
      const urlWithToken = effectiveConfig?.token
        ? `${effectiveConfig.roomUrl}?t=${encodeURIComponent(effectiveConfig.token)}`
        : effectiveConfig.roomUrl;
      console.log('🌐 Opening Daily room in in-app browser:', urlWithToken);
      await openInAppBrowser(urlWithToken);
    } catch (error) {
      console.error('❌ Error opening browser:', error);
      Alert.alert('Error', 'Failed to open video room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const copyRoomUrl = async () => {
    if (!roomConfig) return;
    
    try {
      const { Clipboard } = await import('react-native');
      await Clipboard.setString(roomConfig.roomUrl);
      Alert.alert('Copied', 'Room URL copied to clipboard');
    } catch (error) {
      console.error('❌ Error copying room URL:', error);
      Alert.alert('Error', 'Failed to copy room URL');
    }
  };

  const shareRoomDetails = async () => {
    if (!roomConfig) return;

    try {
      const roomUrl = dailyService.getRoomUrl(roomConfig.roomUrl);
      await Share.share({
        message: `Join my medical consultation:\n\nRoom URL: ${roomConfig.roomUrl}\n\nAppointment: ${appointmentDate} at ${appointmentTime}`,
        url: roomUrl,
        title: 'Medical Consultation - Daily.co',
      });
    } catch (error) {
      console.error('❌ Error sharing room details:', error);
    }
  };

  const createCalendarEvent = () => {
    if (!roomConfig) return;

    try {
      const config: DailyConfig = {
        appointmentId,
        doctorId,
        patientId,
        doctorName,
        patientName,
        appointmentDate,
        appointmentTime,
      };

      const calendarUrl = dailyService.createCalendarEvent(config, roomConfig.roomUrl);
      Linking.openURL(calendarUrl);
    } catch (error) {
      console.error('❌ Error creating calendar event:', error);
      Alert.alert('Error', 'Failed to create calendar event');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Initializing video call...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!roomConfig) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <View style={styles.errorContainer}>
          <SimpleIcon name="alert-circle" size={48} color="#f44336" />
          <Text style={styles.errorTitle}>Video Call Not Available</Text>
          <Text style={styles.errorText}>
            Unable to initialize video call. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeVideoCall}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
      <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <SimpleIcon name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Consultation</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.meetingInfo}>
            <View style={styles.meetingIcon}>
              <SimpleIcon name="video" size={64} color="#4CAF50" />
      </View>

            <Text style={styles.meetingTitle}>Daily.co Video Call</Text>
            <Text style={styles.meetingSubtitle}>
              {userType === 'doctor' ? 'Patient' : 'Doctor'}: {userType === 'doctor' ? patientName : doctorName}
            </Text>
            
            <View style={styles.meetingDetails}>
              <View style={styles.detailRow}>
                <SimpleIcon name="calendar" size={18} color="#ffffff" />
                <Text style={styles.detailText}>{appointmentDate}</Text>
              </View>
              <View style={styles.detailRow}>
                <SimpleIcon name="clock" size={18} color="#ffffff" />
                <Text style={styles.detailText}>{appointmentTime}</Text>
              </View>
              <View style={styles.detailRow}>
                <SimpleIcon name="link" size={18} color="#ffffff" />
                <Text style={styles.detailText}>Room URL: {roomConfig.roomUrl}</Text>
              </View>
            </View>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Meeting Instructions</Text>
            <Text style={styles.instructionsText}>{meetingInstructions}</Text>
      </View>

          <View style={styles.secondaryButtons}>
        <TouchableOpacity
              style={styles.secondaryButton}
              onPress={copyRoomUrl}
            >
              <SimpleIcon name="copy" size={20} color="#4CAF50" />
              <Text style={styles.secondaryButtonText}>Copy Room URL</Text>
        </TouchableOpacity>

        <TouchableOpacity
              style={styles.secondaryButton}
              onPress={shareRoomDetails}
            >
              <SimpleIcon name="share" size={20} color="#4CAF50" />
              <Text style={styles.secondaryButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
              style={styles.secondaryButton}
              onPress={createCalendarEvent}
        >
              <SimpleIcon name="calendar" size={20} color="#4CAF50" />
              <Text style={styles.secondaryButtonText}>Add to Calendar</Text>
        </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Join Call Button - Fixed at bottom */}
        <View style={styles.joinButtonContainer}>
        <TouchableOpacity
            style={styles.joinButton}
          onPress={() => handleJoinCall()}
          disabled={isJoining}
        >
            <SimpleIcon name="video" size={28} color="#ffffff" />
          <Text style={styles.joinButtonText}>{isJoining ? 'Opening…' : 'Join in Browser'}</Text>
        </TouchableOpacity>
      </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for fixed join button
  },
  meetingInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  meetingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  meetingTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  meetingSubtitle: {
    color: '#cccccc',
    fontSize: 16,
    marginBottom: 24,
  },
  meetingDetails: {
    width: '100%',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: 'black',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  localVideo: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 120,
    height: 180,
    borderRadius: 8,
    zIndex: 2,
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  detailText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  instructionsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  instructionsText: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
  },
  joinButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34, // Safe area for home indicator
    borderTopWidth: 1,
    borderTopColor: 'rgba(76, 175, 80, 0.3)',
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default VideoCallScreen;