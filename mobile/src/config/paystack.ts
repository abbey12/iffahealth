// Paystack Configuration for IFFA Health
export const PAYSTACK_CONFIG = {
  // Test keys
  PUBLIC_KEY: 'pk_test_a1fc280d795b18ec563fe27ee4be6aa8ff35904b',
  SECRET_KEY: 'sk_test_734f5b2915b36b350fdc4efd12d3214097a7a79f',
  
  // Production keys (replace with your actual keys)
  PRODUCTION_PUBLIC_KEY: 'pk_live_your_public_key_here',
  PRODUCTION_SECRET_KEY: 'sk_live_your_secret_key_here',
  
  // Environment
  ENVIRONMENT: __DEV__ ? 'test' : 'live',
  
  // Currency
  CURRENCY: 'GHS', // Ghana Cedi
  
  // Base URL
  BASE_URL: 'https://api.paystack.co',
  
  // Webhook URL (for production)
  WEBHOOK_URL: 'https://api.iffahealth.com/webhooks/paystack',
  
  // Callback URL (for mobile app)
  CALLBACK_URL: 'iffahealth://payment-callback',
  
  // Payment methods
  PAYMENT_METHODS: {
    CARD: 'card',
    BANK_TRANSFER: 'bank_transfer',
    MOBILE_MONEY: 'mobile_money',
  },
  
  // Transaction status
  TRANSACTION_STATUS: {
    SUCCESS: 'success',
    FAILED: 'failed',
    PENDING: 'pending',
    CANCELLED: 'cancelled',
  },
  
  // Error codes
  ERROR_CODES: {
    INVALID_KEY: 'invalid_key',
    INVALID_AMOUNT: 'invalid_amount',
    INVALID_EMAIL: 'invalid_email',
    INSUFFICIENT_FUNDS: 'insufficient_funds',
    CARD_DECLINED: 'card_declined',
    NETWORK_ERROR: 'network_error',
  },
};

// Get the appropriate public key based on environment
export const getPublicKey = (): string => {
  return PAYSTACK_CONFIG.ENVIRONMENT === 'test' 
    ? PAYSTACK_CONFIG.PUBLIC_KEY 
    : PAYSTACK_CONFIG.PRODUCTION_PUBLIC_KEY;
};

// Get the appropriate secret key based on environment
export const getSecretKey = (): string => {
  return PAYSTACK_CONFIG.ENVIRONMENT === 'test' 
    ? PAYSTACK_CONFIG.SECRET_KEY 
    : PAYSTACK_CONFIG.PRODUCTION_SECRET_KEY;
};

// Format amount for Paystack (convert to kobo)
export const formatAmountForPaystack = (amount: number): number => {
  return Math.round(amount * 100); // Convert to kobo (smallest currency unit)
};

// Format amount for display (convert from kobo)
export const formatAmountFromPaystack = (amount: number): number => {
  return amount / 100; // Convert from kobo
};

// Validate email for Paystack
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate amount for Paystack
export const validateAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000; // Max 1,000,000 GHS
};

// Generate transaction reference
export const generateTransactionReference = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `IFFA_${timestamp}_${random}`.toUpperCase();
};

// Payment URLs
export const PAYSTACK_URLS = {
  INITIALIZE: `${PAYSTACK_CONFIG.BASE_URL}/transaction/initialize`,
  VERIFY: `${PAYSTACK_CONFIG.BASE_URL}/transaction/verify`,
  REFUND: `${PAYSTACK_CONFIG.BASE_URL}/refund`,
  BANK_LIST: `${PAYSTACK_CONFIG.BASE_URL}/bank`,
  RESOLVE_ACCOUNT: `${PAYSTACK_CONFIG.BASE_URL}/bank/resolve`,
};

export default PAYSTACK_CONFIG;
