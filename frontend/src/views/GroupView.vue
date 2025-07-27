<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-semibold">Group Management</h1>
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
            <div v-if="!hasGroup">
              <h2 class="text-lg font-medium text-gray-900">Join or Create a Group</h2>
              <p class="mt-1 text-sm text-gray-600">
                You need to be part of a group to create and manage meeting protocols.
              </p>

              <!-- Join Group Form -->
              <div class="mt-6">
                <h3 class="text-base font-medium text-gray-900">Join Existing Group</h3>
                <form @submit.prevent="handleJoinGroup" class="mt-4">
                  <div>
                    <label for="groupCode" class="block text-sm font-medium text-gray-700">
                      Group Code
                    </label>
                    <div class="mt-1 flex rounded-md shadow-sm">
                      <input
                        id="groupCode"
                        v-model="joinCode"
                        type="text"
                        placeholder="Enter 6-character code"
                        class="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <button
                        type="submit"
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Join Group
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Create Group Form -->
              <div class="mt-10 pt-10 border-t border-gray-200">
                <h3 class="text-base font-medium text-gray-900">Create New Group</h3>
                <form @submit.prevent="handleCreateGroup" class="mt-4 space-y-4">
                  <div>
                    <label for="groupName" class="block text-sm font-medium text-gray-700">
                      Group Name
                    </label>
                    <input
                      id="groupName"
                      v-model="newGroup.name"
                      type="text"
                      required
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label for="groupDescription" class="block text-sm font-medium text-gray-700">
                      Description (Optional)
                    </label>
                    <textarea
                      id="groupDescription"
                      v-model="newGroup.description"
                      rows="3"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                      Create Group
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div v-else>
              <h2 class="text-lg font-medium text-gray-900">Your Group</h2>
              <p class="mt-1 text-sm text-gray-600">
                You are a member of a group. Group details will be displayed here.
              </p>
              <!-- Group details will be implemented later -->
            </div>
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

const authStore = useAuthStore();
const { hasGroup } = storeToRefs(authStore);

const joinCode = ref('');
const newGroup = ref({
  name: '',
  description: ''
});

const handleJoinGroup = async () => {
  // Will be implemented when we create the group service
  alert('Join group functionality will be implemented soon');
};

const handleCreateGroup = async () => {
  // Will be implemented when we create the group service
  alert('Create group functionality will be implemented soon');
};
</script>
