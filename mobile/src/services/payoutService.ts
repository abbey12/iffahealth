import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface PayoutRequest {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  method: {
    provider: string;
    number: string;
  };
  reference: string;
  failureReason?: string;
  estimatedCompletion?: string;
}

export interface PayoutMethod {
  id: string;
  type: 'mobile_money';
  provider: 'MTN' | 'Airtel' | 'Vodafone';
  number: string;
  isDefault: boolean;
}

export interface CreatePayoutRequest {
  amount: number;
  methodId: string;
}

export interface PayoutStatusUpdate {
  requestId: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  processedAt?: string;
  completedAt?: string;
  failureReason?: string;
  estimatedCompletion?: string;
}

class PayoutService {
  // Get all payout requests for a doctor
  async getPayoutRequests(doctorId: string): Promise<PayoutRequest[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/payouts/requests/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payout requests:', error);
      throw error;
    }
  }

  // Create a new payout request
  async createPayoutRequest(doctorId: string, request: CreatePayoutRequest): Promise<PayoutRequest> {
    try {
      const response = await axios.post(`${API_BASE_URL}/payouts/requests`, {
        doctorId,
        ...request,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payout request:', error);
      throw error;
    }
  }

  // Cancel a payout request
  async cancelPayoutRequest(requestId: string): Promise<void> {
    try {
      await axios.patch(`${API_BASE_URL}/payouts/requests/${requestId}/cancel`);
    } catch (error) {
      console.error('Error cancelling payout request:', error);
      throw error;
    }
  }

  // Retry a failed payout request
  async retryPayoutRequest(requestId: string): Promise<PayoutRequest> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/payouts/requests/${requestId}/retry`);
      return response.data;
    } catch (error) {
      console.error('Error retrying payout request:', error);
      throw error;
    }
  }

  // Get payout methods for a doctor
  async getPayoutMethods(doctorId: string): Promise<PayoutMethod[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/payouts/methods/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payout methods:', error);
      throw error;
    }
  }

  // Add a new payout method
  async addPayoutMethod(doctorId: string, method: Omit<PayoutMethod, 'id'>): Promise<PayoutMethod> {
    try {
      const response = await axios.post(`${API_BASE_URL}/payouts/methods`, {
        doctorId,
        ...method,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding payout method:', error);
      throw error;
    }
  }

  // Set default payout method
  async setDefaultPayoutMethod(doctorId: string, methodId: string): Promise<void> {
    try {
      await axios.patch(`${API_BASE_URL}/payouts/methods/${methodId}/default`, {
        doctorId,
      });
    } catch (error) {
      console.error('Error setting default payout method:', error);
      throw error;
    }
  }

  // Delete payout method
  async deletePayoutMethod(methodId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/payouts/methods/${methodId}`);
    } catch (error) {
      console.error('Error deleting payout method:', error);
      throw error;
    }
  }

  // Webhook endpoint for mobile money provider status updates
  async updatePayoutStatus(update: PayoutStatusUpdate): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/payouts/webhook/status`, update);
    } catch (error) {
      console.error('Error updating payout status:', error);
      throw error;
    }
  }

  // Get payout statistics
  async getPayoutStats(doctorId: string): Promise<{
    totalRequested: number;
    totalCompleted: number;
    totalFailed: number;
    pendingAmount: number;
    completedAmount: number;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/payouts/stats/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payout stats:', error);
      throw error;
    }
  }
}

export default new PayoutService();
