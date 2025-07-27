import api from './api';
import type {
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  ChangePasswordData,
  AuthResponse,
  User
} from '@/types/auth';

export const authService = {
  // Register new user
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', userData);
    return response.data;
  },

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  // Get current user
  async getMe(): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>('/api/auth/me');
    return response.data;
  },

  // Update user profile
  async updateProfile(profileData: UpdateProfileData): Promise<AuthResponse> {
    const response = await api.put<AuthResponse>('/api/auth/profile', profileData);
    return response.data;
  },

  // Change password
  async changePassword(passwordData: ChangePasswordData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/change-password', passwordData);
    return response.data;
  },

  // Logout
  async logout(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/logout');
    return response.data;
  }
};
