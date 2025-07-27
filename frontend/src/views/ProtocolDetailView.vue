<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-semibold">Protocol Details</h1>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <router-link
              :to="`/protocols/${protocolId}/edit`"
              class="text-indigo-600 hover:text-indigo-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Edit
            </router-link>
            <router-link
              to="/protocols"
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Back to Protocols
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h2 class="text-lg font-medium text-gray-900">Protocol #{protocolId}</h2>
            <p class="mt-1 text-sm text-gray-600">
              Protocol details will be displayed here
            </p>
            <!-- Protocol details will be implemented later -->
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const protocolId = computed(() => route.params.id);
</script>
