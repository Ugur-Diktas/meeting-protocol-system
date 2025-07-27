<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-semibold">Meeting Protocols</h1>
            </div>
          </div>
          <div class="flex items-center">
            <router-link
              to="/dashboard"
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h2 class="text-lg font-medium text-gray-900">All Protocols</h2>
            <p class="mt-1 text-sm text-gray-600">
              View and manage your meeting protocols
            </p>
            <div class="mt-6">
              <router-link
                to="/protocols/new"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create New Protocol
              </router-link>
            </div>
            <!-- Protocol list will be implemented later -->
            <div class="mt-6">
              <p class="text-gray-500">No protocols yet. Create your first one!</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// Protocol list logic will be implemented later
</script>
