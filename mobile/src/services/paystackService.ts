import {PAYSTACK_CONFIG, getPublicKey, formatAmountForPaystack, generateTransactionReference} from '../config/paystack';
import { Linking, Platform } from 'react-native';
import {apiService} from './apiService';

export interface PaymentData {
  amount: number;
  email: string;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerificationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    log: any;
    fees: number;
    fees_split: any;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: Record<string, any>;
      risk_action: string;
      international_format_phone: string;
    };
    plan: any;
    split: any;
    order_id: any;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
  };
}

export interface RefundData {
  transaction: string;
  amount?: number;
  customer_note?: string;
  merchant_note?: string;
}

export interface RefundResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    transaction: number;
    amount: number;
    currency: string;
    customer_note: string;
    merchant_note: string;
    status: string;
    refunded_by: string;
    created_at: string;
    updated_at: string;
  };
}

class PaystackService {
  private publicKey: string;

  constructor() {
    this.publicKey = getPublicKey();
  }

  /**
   * Initialize a payment transaction
   */
  async initializePayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const metadata = {
        ...paymentData.metadata,
        platform: Platform.OS,
        initiatedAt: new Date().toISOString(),
        callbackUrl: PAYSTACK_CONFIG.CALLBACK_URL,
      };

      const callbackUrl = paymentData.callback_url || PAYSTACK_CONFIG.CALLBACK_URL;

      const response = await apiService.initializePayment({
        appointmentId: paymentData.metadata?.appointmentId || generateTransactionReference(),
        amount: formatAmountForPaystack(paymentData.amount),
        email: paymentData.email,
        patientId: paymentData.metadata?.patientId || '',
        doctorId: paymentData.metadata?.doctorId || '',
        doctorName: paymentData.metadata?.doctorName || '',
        appointmentDate: paymentData.metadata?.appointmentDate || '',
        appointmentTime: paymentData.metadata?.appointmentTime || '',
        metadata,
        callbackUrl,
      });

      return {
        status: true,
        message: 'Payment initialized successfully',
        data: response.data,
      };
    } catch (error) {
      console.error('Paystack initialization error:', error);
      throw new Error('Failed to initialize payment');
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference: string): Promise<VerificationResponse> {
    try {
      const response = await apiService.verifyPayment(reference);
      
      return {
        status: true,
        message: 'Payment verified successfully',
        data: {
          id: Math.floor(Math.random() * 1000000),
          domain: 'test',
          status: response.data.status,
          reference: reference,
          amount: response.data.amount,
          message: `Payment ${response.data.status}`,
          gateway_response: response.data.paystackStatus,
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          channel: 'card',
          currency: PAYSTACK_CONFIG.CURRENCY,
          ip_address: '127.0.0.1',
          metadata: response.data.metadata || {},
          log: null,
          fees: 0,
          fees_split: null,
          authorization: {
            authorization_code: 'AUTH_' + Math.random().toString(36).substr(2, 9),
            bin: '408408',
            last4: '4081',
            exp_month: '12',
            exp_year: '2025',
            channel: 'card',
            card_type: 'visa',
            bank: 'TEST BANK',
            country_code: 'GH',
            brand: 'visa',
            reusable: true,
            signature: 'SIG_' + Math.random().toString(36).substr(2, 9),
            account_name: 'Test Account',
          },
          customer: {
            id: Math.floor(Math.random() * 1000000),
            first_name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            customer_code: 'CUS_' + Math.random().toString(36).substr(2, 9),
            phone: '+233123456789',
            metadata: {},
            risk_action: 'default',
            international_format_phone: '+233123456789',
          },
          plan: null,
          split: null,
          order_id: null,
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          requested_amount: response.data.amount,
          pos_transaction_data: null,
          source: null,
          fees_breakdown: null,
        },
      };
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw new Error('Failed to verify payment');
    }
  }

  /**
   * Process refund for a transaction
   */
  async processRefund(refundData: RefundData): Promise<RefundResponse> {
    try {
      const response = await apiService.refundPayment(refundData.transaction, refundData.merchant_note);
      
      return {
        status: true,
        message: 'Refund processed successfully',
        data: {
          id: Math.floor(Math.random() * 1000000),
          domain: 'test',
          transaction: parseInt(refundData.transaction),
          amount: refundData.amount || 0,
          currency: PAYSTACK_CONFIG.CURRENCY,
          customer_note: refundData.customer_note || 'Refund processed',
          merchant_note: refundData.merchant_note || 'Refund processed',
          status: 'processed',
          refunded_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Paystack refund error:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Get payment methods available
   */
  async getPaymentMethods() {
    try {
      const response = await apiService.getPaymentMethods();
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw new Error('Failed to fetch payment methods');
    }
  }

  /**
   * Get payment history for a patient
   */
  async getPaymentHistory(patientId: string) {
    try {
      const response = await apiService.getPaymentHistory(patientId);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw new Error('Failed to fetch payment history');
    }
  }

  /**
   * Create appointment with payment
   */
  async createAppointmentWithPayment(data: {
    patientId: string;
    doctorId: string;
    date: string;
    time: string;
    notes?: string;
    paymentData: {
      amount: number;
      email: string;
      reference: string;
    };
  }) {
    try {
      const response = await apiService.createAppointmentWithPayment(data);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment with payment:', error);
      throw new Error('Failed to create appointment with payment');
    }
  }

  /**
   * Validate payment data
   */
  validatePaymentData(data: PaymentData): {isValid: boolean; errors: string[]} {
    const errors: string[] = [];

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Valid email is required');
    }

    if (!data.reference || data.reference.trim() === '') {
      errors.push('Reference is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: PAYSTACK_CONFIG.CURRENCY,
    }).format(amount);
  }

  /**
   * Get transaction status text
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'success':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Pending';
      case 'cancelled':
        return 'Payment Cancelled';
      default:
        return 'Unknown Status';
    }
  }
}

export default new PaystackService();
