<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Navigation -->
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-semibold">Meeting Protocol System</h1>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                to="/dashboard"
                class="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Dashboard
              </router-link>
              <router-link
                v-if="hasGroup"
                to="/protocols"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Protocols
              </router-link>
              <router-link
                to="/group"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Group
              </router-link>
            </div>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:items-center">
            <div class="ml-3 relative">
              <div class="flex items-center space-x-4">
                <span class="text-sm text-gray-700">{{ user?.name }}</span>
                <router-link
                  to="/profile"
                  class="text-sm text-gray-500 hover:text-gray-700"
                >
                  Profile
                </router-link>
                <button
                  @click="handleLogout"
                  class="text-sm text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">
              Welcome back, {{ user?.name }}!
            </h2>

            <div v-if="!hasGroup" class="rounded-md bg-yellow-50 p-4 mb-6">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-yellow-800">
                    No Group Membership
                  </h3>
                  <div class="mt-2 text-sm text-yellow-700">
                    <p>
                      You need to join or create a group to start creating meeting protocols.
                    </p>
                  </div>
                  <div class="mt-4">
                    <router-link
                      to="/group"
                      class="text-sm font-medium text-yellow-800 hover:text-yellow-700"
                    >
                      Join or create a group →
                    </router-link>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="space-y-6">
              <div>
                <h3 class="text-base font-medium text-gray-900">Quick Actions</h3>
                <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <router-link
                    to="/protocols/new"
                    class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">Create New Protocol</h4>
                      <p class="mt-1 text-sm text-gray-500">Start a new meeting protocol</p>
                    </div>
                  </router-link>

                  <router-link
                    to="/protocols"
                    class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">View All Protocols</h4>
                      <p class="mt-1 text-sm text-gray-500">Browse past meeting protocols</p>
                    </div>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { user, hasGroup } = storeToRefs(authStore);

const handleLogout = async () => {
  await authStore.logout();
};
</script>
