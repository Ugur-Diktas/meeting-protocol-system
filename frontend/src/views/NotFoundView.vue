<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-900">404</h1>
      <p class="mt-2 text-lg text-gray-600">Page not found</p>
      <div class="mt-6">
        <router-link
          to="/"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Go to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No logic needed for 404 page
</script>
