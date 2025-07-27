<template>
  <router-view v-if="!isInitializing" />
  <div v-else class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
    <div class="text-center">
      <div class="relative">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 mx-auto"></div>
        <div class="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
      </div>
      <p class="mt-6 text-lg text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const isInitializing = ref(true);

onMounted(async () => {
  // Try to fetch user if token exists
  if (authStore.token) {
    try {
      await authStore.fetchUser();
    } catch (error) {
      // Token is invalid, user will be logged out
    }
  }

  isInitializing.value = false;
});
</script>

<style>
/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}
</style>
