<template>
  <div class="min-h-screen flex">
    <!-- Left side - Form -->
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
      <div class="max-w-md w-full space-y-8">
        <div>
          <router-link to="/" class="flex items-center justify-center space-x-3 mb-8">
            <div class="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span class="text-xl font-bold text-gray-900">{{ $t('common.appName') }}</span>
          </router-link>

          <h2 class="text-center text-3xl font-extrabold text-gray-900">
            {{ $t('auth.login.subtitle') }}
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            {{ $t('auth.login.noAccount') }}
            <router-link to="/register" class="font-medium text-brand-red hover:text-brand-red-dark ml-1">
              {{ $t('auth.login.createAccount') }}
            </router-link>
          </p>
        </div>

        <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
          <div v-if="error" class="rounded-lg bg-red-50 p-4 border border-red-200">
            <p class="text-sm text-red-800">{{ error }}</p>
          </div>

          <div class="space-y-5">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                {{ $t('auth.login.email') }}
              </label>
              <input
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent sm:text-sm transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                {{ $t('auth.login.password') }}
              </label>
              <input
                id="password"
                v-model="form.password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent sm:text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-red hover:bg-brand-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-[1.02]"
            >
              <span v-if="isLoading">{{ $t('common.loading') }}</span>
              <span v-else>{{ $t('auth.login.submit') }}</span>
            </button>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm">
              <a href="#" class="font-medium text-brand-red hover:text-brand-red-dark">
                {{ $t('auth.login.forgotPassword') }}
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Right side - Branding -->
    <div class="hidden lg:block relative w-0 flex-1 bg-brand-red">
      <div class="absolute inset-0 bg-gradient-to-br from-brand-red to-brand-red-dark"></div>
      <div class="absolute inset-0 flex items-center justify-center p-12">
        <div class="max-w-md text-center">
          <h3 class="text-4xl font-bold text-white mb-6">{{ $t('common.appName') }}</h3>
          <p class="text-xl text-white opacity-90">
            {{ $t('home.subtitle') }}
          </p>
        </div>
      </div>
      <!-- Pattern overlay -->
      <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="white" opacity="0.1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pattern)" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import type { LoginCredentials } from '@/types/auth';

const authStore = useAuthStore();
const { error, isLoading } = storeToRefs(authStore);

const form = ref<LoginCredentials>({
  email: '',
  password: ''
});

const handleLogin = async () => {
  try {
    await authStore.login(form.value);
  } catch (error) {
    // Error is handled in the store
  }
};
</script>
