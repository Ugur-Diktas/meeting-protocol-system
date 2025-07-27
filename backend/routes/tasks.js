const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate, requireGroup } = require('../middleware/auth');

// All routes require authentication and group membership
router.use(authenticate);
router.use(requireGroup);

// Get all group tasks
router.get('/', taskController.getTasks);

// Get my tasks
router.get('/my-tasks', taskController.getMyTasks);

// Get task statistics
router.get('/stats', taskController.getTaskStats);

// Get upcoming deadlines
router.get('/upcoming', taskController.getUpcomingDeadlines);

// Create new task
router.post('/', taskController.createTask);

// Get single task
router.get('/:id', taskController.getTaskById);

// Update task
router.put('/:id', taskController.updateTask);

// Update task status
router.patch('/:id/status', taskController.updateTaskStatus);

// Delete task
router.delete('/:id', taskController.deleteTask);

// Add comment to task
router.post('/:id/comments', taskController.addComment);

module.exports = router;