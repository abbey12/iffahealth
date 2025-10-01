// Agora Video SDK Configuration
export const AGORA_CONFIG = {
  // Replace with your actual Agora App ID
  APP_ID: 'ae1121fddf60428c90b4533d20b00557', // Your Agora App ID
  
  // Token server URL (you'll need to implement this on your backend)
  TOKEN_SERVER_URL: 'https://your-backend.com/api/agora/token',
  
  // Default channel settings
  DEFAULT_CHANNEL_PROFILE: 'communication', // 'communication' or 'live'
  DEFAULT_CLIENT_ROLE: 'audience', // 'broadcaster' or 'audience'
  
  // Video settings
  VIDEO_DIMENSIONS: {
    width: 640,
    height: 480,
  },
  
  // Audio settings
  AUDIO_PROFILE: 'music_standard', // 'speech_standard' or 'music_standard'
  AUDIO_SCENARIO: 'meeting', // 'meeting', 'education', 'game_streaming', etc.
  
  // Call timeout settings
  CALL_TIMEOUT: 30000, // 30 seconds
  JOIN_TIMEOUT: 10000, // 10 seconds
};

// Agora error codes
export const AGORA_ERROR_CODES = {
  NO_ERROR: 0,
  GENERAL_ERROR: 1,
  INVALID_APP_ID: 2,
  INVALID_CHANNEL_NAME: 3,
  INVALID_TOKEN: 4,
  TOKEN_EXPIRED: 5,
  INVALID_USER_ID: 6,
  USER_NOT_AUTHORIZED: 7,
  NETWORK_ERROR: 8,
  INITIALIZATION_ERROR: 9,
  PERMISSION_DENIED: 10,
};

// Agora event types
export const AGORA_EVENTS = {
  USER_JOINED: 'UserJoined',
  USER_OFFLINE: 'UserOffline',
  USER_MUTED_AUDIO: 'UserMutedAudio',
  USER_MUTED_VIDEO: 'UserMutedVideo',
  USER_ENABLED_AUDIO: 'UserEnabledAudio',
  USER_ENABLED_VIDEO: 'UserEnabledVideo',
  ERROR: 'Error',
  WARNING: 'Warning',
  CONNECTION_STATE_CHANGED: 'ConnectionStateChanged',
  TOKEN_PRIVILEGE_WILL_EXPIRE: 'TokenPrivilegeWillExpire',
};
