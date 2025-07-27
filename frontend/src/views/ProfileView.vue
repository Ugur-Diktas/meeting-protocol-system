<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-semibold">Profile Settings</h1>
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
            <h2 class="text-lg font-medium text-gray-900">Your Profile</h2>

            <!-- Profile Form -->
            <form @submit.prevent="handleUpdateProfile" class="mt-6 space-y-6">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="name"
                  v-model="profileForm.name"
                  type="text"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  :value="user?.email"
                  type="email"
                  disabled
                  class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                />
              </div>

              <div>
                <button
                  type="submit"
                  :disabled="isLoading"
                  class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {{ isLoading ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>

            <!-- Change Password Section -->
            <div class="mt-10 pt-10 border-t border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Change Password</h3>
              <form @submit.prevent="handleChangePassword" class="mt-6 space-y-6">
                <div>
                  <label for="currentPassword" class="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    v-model="passwordForm.currentPassword"
                    type="password"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label for="newPassword" class="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    v-model="passwordForm.newPassword"
                    type="password"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    :disabled="isLoading"
                    class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {{ isLoading ? 'Changing...' : 'Change Password' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { user, isLoading } = storeToRefs(authStore);

const profileForm = ref({
  name: ''
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: ''
});

onMounted(() => {
  if (user.value) {
    profileForm.value.name = user.value.name;
  }
});

const handleUpdateProfile = async () => {
  try {
    await authStore.updateProfile(profileForm.value);
    alert('Profile updated successfully!');
  } catch (error) {
    alert('Failed to update profile');
  }
};

const handleChangePassword = async () => {
  try {
    await authStore.changePassword(passwordForm.value);
    passwordForm.value = { currentPassword: '', newPassword: '' };
    alert('Password changed successfully!');
  } catch (error) {
    alert('Failed to change password');
  }
};
</script>
