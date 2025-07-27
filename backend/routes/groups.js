const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get current user's group
router.get('/my-group', groupController.getMyGroup);

// Create new group
router.post('/create', groupController.createGroup);

// Join group with code
router.post('/join', groupController.joinGroup);

// Leave current group
router.post('/leave', groupController.leaveGroup);

// Update group details (admin only)
router.put('/update', groupController.updateGroup);

// Get group activity log
router.get('/activity', groupController.getGroupActivity);

module.exports = router;