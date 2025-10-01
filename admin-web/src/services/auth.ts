import api from './api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AdminUser;
    token: string;
  };
}

export const authService = {
  // Login admin user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/admin/auth/login', credentials);
    return response.data;
  },

  // Logout admin user
  async logout(): Promise<void> {
    await api.post('/admin/auth/logout');
    localStorage.removeItem('adminToken');
  },

  // Get current admin user
  async getCurrentUser(): Promise<AdminUser> {
    const response = await api.get('/admin/auth/me');
    return response.data.data;
  },

  // Refresh token
  async refreshToken(): Promise<{ token: string }> {
    const response = await api.post('/admin/auth/refresh');
    return response.data.data;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('adminToken');
    return !!token;
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('adminToken');
  },

  // Store token
  setToken(token: string): void {
    localStorage.setItem('adminToken', token);
  },

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem('adminToken');
  }
};
