<template>
  <div class="min-h-screen flex">
    <!-- Left side - Image/Pattern -->
    <div class="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-purple-600 to-indigo-500">
      <div class="absolute inset-0 bg-gradient-to-br from-purple-700/90 to-indigo-600/90"></div>
      <div class="absolute inset-0 flex items-center justify-center p-12">
        <div class="max-w-md text-center">
          <h3 class="text-4xl font-bold text-white mb-6">Start Your Journey</h3>
          <p class="text-xl text-purple-100">
            Create an account and revolutionize how your team conducts meetings.
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

    <!-- Right side - Form -->
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
      <div class="max-w-md w-full space-y-8">
        <div>
          <router-link to="/" class="flex items-center justify-center space-x-3 mb-8">
            <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span class="text-xl font-bold text-gray-900">Meeting Protocol</span>
          </router-link>

          <h2 class="text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Or
            <router-link to="/login" class="font-medium text-indigo-600 hover:text-indigo-500 ml-1">
              sign in to existing account
            </router-link>
          </p>
        </div>

        <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
          <div v-if="error" class="rounded-lg bg-red-50 p-4 border border-red-200">
            <p class="text-sm text-red-800">{{ error }}</p>
          </div>

          <div class="space-y-5">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                v-model="form.name"
                name="name"
                type="text"
                autocomplete="name"
                required
                class="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-colors"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                v-model="form.password"
                name="password"
                type="password"
                autocomplete="new-password"
                required
                class="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-colors"
                placeholder="••••••••"
              />
              <p class="mt-1 text-xs text-gray-500">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label for="groupCode" class="block text-sm font-medium text-gray-700">
                Group Code (Optional)
              </label>
              <div class="mt-1 relative">
                <input
                  id="groupCode"
                  v-model="form.groupCode"
                  name="groupCode"
                  type="text"
                  class="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-colors uppercase"
                  placeholder="ABC123"
                  maxlength="6"
                />
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p class="mt-1 text-xs text-gray-500">
                If you have a group code, enter it here to join the group
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-[1.02]"
            >
              <span v-if="isLoading">Creating account...</span>
              <span v-else>Create account</span>
            </button>
          </div>

          <p class="text-xs text-center text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import type { RegisterData } from '@/types/auth';

const authStore = useAuthStore();
const { error, isLoading } = storeToRefs(authStore);

const form = ref<RegisterData>({
  name: '',
  email: '',
  password: '',
  groupCode: ''
});

const handleRegister = async () => {
  try {
    await authStore.register(form.value);
  } catch (error) {
    // Error is handled in the store
  }
};
</script>
