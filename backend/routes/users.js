const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get user settings
router.get('/settings', userController.getSettings);

// Update user settings
router.put('/settings', userController.updateSettings);

// Get notification settings
router.get('/settings/notifications', userController.getNotificationSettings);

// Update notification settings
router.put('/settings/notifications', userController.updateNotificationSettings);

// Get UI customization options
router.get('/settings/ui-options', userController.getUIOptions);

// Test email notification
router.post('/test-email', userController.testEmailNotification);

module.exports = router;