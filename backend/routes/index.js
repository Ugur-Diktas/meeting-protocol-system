const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const protocolRoutes = require('./protocols');
const groupRoutes = require('./groups');
const taskRoutes = require('./tasks');
const templateRoutes = require('./templates');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/protocols', protocolRoutes);
router.use('/groups', groupRoutes);
router.use('/tasks', taskRoutes);
router.use('/templates', templateRoutes);

// Admin route for triggering jobs manually (for testing)
router.post('/admin/jobs/weekly-email', 
  require('../middleware/auth').authenticate,
  require('../middleware/auth').requireAdmin,
  require('../jobs/weeklyTodoEmail').triggerWeeklyEmails
);

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API routes working',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/me',
        'PUT /api/auth/profile',
        'POST /api/auth/change-password',
        'POST /api/auth/logout'
      ],
      users: [
        'GET /api/users/settings',
        'PUT /api/users/settings',
        'GET /api/users/settings/notifications',
        'PUT /api/users/settings/notifications',
        'GET /api/users/settings/ui-options',
        'POST /api/users/test-email'
      ],
      groups: [
        'GET /api/groups/my-group',
        'POST /api/groups/create',
        'POST /api/groups/join',
        'POST /api/groups/leave',
        'PUT /api/groups/update',
        'GET /api/groups/activity'
      ],
      protocols: [
        'GET /api/protocols',
        'POST /api/protocols',
        'GET /api/protocols/:id',
        'PUT /api/protocols/:id',
        'PUT /api/protocols/:id/section',
        'POST /api/protocols/:id/finalize',
        'GET /api/protocols/:id/versions',
        'PUT /api/protocols/:id/attendees',
        'POST /api/protocols/:id/comments',
        'PUT /api/protocols/:id/comments/:commentId/resolve'
      ],
      tasks: [
        'GET /api/tasks',
        'GET /api/tasks/my-tasks',
        'GET /api/tasks/stats',
        'GET /api/tasks/upcoming',
        'POST /api/tasks',
        'GET /api/tasks/:id',
        'PUT /api/tasks/:id',
        'PATCH /api/tasks/:id/status',
        'DELETE /api/tasks/:id',
        'POST /api/tasks/:id/comments'
      ],
      templates: [
        'GET /api/templates',
        'GET /api/templates/:id',
        'POST /api/templates',
        'PUT /api/templates/:id',
        'DELETE /api/templates/:id'
      ],
      admin: [
        'POST /api/admin/jobs/weekly-email'
      ]
    }
  });
});

module.exports = router;