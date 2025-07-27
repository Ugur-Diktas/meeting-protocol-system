import { defineStore } from 'pinia';
import { authService } from '@/services/auth';
import router from '@/router';
import { useToast } from '@/composables/useToast';
import { useI18n } from 'vue-i18n';
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
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isLoading: false
  }),

  getters: {
    currentUser: (state): User | null => state.user,
    isLoggedIn: (state): boolean => state.isAuthenticated,
    hasGroup: (state): boolean => !!state.user?.group_id,
    userRole: (state): string => state.user?.role || 'member'
  },

  actions: {
    async register(userData: RegisterData) {
      const toast = useToast();
      const { t } = useI18n();
      this.isLoading = true;

      try {
        const response = await authService.register(userData);

        this.token = response.token;
        this.user = response.user;
        this.isAuthenticated = true;

        // Save token to localStorage
        localStorage.setItem('token', response.token);

        toast.success(t('common.register'), 'Account created successfully!');

        // Redirect to dashboard
        router.push('/dashboard');

        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Registration failed';
        toast.error('Registration Error', errorMessage);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async login(credentials: LoginCredentials) {
      const toast = useToast();
      const { t } = useI18n();
      this.isLoading = true;

      try {
        const response = await authService.login(credentials);

        this.token = response.token;
        this.user = response.user;
        this.isAuthenticated = true;

        // Save token to localStorage
        localStorage.setItem('token', response.token);

        toast.success(t('common.login'), 'Welcome back!');

        // Redirect to dashboard
        router.push('/dashboard');

        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Login failed';
        const errorDetails = error.response?.data?.details;
        toast.error('Login Error', errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
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
      const toast = useToast();
      this.isLoading = true;

      try {
        const response = await authService.updateProfile(profileData);
        this.user = response.user;
        toast.success('Profile Updated', 'Your profile has been updated successfully.');
        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Update failed';
        toast.error('Update Error', errorMessage);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async changePassword(passwordData: ChangePasswordData) {
      const toast = useToast();
      this.isLoading = true;

      try {
        const response = await authService.changePassword(passwordData);
        toast.success('Password Changed', 'Your password has been changed successfully.');
        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Password change failed';
        toast.error('Password Error', errorMessage);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      const toast = useToast();
      const { t } = useI18n();

      try {
        await authService.logout();
      } catch (error) {
        // Ignore logout errors
      } finally {
        // Clear auth state
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;

        // Clear localStorage
        localStorage.removeItem('token');

        toast.info(t('common.logout'), 'You have been logged out.');

        // Redirect to login
        router.push('/login');
      }
    }
  }
});
