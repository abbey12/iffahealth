import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import SimpleIcon from '../components/SimpleIcon';
import {RtcSurfaceView, VideoViewSetupMode} from 'react-native-agora';
import agoraService, {AgoraCallConfig, AgoraCallState} from '../services/agoraService';

const {width, height} = Dimensions.get('window');

interface DoctorVideoCallScreenProps {
  navigation: any;
  route: any;
}

const DoctorVideoCallScreen = ({navigation, route}: DoctorVideoCallScreenProps): React.JSX.Element => {
  const {appointmentId, patientName, channelName, isHost} = route.params;
  
  const [callState, setCallState] = useState<AgoraCallState>(agoraService.getCallState());
  const [isInitializing, setIsInitializing] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeCall();
    
    // Set up callbacks
    agoraService.setCallbacks({
      onCallStateChanged: setCallState,
      onError: (error) => {
        Alert.alert('Call Error', error, [
          {text: 'OK', onPress: () => navigation.goBack()}
        ]);
      },
      onUserJoined: (uid) => {
        console.log('User joined call:', uid);
      },
      onUserLeft: (uid) => {
        console.log('User left call:', uid);
      },
      onConnectionStateChanged: (state) => {
        if (state === 1) { // Connected
          setIsConnecting(false);
          startCallTimer();
        }
      },
    });

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  const initializeCall = async () => {
    try {
      setIsInitializing(true);
      console.log('🚀 Initializing video call for doctor...');
      
      // Initialize Agora
      console.log('📱 Initializing Agora engine...');
      const initialized = await agoraService.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Agora video engine. Please check your internet connection and try again.');
      }

      // Join channel
      const config: AgoraCallConfig = {
        channelName: channelName || `appointment_${appointmentId}`,
        token: undefined, // No token for now
        uid: Math.floor(Math.random() * 100000),
        isHost: true, // Doctor is always the host
      };

      console.log('🔗 Joining video channel:', config.channelName);
      setIsConnecting(true);
      const joined = await agoraService.joinChannel(config);
      
      if (!joined) {
        throw new Error('Failed to join video channel. Please check your internet connection and permissions.');
      }
      
      console.log('✅ Video call initialized successfully');
    } catch (error) {
      console.error('❌ Call initialization failed:', error);
      Alert.alert(
        'Video Call Failed',
        `Unable to start the video call: ${error.message || error}\n\nPlease ensure you have granted camera and microphone permissions and have a stable internet connection.`,
        [
          {text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack()},
          {text: 'Retry', onPress: () => initializeCall()}
        ]
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const startCallTimer = () => {
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = async () => {
    await agoraService.toggleMute();
  };

  const handleVideoToggle = async () => {
    await agoraService.toggleVideo();
  };

  const handleCameraSwitch = async () => {
    await agoraService.switchCamera();
  };

  const handleEndCall = async () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this consultation?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            await agoraService.leaveChannel();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleAddNotes = () => {
    Alert.alert('Add Notes', 'Notes feature will be available soon!');
  };

  const handlePrescribe = () => {
    Alert.alert('Prescribe', 'Prescription feature will be available soon!');
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Initializing video call...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Video Area */}
      <View style={styles.videoContainer}>
        {/* Remote Video (Patient) */}
        {callState.remoteUsers.length > 0 ? (
          <RtcSurfaceView
            style={styles.remoteVideo}
            canvas={{
              uid: callState.remoteUsers[0],
              setupMode: VideoViewSetupMode.Replace,
            }}
          />
        ) : (
          <View style={styles.remoteVideoPlaceholder}>
            <SimpleIcon name="person" size={80} color="#FFFFFF" />
            <Text style={styles.patientNameText}>{patientName}</Text>
            <Text style={styles.connectionStatus}>
              {isConnecting ? 'Connecting...' : callState.isJoined ? 'Waiting for patient...' : 'Disconnected'}
            </Text>
          </View>
        )}

        {/* Local Video (Doctor) */}
        {callState.isJoined && (
          <RtcSurfaceView
            style={styles.localVideo}
            canvas={{
              uid: 0,
              setupMode: VideoViewSetupMode.Replace,
            }}
          />
        )}

        {/* No video overlay */}
        {!callState.isVideoEnabled && (
          <View style={styles.noVideoOverlay}>
            <SimpleIcon name="videocam-off" size={48} color="#fff" />
            <Text style={styles.noVideoText}>Camera Off</Text>
          </View>
        )}

        {/* Call Timer */}
        {callState.isJoined && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(callDuration)}</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleAddNotes}>
            <SimpleIcon name="note-add" size={24} color="#FFFFFF" />
            <Text style={styles.controlText}>Notes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={handlePrescribe}>
            <SimpleIcon name="medication" size={24} color="#FFFFFF" />
            <Text style={styles.controlText}>Prescribe</Text>
          </TouchableOpacity>
        </View>

        {/* Main Controls */}
        <View style={styles.mainControls}>
          <TouchableOpacity
            style={[styles.controlButton, callState.isMuted && styles.controlButtonActive]}
            onPress={handleMuteToggle}>
            <SimpleIcon 
              name={callState.isMuted ? 'mic-off' : 'mic'} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !callState.isVideoEnabled && styles.controlButtonActive]}
            onPress={handleVideoToggle}>
            <SimpleIcon 
              name={callState.isVideoEnabled ? 'videocam' : 'videocam-off'} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleCameraSwitch}>
            <SimpleIcon name="flip-camera-ios" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={handleEndCall}>
            <SimpleIcon name="call-end" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  localVideo: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
  },
  noVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  noVideoText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideoPlaceholder: {
    alignItems: 'center',
  },
  patientNameText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  connectionStatus: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 8,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  localVideoPlaceholder: {
    alignItems: 'center',
  },
  doctorText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
  },
  timerContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  controlButtonActive: {
    backgroundColor: '#F44336',
  },
  endCallButton: {
    backgroundColor: '#F44336',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default DoctorVideoCallScreen;
