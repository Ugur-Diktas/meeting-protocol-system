import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Views
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/protocols',
    name: 'protocols',
    component: () => import('@/views/ProtocolsView.vue'),
    meta: { requiresAuth: true, requiresGroup: true }
  },
  {
    path: '/protocols/new',
    name: 'protocol-new',
    component: () => import('@/views/ProtocolFormView.vue'),
    meta: { requiresAuth: true, requiresGroup: true }
  },
  {
    path: '/protocols/:id',
    name: 'protocol-detail',
    component: () => import('@/views/ProtocolDetailView.vue'),
    meta: { requiresAuth: true, requiresGroup: true }
  },
  {
    path: '/protocols/:id/edit',
    name: 'protocol-edit',
    component: () => import('@/views/ProtocolFormView.vue'),
    meta: { requiresAuth: true, requiresGroup: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/group',
    name: 'group',
    component: () => import('@/views/GroupView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Check if we need to fetch user data
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser();
    } catch (error) {
      // Token is invalid, user will be logged out
    }
  }

  const isAuthenticated = authStore.isAuthenticated;
  const hasGroup = authStore.hasGroup;

  // Route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  // Route requires guest (not authenticated)
  if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'dashboard' });
    return;
  }

  // Route requires group membership
  if (to.meta.requiresGroup && !hasGroup) {
    next({ name: 'group' });
    return;
  }

  next();
});

export default router;
