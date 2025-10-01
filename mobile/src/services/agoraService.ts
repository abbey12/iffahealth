// Import Agora SDK with fallback
let RtcEngine: any;
let ChannelProfileType: any;
let ClientRole: any;
let ConnectionStateType: any;
let VideoViewSetupMode: any;

try {
  const agora = require('react-native-agora');
  RtcEngine = agora.RtcEngine;
  ChannelProfileType = agora.ChannelProfileType;
  ClientRole = agora.ClientRole;
  ConnectionStateType = agora.ConnectionStateType;
  VideoViewSetupMode = agora.VideoViewSetupMode;
  console.log('✅ Agora SDK imported successfully');
} catch (error) {
  console.error('❌ Failed to import Agora SDK:', error);
  // Set fallback values
  RtcEngine = null;
  ChannelProfileType = { Communication: 0 };
  ClientRole = { Broadcaster: 1, Audience: 2 };
  ConnectionStateType = { Disconnected: 1, Connecting: 2, Connected: 3, Reconnecting: 4, Failed: 5 };
  VideoViewSetupMode = { Cover: 0, Contain: 1 };
}
import {AGORA_CONFIG, AGORA_ERROR_CODES, AGORA_EVENTS} from '../config/agora';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import { API_CONFIG } from '../config/api';
import apiService, { API_BASE_URL } from './apiService';

export interface AgoraCallConfig {
  channelName: string;
  token?: string;
  uid: number;
  isHost: boolean;
}

export interface AgoraCallState {
  isJoined: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerEnabled: boolean;
  connectionState: ConnectionStateType;
  remoteUsers: number[];
  error?: string;
}

class AgoraService {
  private engine: RtcEngine | null = null;
  private callState: AgoraCallState = {
    isJoined: false,
    isMuted: false,
    isVideoEnabled: true,
    isSpeakerEnabled: false,
    connectionState: ConnectionStateType.Disconnected,
    remoteUsers: [],
  };

  private callbacks: {
    onUserJoined?: (uid: number) => void;
    onUserLeft?: (uid: number) => void;
    onError?: (error: string) => void;
    onConnectionStateChanged?: (state: ConnectionStateType) => void;
    onCallStateChanged?: (state: AgoraCallState) => void;
  } = {};

  // Initialize Agora Engine
  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Initializing Agora engine with App ID:', AGORA_CONFIG.APP_ID);
      
      // Check if RtcEngine is available
      if (!RtcEngine || typeof RtcEngine.create !== 'function') {
        const errorMsg = 'RtcEngine is not available. Please ensure react-native-agora is properly installed and linked. For iOS, run "cd ios && pod install" and rebuild the app.';
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }
      
      // Check if engine already exists
      if (this.engine) {
        console.log('⚠️ Engine already exists, destroying first');
        await this.destroy();
      }
      
      console.log('📱 Creating RtcEngine instance...');
      this.engine = await RtcEngine.create(AGORA_CONFIG.APP_ID);
      
      if (!this.engine) {
        throw new Error('Failed to create Agora engine');
      }

      console.log('✅ Agora engine created successfully');

      // Set up event listeners
      this.setupEventListeners();
      
      // Enable video
      await this.engine.enableVideo();
      console.log('✅ Video enabled');
      
      // Enable audio
      await this.engine.enableAudio();
      console.log('✅ Audio enabled');
      
      // Set channel profile
      await this.engine.setChannelProfile(ChannelProfileType.Communication);
      console.log('✅ Channel profile set to Communication');
      
      // Set audio profile
      await this.engine.setAudioProfile(1, 1); // Default audio profile
      console.log('✅ Audio profile set');
      
      console.log('🎉 Agora engine initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Agora engine:', error);
      this.callbacks.onError?.(`Initialization failed: ${error}`);
      return false;
    }
  }

  // Set up event listeners
  private setupEventListeners() {
    if (!this.engine) return;

    // User joined
    this.engine.addListener(AGORA_EVENTS.USER_JOINED, (uid: number) => {
      console.log('User joined:', uid);
      this.callState.remoteUsers.push(uid);
      this.callbacks.onUserJoined?.(uid);
      this.notifyCallStateChanged();
    });

    // User left
    this.engine.addListener(AGORA_EVENTS.USER_OFFLINE, (uid: number) => {
      console.log('User left:', uid);
      this.callState.remoteUsers = this.callState.remoteUsers.filter(id => id !== uid);
      this.callbacks.onUserLeft?.(uid);
      this.notifyCallStateChanged();
    });

    // Error handling
    this.engine.addListener(AGORA_EVENTS.ERROR, (errorCode: number, message: string) => {
      console.error('Agora error:', errorCode, message);
      this.callState.error = message;
      this.callbacks.onError?.(message);
      this.notifyCallStateChanged();
    });

    // Connection state changed
    this.engine.addListener(AGORA_EVENTS.CONNECTION_STATE_CHANGED, (state: ConnectionStateType) => {
      console.log('Connection state changed:', state);
      this.callState.connectionState = state;
      this.callbacks.onConnectionStateChanged?.(state);
      this.notifyCallStateChanged();
    });
  }

  // Request permissions
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.MODIFY_AUDIO_SETTINGS,
        PermissionsAndroid.PERMISSIONS.ACCESS_NETWORK_STATE,
        PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
      ];

      console.log('🔐 Requesting Android permissions...');
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      console.log('📋 Permission results:', granted);
      
      const allGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        console.log('❌ Not all permissions granted');
        Alert.alert(
          'Permissions Required',
          'Camera and microphone permissions are required for video calls. Please enable them in Settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Settings', onPress: () => {
              // You can add logic to open app settings here
            }}
          ]
        );
        return false;
      }
      
      console.log('✅ All permissions granted');
    }
    return true;
  }

  // Join a channel
  async joinChannel(config: AgoraCallConfig): Promise<boolean> {
    try {
      console.log('🔗 Attempting to join channel:', config.channelName);
      console.log('📋 Channel config:', {
        channelName: config.channelName,
        uid: config.uid,
        isHost: config.isHost,
        hasToken: !!config.token
      });

      if (!this.engine) {
        throw new Error('Engine not initialized');
      }

      // Request permissions first
      console.log('🔐 Requesting permissions...');
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.log('❌ Permissions denied');
        return false;
      }
      console.log('✅ Permissions granted');

      // Set client role
      const role = config.isHost ? ClientRole.Broadcaster : ClientRole.Audience;
      console.log('👤 Setting client role:', role === ClientRole.Broadcaster ? 'Broadcaster' : 'Audience');
      await this.engine.setClientRole(role);

      // Enable local video and audio before joining
      if (config.isHost) {
        await this.engine.enableLocalVideo(true);
        await this.engine.enableLocalAudio(true);
        console.log('✅ Local video and audio enabled for host');
      }

      // Join channel
      console.log('🚪 Joining channel...');
      const result = await this.engine.joinChannel(
        config.token || null,
        config.channelName,
        config.uid,
        {
          clientRoleType: role,
        }
      );

      console.log('📊 Join channel result:', result);

      if (result === 0) {
        this.callState.isJoined = true;
        this.callState.isMuted = false;
        this.callState.isVideoEnabled = true;
        this.notifyCallStateChanged();
        console.log('🎉 Successfully joined channel:', config.channelName);
        return true;
      } else {
        const errorMessage = this.getErrorMessage(result);
        throw new Error(`Failed to join channel. Error code: ${result} - ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Failed to join channel:', error);
      this.callbacks.onError?.(`Failed to join call: ${error}`);
      return false;
    }
  }

  // Leave channel
  async leaveChannel(): Promise<boolean> {
    try {
      if (!this.engine || !this.callState.isJoined) {
        return true;
      }

      const result = await this.engine.leaveChannel();
      
      if (result === 0) {
        this.callState.isJoined = false;
        this.callState.remoteUsers = [];
        this.notifyCallStateChanged();
        console.log('Successfully left channel');
        return true;
      } else {
        throw new Error(`Failed to leave channel. Error code: ${result}`);
      }
    } catch (error) {
      console.error('Failed to leave channel:', error);
      this.callbacks.onError?.(`Failed to leave call: ${error}`);
      return false;
    }
  }

  // Get error message from error code
  private getErrorMessage(errorCode: number): string {
    switch (errorCode) {
      case 0: return 'No error';
      case 1: return 'General error';
      case 2: return 'Invalid App ID';
      case 3: return 'Invalid channel name';
      case 4: return 'Invalid token';
      case 5: return 'Token expired';
      case 6: return 'Invalid user ID';
      case 7: return 'User not authorized';
      case 8: return 'Network error';
      case 9: return 'Initialization error';
      case 10: return 'Permission denied';
      default: return `Unknown error (${errorCode})`;
    }
  }

  // Toggle mute
  async toggleMute(): Promise<boolean> {
    try {
      if (!this.engine || !this.callState.isJoined) {
        console.log('❌ Cannot toggle mute: engine not ready or not joined');
        return false;
      }

      const newMuteState = !this.callState.isMuted;
      console.log(`🎤 ${newMuteState ? 'Muting' : 'Unmuting'} audio...`);
      
      const result = await this.engine.muteLocalAudio(newMuteState);
      
      if (result === 0) {
        this.callState.isMuted = newMuteState;
        this.notifyCallStateChanged();
        console.log(`✅ Audio ${newMuteState ? 'muted' : 'unmuted'} successfully`);
        return true;
      } else {
        const errorMessage = this.getErrorMessage(result);
        throw new Error(`Failed to toggle mute. Error code: ${result} - ${errorMessage}`);
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      return false;
    }
  }

  // Toggle video
  async toggleVideo(): Promise<boolean> {
    try {
      if (!this.engine || !this.callState.isJoined) {
        console.log('❌ Cannot toggle video: engine not ready or not joined');
        return false;
      }

      const newVideoState = !this.callState.isVideoEnabled;
      console.log(`📹 ${newVideoState ? 'Enabling' : 'Disabling'} video...`);
      
      const result = await this.engine.muteLocalVideo(!newVideoState);
      
      if (result === 0) {
        this.callState.isVideoEnabled = newVideoState;
        this.notifyCallStateChanged();
        console.log(`✅ Video ${newVideoState ? 'enabled' : 'disabled'} successfully`);
        return true;
      } else {
        const errorMessage = this.getErrorMessage(result);
        throw new Error(`Failed to toggle video. Error code: ${result} - ${errorMessage}`);
      }
    } catch (error) {
      console.error('Failed to toggle video:', error);
      return false;
    }
  }

  // Switch camera
  async switchCamera(): Promise<boolean> {
    try {
      if (!this.engine || !this.callState.isJoined) {
        console.log('❌ Cannot switch camera: engine not ready or not joined');
        return false;
      }

      console.log('🔄 Switching camera...');
      const result = await this.engine.switchCamera();
      
      if (result === 0) {
        console.log('✅ Camera switched successfully');
        return true;
      } else {
        const errorMessage = this.getErrorMessage(result);
        console.error(`❌ Failed to switch camera. Error code: ${result} - ${errorMessage}`);
        return false;
      }
    } catch (error) {
      console.error('Failed to switch camera:', error);
      return false;
    }
  }

  // Get call state
  getCallState(): AgoraCallState {
    return {...this.callState};
  }

  // Set callbacks
  setCallbacks(callbacks: Partial<typeof this.callbacks>) {
    this.callbacks = {...this.callbacks, ...callbacks};
  }

  // Notify call state changed
  private notifyCallStateChanged() {
    this.callbacks.onCallStateChanged?.(this.getCallState());
  }

  // Cleanup
  async destroy(): Promise<void> {
    try {
      if (this.engine) {
        await this.engine.destroy();
        this.engine = null;
      }
      this.callState = {
        isJoined: false,
        isMuted: false,
        isVideoEnabled: true,
        isSpeakerEnabled: false,
        connectionState: ConnectionStateType.Disconnected,
        remoteUsers: [],
      };
    } catch (error) {
      console.error('Failed to destroy Agora engine:', error);
    }
  }
}

// Export singleton instance
export const agoraService = new AgoraService();
export default agoraService;
