# Secure API Key Configuration

## 🔐 Security Best Practices

### 1. Never Share API Keys
- ❌ Don't share API keys in chat conversations
- ❌ Don't commit API keys to version control
- ❌ Don't hardcode API keys in production code

### 2. Safe Configuration Methods

#### Method 1: Direct File Edit (Development)
1. Open `mobile/src/config/api.ts`
2. Replace `YOUR_DEEPSEEK_API_KEY` with your actual key
3. Keep the file local and don't commit it

#### Method 2: Environment Variables (Production)
Create a `.env` file in the mobile directory:
```bash
# .env file
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
```

Then update the config to use environment variables:
```typescript
// In mobile/src/config/api.ts
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'YOUR_DEEPSEEK_API_KEY';
```

#### Method 3: Secure Storage (Mobile App)
For mobile apps, use secure storage:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const getApiKey = async () => {
  try {
    const key = await AsyncStorage.getItem('DEEPSEEK_API_KEY');
    return key || 'YOUR_DEEPSEEK_API_KEY';
  } catch (error) {
    return 'YOUR_DEEPSEEK_API_KEY';
  }
};
```

### 3. File Protection
Add to `.gitignore`:
```
# API Keys
.env
*.env
mobile/src/config/api.ts
```

### 4. Testing Your Setup
1. Update the API key in `mobile/src/config/api.ts`
2. Run the app: `npx react-native run-ios`
3. Check the AI Assistant screen for the green status indicator
4. Send a test message to verify API responses

## 🚨 Security Checklist
- [ ] API key is not in version control
- [ ] API key is not shared in conversations
- [ ] Environment variables are used in production
- [ ] `.env` files are in `.gitignore`
- [ ] API key has appropriate permissions
- [ ] Regular key rotation is planned

## 🔧 Quick Setup
1. Get your DeepSeek API key from [platform.deepseek.com](https://platform.deepseek.com)
2. Open `mobile/src/config/api.ts`
3. Replace `YOUR_DEEPSEEK_API_KEY` with your key
4. Test the integration
5. Add the config file to `.gitignore`
