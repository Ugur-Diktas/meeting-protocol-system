<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Header -->
    <header class="bg-white border-b border-gray-200">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 class="text-xl font-bold text-gray-900">{{ $t('common.appName') }}</h1>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <!-- Language Switcher -->
            <div class="relative">
              <select
                v-model="currentLocale"
                @change="changeLanguage"
                class="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent cursor-pointer"
              >
                <option value="de">🇩🇪 Deutsch</option>
                <option value="en">🇬🇧 English</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="it">🇮🇹 Italiano</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <router-link
              v-if="isAuthenticated"
              to="/dashboard"
              class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {{ $t('common.dashboard') }}
            </router-link>
            <template v-else>
              <router-link
                to="/login"
                class="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-red-dark transition-all shadow-md"
              >
                {{ $t('common.login') }}
              </router-link>
            </template>
          </div>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main>
      <!-- Hero Section -->
      <div class="bg-white py-12">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-gray-900 mb-2">{{ $t('home.title') }}</h1>
            <p class="text-xl text-brand-red font-medium mb-4">{{ $t('home.subtitle') }}</p>
            <p class="text-lg text-gray-600">{{ $t('home.description') }}</p>
          </div>
        </div>
      </div>

      <!-- What is this Section -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ $t('home.whatIsThis') }}</h2>
          <p class="text-gray-600 leading-relaxed">{{ $t('home.whatIsThisText') }}</p>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <h2 class="text-2xl font-bold text-gray-900 text-center mb-8">{{ $t('home.features.title') }}</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Protocol Management -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('home.features.protocols.title') }}</h3>
            <p class="text-gray-600 text-sm">{{ $t('home.features.protocols.description') }}</p>
          </div>

          <!-- Real-time Collaboration -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('home.features.collaboration.title') }}</h3>
            <p class="text-gray-600 text-sm">{{ $t('home.features.collaboration.description') }}</p>
          </div>

          <!-- Archive -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('home.features.archive.title') }}</h3>
            <p class="text-gray-600 text-sm">{{ $t('home.features.archive.description') }}</p>
          </div>

          <!-- Task Management -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('home.features.tasks.title') }}</h3>
            <p class="text-gray-600 text-sm">{{ $t('home.features.tasks.description') }}</p>
          </div>

          <!-- PDF Export -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('home.features.export.title') }}</h3>
            <p class="text-gray-600 text-sm">{{ $t('home.features.export.description') }}</p>
          </div>

          <!-- Group Management -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('home.features.groups.title') }}</h3>
            <p class="text-gray-600 text-sm">{{ $t('home.features.groups.description') }}</p>
          </div>
        </div>
      </div>

      <!-- Getting Started -->
      <div class="bg-white border-t border-gray-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 class="text-2xl font-bold text-gray-900 text-center mb-6">{{ $t('home.getStarted') }}</h2>
          <div class="text-center">
            <p class="text-gray-600 mb-6">{{ $t('home.loginPrompt') }}</p>
            <router-link
              v-if="!isAuthenticated"
              to="/login"
              class="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-brand-red hover:bg-brand-red-dark transition-all shadow-md"
            >
              {{ $t('common.login') }}
              <svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </router-link>
            <p class="mt-4 text-sm text-gray-500">{{ $t('home.noAccount') }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-300 py-8 mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <p class="text-sm">&copy; 2024 {{ $t('common.appName') }}. Internal Use Only.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const { locale } = useI18n();
const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);

const currentLocale = ref(locale.value);

const changeLanguage = () => {
  locale.value = currentLocale.value;
  localStorage.setItem('locale', currentLocale.value);
};
</script>
