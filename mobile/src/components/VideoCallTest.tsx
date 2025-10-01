import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import agoraService from '../services/agoraService';

const VideoCallTest: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testAgoraInitialization();
  }, []);

  const testAgoraInitialization = async () => {
    try {
      console.log('🧪 Testing Agora initialization...');
      setError(null);
      const initialized = await agoraService.initialize();
      setIsInitialized(initialized);
      
      if (initialized) {
        console.log('✅ Agora initialized successfully');
        Alert.alert('Success', 'Agora engine initialized successfully!');
      } else {
        setError('Failed to initialize Agora engine. Please check your internet connection and permissions.');
      }
    } catch (error) {
      console.error('❌ Agora initialization error:', error);
      setError(`Initialization error: ${error.message || error}`);
    }
  };

  const testJoinChannel = async () => {
    try {
      console.log('🧪 Testing channel join...');
      setError(null);
      const joined = await agoraService.joinChannel({
        channelName: 'test-channel',
        uid: Math.floor(Math.random() * 100000),
        isHost: true,
      });
      
      setIsJoined(joined);
      
      if (joined) {
        console.log('✅ Successfully joined test channel');
        Alert.alert('Success', 'Successfully joined test channel! You can now test video and audio controls.');
      } else {
        setError('Failed to join channel. Please check your internet connection and permissions.');
      }
    } catch (error) {
      console.error('❌ Channel join error:', error);
      setError(`Join error: ${error.message || error}`);
    }
  };

  const testLeaveChannel = async () => {
    try {
      const left = await agoraService.leaveChannel();
      setIsJoined(!left);
      console.log('✅ Left channel');
    } catch (error) {
      console.error('❌ Leave channel error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Call Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Initialized: {isInitialized ? '✅' : '❌'}
        </Text>
        <Text style={styles.statusText}>
          Joined: {isJoined ? '✅' : '❌'}
        </Text>
        {error && (
          <Text style={styles.errorText}>Error: {error}</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, !isInitialized && styles.buttonDisabled]}
          onPress={testAgoraInitialization}
          disabled={isInitialized}
        >
          <Text style={styles.buttonText}>Initialize Agora</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !isInitialized && styles.buttonDisabled]}
          onPress={testJoinChannel}
          disabled={!isInitialized || isJoined}
        >
          <Text style={styles.buttonText}>Join Test Channel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !isJoined && styles.buttonDisabled]}
          onPress={testLeaveChannel}
          disabled={!isJoined}
        >
          <Text style={styles.buttonText}>Leave Channel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    marginTop: 10,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#1976D2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VideoCallTest;
