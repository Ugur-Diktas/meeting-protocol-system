<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 class="text-lg font-semibold text-gray-900">{{ $t('common.appName') }}</h1>
              </div>
            </div>
            <div class="hidden sm:ml-8 sm:flex sm:space-x-8">
              <router-link
                to="/dashboard"
                class="border-brand-red text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                {{ $t('common.dashboard') }}
              </router-link>
              <router-link
                v-if="hasGroup"
                to="/protocols"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
              >
                {{ $t('common.appName') }}
              </router-link>
              <router-link
                to="/group"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
              >
                {{ $t('home.features.groups.title') }}
              </router-link>
            </div>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <!-- Language Switcher -->
            <div class="relative">
              <select
                v-model="currentLocale"
                @change="changeLanguage"
                class="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent cursor-pointer"
              >
                <option value="de">🇩🇪 DE</option>
                <option value="en">🇬🇧 EN</option>
                <option value="fr">🇫🇷 FR</option>
                <option value="it">🇮🇹 IT</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <button class="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red rounded-lg">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <!-- Profile dropdown -->
            <div class="relative ml-3">
              <div class="flex items-center space-x-3">
                <div class="flex flex-col items-end">
                  <span class="text-sm font-medium text-gray-900">{{ user?.name }}</span>
                  <span class="text-xs text-gray-500">{{ user?.email }}</span>
                </div>
                <div class="h-8 w-8 rounded-full bg-brand-red flex items-center justify-center">
                  <span class="text-sm font-medium text-white">{{ user?.name?.charAt(0).toUpperCase() }}</span>
                </div>
              </div>
            </div>

            <router-link
              to="/profile"
              class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {{ $t('common.settings') }}
            </router-link>
            <button
              @click="handleLogout"
              class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {{ $t('common.logout') }}
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Welcome section -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900">
          {{ $t('dashboard.welcome', { name: user?.name }) }}
        </h2>
        <p class="mt-1 text-gray-600">
          {{ new Date().toLocaleDateString(currentLocale === 'de' ? 'de-DE' : currentLocale === 'fr' ? 'fr-FR' : currentLocale === 'it' ? 'it-IT' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
        </p>
      </div>

      <!-- No Group Alert -->
      <div v-if="!hasGroup" class="mb-8 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 p-6 border border-orange-200">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-orange-800">
              {{ $t('dashboard.noGroup.title') }}
            </h3>
            <p class="mt-2 text-sm text-orange-700">
              {{ $t('dashboard.noGroup.description') }}
            </p>
            <div class="mt-4">
              <router-link
                to="/group"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                {{ $t('dashboard.noGroup.action') }}
                <svg class="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div v-else>
        <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('dashboard.quickActions.title') }}</h3>
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <!-- Create Protocol Card -->
          <router-link
            to="/protocols/new"
            class="group relative rounded-xl border-2 border-gray-200 bg-white p-6 hover:border-brand-red transition-all hover:shadow-lg"
          >
            <div>
              <span class="inline-flex rounded-lg p-3 bg-brand-red/10 text-brand-red group-hover:bg-brand-red/20 transition-colors">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </span>
            </div>
            <div class="mt-4">
              <h4 class="text-lg font-medium text-gray-900">{{ $t('dashboard.quickActions.newProtocol.title') }}</h4>
              <p class="mt-2 text-sm text-gray-500">
                {{ $t('dashboard.quickActions.newProtocol.description') }}
              </p>
            </div>
            <span class="absolute top-6 right-6 text-gray-400 group-hover:text-brand-red transition-colors">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </router-link>

          <!-- View Protocols Card -->
          <router-link
            to="/protocols"
            class="group relative rounded-xl border-2 border-gray-200 bg-white p-6 hover:border-brand-red transition-all hover:shadow-lg"
          >
            <div>
              <span class="inline-flex rounded-lg p-3 bg-brand-red/10 text-brand-red group-hover:bg-brand-red/20 transition-colors">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
            </div>
            <div class="mt-4">
              <h4 class="text-lg font-medium text-gray-900">{{ $t('dashboard.quickActions.viewProtocols.title') }}</h4>
              <p class="mt-2 text-sm text-gray-500">
                {{ $t('dashboard.quickActions.viewProtocols.description') }}
              </p>
            </div>
            <span class="absolute top-6 right-6 text-gray-400 group-hover:text-brand-red transition-colors">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </router-link>

          <!-- Team Card -->
          <router-link
            to="/group"
            class="group relative rounded-xl border-2 border-gray-200 bg-white p-6 hover:border-brand-red transition-all hover:shadow-lg"
          >
            <div>
              <span class="inline-flex rounded-lg p-3 bg-brand-red/10 text-brand-red group-hover:bg-brand-red/20 transition-colors">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
            </div>
            <div class="mt-4">
              <h4 class="text-lg font-medium text-gray-900">{{ $t('dashboard.quickActions.manageTeam.title') }}</h4>
              <p class="mt-2 text-sm text-gray-500">
                {{ $t('dashboard.quickActions.manageTeam.description') }}
              </p>
            </div>
            <span class="absolute top-6 right-6 text-gray-400 group-hover:text-brand-red transition-colors">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </router-link>
        </div>

        <!-- Recent Activity -->
        <div class="mt-12">
          <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('dashboard.recentActivity.title') }}</h3>
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <p class="text-gray-500 text-center py-8">
              {{ $t('dashboard.recentActivity.empty') }}
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const { user, hasGroup } = storeToRefs(authStore);
const { locale } = useI18n();

const currentLocale = ref(locale.value);

const changeLanguage = () => {
  locale.value = currentLocale.value;
  localStorage.setItem('locale', currentLocale.value);
};

const handleLogout = async () => {
  await authStore.logout();
};
</script>
