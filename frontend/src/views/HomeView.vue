<template>
  <div class="min-h-screen bg-white">
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
              <h1 class="text-xl font-bold text-gray-900">Meeting Protocol System</h1>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <router-link
              v-if="isAuthenticated"
              to="/dashboard"
              class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </router-link>
            <template v-else>
              <router-link
                to="/login"
                class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </router-link>
              <router-link
                to="/register"
                class="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-red-dark transition-all shadow-md"
              >
                Get Started
              </router-link>
            </template>
          </div>
        </div>
      </nav>
    </header>

    <!-- Hero Section -->
    <main>
      <div class="bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div class="text-center">
            <h2 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
              Streamline Your
              <span class="block text-brand-red">
                Meeting Protocols
              </span>
            </h2>
            <p class="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Create, collaborate, and manage meeting protocols with your team in real-time.
              Generate professional PDFs with just one click. Make every meeting count.
            </p>
            <div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <router-link
                v-if="!isAuthenticated"
                to="/register"
                class="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-brand-red hover:bg-brand-red-dark transform hover:scale-105 transition-all shadow-lg"
              >
                Start Free Trial
                <svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </router-link>
              <router-link
                v-else
                to="/dashboard"
                class="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-brand-red hover:bg-brand-red-dark transform hover:scale-105 transition-all shadow-lg"
              >
                Go to Dashboard
                <svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </router-link>
              <a
                href="#features"
                class="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transform hover:scale-105 transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div id="features" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <h3 class="text-3xl font-bold text-gray-900">Everything you need for productive meetings</h3>
            <p class="mt-4 text-lg text-gray-600">Powerful features to transform how your team conducts meetings</p>
          </div>

          <div class="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <!-- Feature 1 -->
            <div class="text-center">
              <div class="flex items-center justify-center h-14 w-14 rounded-xl bg-brand-red text-white mx-auto">
                <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h4 class="mt-6 text-xl font-semibold text-gray-900">Dynamic Forms</h4>
              <p class="mt-3 text-gray-600">
                Add agenda items, participants, and to-dos dynamically during your meetings.
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="text-center">
              <div class="flex items-center justify-center h-14 w-14 rounded-xl bg-brand-red text-white mx-auto">
                <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 class="mt-6 text-xl font-semibold text-gray-900">Real-time Collaboration</h4>
              <p class="mt-3 text-gray-600">
                Multiple team members can edit protocols simultaneously with live updates.
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="text-center">
              <div class="flex items-center justify-center h-14 w-14 rounded-xl bg-brand-red text-white mx-auto">
                <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 class="mt-6 text-xl font-semibold text-gray-900">PDF Generation</h4>
              <p class="mt-3 text-gray-600">
                Generate professional PDF documents from your protocols with one click.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="bg-brand-red py-16">
        <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 class="text-3xl font-bold text-white">Ready to transform your meetings?</h3>
          <p class="mt-4 text-xl text-white opacity-90">Join teams who are already making their meetings more productive.</p>
          <div class="mt-8">
            <router-link
              v-if="!isAuthenticated"
              to="/register"
              class="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-base font-medium rounded-xl text-brand-red bg-white hover:bg-gray-100 transform hover:scale-105 transition-all"
            >
              Get Started Free
            </router-link>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-300 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <p>&copy; 2024 Meeting Protocol System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);
</script>
