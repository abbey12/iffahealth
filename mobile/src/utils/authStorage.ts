import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = 'iffahealth_auth_state';

export interface AuthState {
  isAuthenticated: boolean;
  userRole: 'patient' | 'doctor' | null;
  userId?: string;
  userEmail?: string;
  loginTime?: number;
  token?: string;
  userData?: any;
}

export const saveAuthState = async (authState: AuthState): Promise<void> => {
  try {
    const serializedState = JSON.stringify(authState);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, serializedState);
    // Auth state saved successfully
    
    // Verify the save worked
    const verification = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (verification) {
      // Auth state verification successful
    } else {
      console.error('❌ Auth state verification failed');
    }
  } catch (error) {
    console.error('❌ Error saving auth state:', error);
    throw error; // Re-throw to handle in calling code
  }
};

export const getAuthState = async (): Promise<AuthState | null> => {
  try {
    const storedAuth = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      const authState = JSON.parse(storedAuth);
      // Auth state retrieved successfully
      return authState;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving auth state:', error);
    return null;
  }
};

export const clearAuthState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    // Auth state cleared successfully
  } catch (error) {
    console.error('❌ Error clearing auth state:', error);
  }
};

// Test function to verify AsyncStorage is working
export const testAsyncStorage = async (): Promise<boolean> => {
  try {
    const testKey = 'test_key';
    const testValue = 'test_value';
    
    await AsyncStorage.setItem(testKey, testValue);
    const retrieved = await AsyncStorage.getItem(testKey);
    await AsyncStorage.removeItem(testKey);
    
    const success = retrieved === testValue;
    // AsyncStorage test completed
    return success;
  } catch (error) {
    console.error('❌ AsyncStorage test failed:', error);
    return false;
  }
};

export const isAuthStateValid = (authState: AuthState): boolean => {
  console.log('🔍 Validating auth state:', {
    isAuthenticated: authState.isAuthenticated,
    userRole: authState.userRole,
    hasToken: !!authState.token,
    hasUserData: !!authState.userData
  });

  // Check if auth state is valid (not expired, has required fields)
  if (!authState.isAuthenticated || !authState.userRole || !authState.token) {
    console.log('❌ Auth state missing required fields');
    return false;
  }

  // Check token expiration
  try {
    const token = authState.token;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log('🔍 Token validation:', {
      currentTime,
      expTime: payload.exp,
      timeUntilExpiry: payload.exp - currentTime,
      hoursUntilExpiry: (payload.exp - currentTime) / 3600
    });
    
    // Check if token is expired
    if (payload.exp && payload.exp < currentTime) {
      console.log('🔐 Token is expired');
      return false;
    }
    
    // Check if token is valid for at least 1 more hour (to avoid frequent re-authentication)
    if (payload.exp && payload.exp < currentTime + 3600) {
      console.log('⚠️ Token expires soon, but still valid');
    }
    
    console.log('✅ Token is valid');
    return true;
  } catch (error) {
    console.error('❌ Error validating token:', error);
    return false;
  }
};
