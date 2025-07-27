import { defineStore } from 'pinia';
import { authService } from '@/services/auth';
import router from '@/router';
import type {
  User,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  ChangePasswordData
} from '@/types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isLoading: false,
    error: null
  }),

  getters: {
    currentUser: (state): User | null => state.user,
    isLoggedIn: (state): boolean => state.isAuthenticated,
    hasGroup: (state): boolean => !!state.user?.group_id,
    userRole: (state): string => state.user?.role || 'member'
  },

  actions: {
    async register(userData: RegisterData) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await authService.register(userData);

        this.token = response.token;
        this.user = response.user;
        this.isAuthenticated = true;

        // Save token to localStorage
        localStorage.setItem('token', response.token);

        // Redirect to dashboard
        router.push('/dashboard');

        return response;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Registration failed';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async login(credentials: LoginCredentials) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await authService.login(credentials);

        this.token = response.token;
        this.user = response.user;
        this.isAuthenticated = true;

        // Save token to localStorage
        localStorage.setItem('token', response.token);

        // Redirect to dashboard
        router.push('/dashboard');

        return response;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Login failed';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchUser() {
      if (!this.token) {
        return;
      }

      try {
        const response = await authService.getMe();
        this.user = response.user;
        this.isAuthenticated = true;
      } catch (error) {
        // Token is invalid
        this.logout();
      }
    },

    async updateProfile(profileData: UpdateProfileData) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await authService.updateProfile(profileData);
        this.user = response.user;
        return response;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Update failed';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async changePassword(passwordData: ChangePasswordData) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await authService.changePassword(passwordData);
        return response;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Password change failed';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        await authService.logout();
      } catch (error) {
        // Ignore logout errors
      } finally {
        // Clear auth state
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        this.error = null;

        // Clear localStorage
        localStorage.removeItem('token');

        // Redirect to login
        router.push('/login');
      }
    },

    clearError() {
      this.error = null;
    }
  }
});
