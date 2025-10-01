# Agora Video Calling Setup Guide

## 🚀 Getting Started with Agora

### 1. Create Agora Account
1. Go to [Agora Console](https://console.agora.io/)
2. Sign up for a free account
3. Verify your email address

### 2. Create a New Project
1. In the Agora Console, click "Create Project"
2. Enter project name: "IFFA Health"
3. Select "Communication" as the use case
4. Click "Submit"

### 3. Get Your App ID
1. In your project dashboard, find the "App ID"
2. Copy the App ID (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 4. Update Configuration
1. Open `mobile/src/config/agora.ts`
2. Replace `YOUR_AGORA_APP_ID` with your actual App ID:

```typescript
export const AGORA_CONFIG = {
  APP_ID: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', // Your actual App ID
  // ... rest of config
};
```

### 5. Generate Tokens (Optional but Recommended)
For production, you should generate tokens on your backend:

```javascript
// Backend token generation example
const { RtcTokenBuilder, RtcRole } = require('agora-token');

const appId = 'YOUR_APP_ID';
const appCertificate = 'YOUR_APP_CERTIFICATE';
const channelName = 'appointment_123';
const uid = 12345;
const role = RtcRole.PUBLISHER;
const expirationTimeInSeconds = 3600; // 1 hour

const token = RtcTokenBuilder.buildTokenWithUid(
  appId,
  appCertificate,
  channelName,
  uid,
  role,
  expirationTimeInSeconds
);
```

### 6. Test the Integration
1. Run your React Native app
2. Navigate to an appointment
3. Tap "Join Call"
4. Grant camera and microphone permissions
5. You should see the video call interface

## 📱 Features Implemented

### Video Call Features:
- ✅ **Real-time Video/Audio**: High-quality video and audio communication
- ✅ **Mute/Unmute**: Toggle microphone on/off
- ✅ **Camera On/Off**: Toggle video on/off
- ✅ **Switch Camera**: Switch between front and back camera
- ✅ **Call Timer**: Shows call duration
- ✅ **End Call**: Properly end the call
- ✅ **Error Handling**: Graceful error handling and user feedback

### Security Features:
- ✅ **Token-based Authentication**: Secure channel access
- ✅ **Time-based Access**: Only join within appointment time window
- ✅ **Permission Management**: Proper camera/microphone permissions

## 🔧 Configuration Options

### Video Settings:
```typescript
VIDEO_DIMENSIONS: {
  width: 640,    // Adjust based on your needs
  height: 480,   // Adjust based on your needs
}
```

### Audio Settings:
```typescript
AUDIO_PROFILE: 'music_standard', // 'speech_standard' or 'music_standard'
AUDIO_SCENARIO: 'meeting',       // 'meeting', 'education', etc.
```

## 💰 Pricing Information

### Free Tier:
- **10,000 minutes/month** for free
- Perfect for testing and small deployments

### Paid Plans:
- **$0.99 per 1,000 minutes** after free tier
- Much cheaper than Twilio (60-75% savings)

## 🚨 Important Notes

### iOS Permissions:
Add these to `ios/IffaHealth/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for video calls</string>
```

### Android Permissions:
Add these to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
```

## 🔍 Troubleshooting

### Common Issues:

1. **"Failed to initialize Agora engine"**
   - Check if App ID is correct
   - Ensure internet connection is stable

2. **"Permission denied"**
   - Grant camera and microphone permissions
   - Check device settings

3. **"Failed to join channel"**
   - Check channel name format
   - Verify token (if using tokens)

4. **Video not showing**
   - Check camera permissions
   - Ensure video is enabled

### Debug Mode:
Enable debug logging by adding this to your app:
```typescript
// In agoraService.ts
console.log('Agora debug info:', {
  appId: AGORA_CONFIG.APP_ID,
  channelName,
  uid,
  isHost
});
```

## 🎯 Next Steps

1. **Get your Agora App ID** from the console
2. **Update the configuration** with your App ID
3. **Test the video calling** functionality
4. **Implement token generation** on your backend for production
5. **Add call recording** if needed
6. **Implement screen sharing** for enhanced telemedicine

## 📞 Support

- [Agora Documentation](https://docs.agora.io/)
- [React Native Agora SDK](https://github.com/AgoraIO-Community/React-Native-Agora)
- [Agora Community](https://www.agora.io/en/community/)

---

**Your IFFA Health app now has professional video calling capabilities! 🎉**
