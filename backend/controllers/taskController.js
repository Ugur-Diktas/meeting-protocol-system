const { db } = require('../models');

// Get all tasks for the group
const getTasks = async (req, res) => {
  try {
    const { assignedTo, status, priority, overdue } = req.query;

    const filters = {};
    if (assignedTo) filters.assignedTo = assignedTo;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (overdue === 'true') filters.overdue = true;

    const tasks = await db.tasks.findByGroupId(req.user.group_id, filters);

    res.json({
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ 
      error: 'Failed to get tasks' 
    });
  }
};

// Get my tasks
const getMyTasks = async (req, res) => {
  try {
    const { status, priority, overdue } = req.query;

    const filters = {
      assignedTo: req.user.id
    };
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (overdue === 'true') filters.overdue = true;

    const tasks = await db.tasks.findByGroupId(req.user.group_id, filters);

    res.json({
      tasks
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ 
      error: 'Failed to get tasks' 
    });
  }
};

// Get single task
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await db.tasks.findById(id);

    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    // Check access
    if (task.group_id !== req.user.group_id) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    res.json({
      task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ 
      error: 'Failed to get task' 
    });
  }
};

// Create new task
const createTask = async (req, res) => {
  try {
    const {
      protocolId,
      title,
      description,
      assignedTo,
      deadline,
      priority,
      category,
      tags
    } = req.body;

    // Validate input
    if (!title) {
      return res.status(400).json({ 
        error: 'Task title is required' 
      });
    }

    // Create task
    const task = await db.tasks.create({
      protocol_id: protocolId,
      group_id: req.user.group_id,
      title,
      description,
      assigned_to: assignedTo,
      created_by: req.user.id,
      deadline,
      priority: priority || 'medium',
      category,
      tags,
      status: 'todo'
    });

    // Log activity
    await db.logActivity(
      req.user.group_id,
      req.user.id,
      'task',
      task.id,
      'created',
      { title, assignedTo }
    );

    // Emit real-time update
    req.io.to(`group-${req.user.group_id}`).emit('task-created', {
      task,
      createdBy: req.user
    });

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ 
      error: 'Failed to create task' 
    });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      assignedTo,
      deadline,
      priority,
      category,
      tags
    } = req.body;

    // Get existing task
    const existing = await db.tasks.findById(id);

    if (!existing) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    // Check access
    if (existing.group_id !== req.user.group_id) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Prepare updates
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assignedTo !== undefined) updates.assigned_to = assignedTo;
    if (deadline !== undefined) updates.deadline = deadline;
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;

    const task = await db.tasks.update(id, updates);

    // Log activity
    await db.logActivity(
      req.user.group_id,
      req.user.id,
      'task',
      id,
      'updated',
      updates
    );

    // Emit real-time update
    req.io.to(`group-${req.user.group_id}`).emit('task-updated', {
      task,
      updatedBy: req.user
    });

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ 
      error: 'Failed to update task' 
    });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completionNotes } = req.body;

    if (!status) {
      return res.status(400).json({ 
        error: 'Status is required' 
      });
    }

    // Get existing task
    const existing = await db.tasks.findById(id);

    if (!existing) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    // Check access
    if (existing.group_id !== req.user.group_id) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    const task = await db.tasks.updateStatus(id, status, completionNotes);

    // Log activity
    await db.logActivity(
      req.user.group_id,
      req.user.id,
      'task',
      id,
      'status_changed',
      { from: existing.status, to: status }
    );

    // Emit real-time update
    req.io.to(`group-${req.user.group_id}`).emit('task-status-updated', {
      taskId: id,
      status,
      updatedBy: req.user
    });

    res.json({
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ 
      error: 'Failed to update task status' 
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing task
    const existing = await db.tasks.findById(id);

    if (!existing) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    // Check access
    if (existing.group_id !== req.user.group_id) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Only creator or assigned user can delete
    if (existing.created_by?.id !== req.user.id && existing.assigned_to?.id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Only the creator or assigned user can delete this task' 
      });
    }

    await db.tasks.delete(id);

    // Log activity
    await db.logActivity(
      req.user.group_id,
      req.user.id,
      'task',
      id,
      'deleted',
      { title: existing.title }
    );

    // Emit real-time update
    req.io.to(`group-${req.user.group_id}`).emit('task-deleted', {
      taskId: id,
      deletedBy: req.user
    });

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ 
      error: 'Failed to delete task' 
    });
  }
};

// Add comment to task
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ 
        error: 'Comment is required' 
      });
    }

    // Check task access
    const task = await db.tasks.findById(id);
    if (!task || task.group_id !== req.user.group_id) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    const newComment = await db.taskComments.create({
      task_id: id,
      user_id: req.user.id,
      comment
    });

    // Emit real-time update
    req.io.to(`group-${req.user.group_id}`).emit('task-comment-added', {
      taskId: id,
      comment: newComment
    });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      error: 'Failed to add comment' 
    });
  }
};

// Get task statistics
const getTaskStats = async (req, res) => {
  try {
    const tasks = await db.tasks.findByGroupId(req.user.group_id);

    // Calculate statistics
    const stats = {
      total: tasks.length,
      byStatus: {
        todo: 0,
        in_progress: 0,
        done: 0,
        cancelled: 0,
        delegated: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      },
      overdue: 0,
      myTasks: {
        total: 0,
        todo: 0,
        in_progress: 0,
        overdue: 0
      }
    };

    const today = new Date().toISOString().split('T')[0];

    tasks.forEach(task => {
      // Status stats
      stats.byStatus[task.status]++;

      // Priority stats
      stats.byPriority[task.priority]++;

      // Overdue stats
      if (task.deadline && task.deadline < today && task.status !== 'done' && task.status !== 'cancelled') {
        stats.overdue++;
      }

      // My tasks stats
      if (task.assigned_to === req.user.id) {
        stats.myTasks.total++;
        if (task.status === 'todo') stats.myTasks.todo++;
        if (task.status === 'in_progress') stats.myTasks.in_progress++;
        if (task.deadline && task.deadline < today && task.status !== 'done' && task.status !== 'cancelled') {
          stats.myTasks.overdue++;
        }
      }
    });

    res.json({
      stats
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get task statistics' 
    });
  }
};

// Get upcoming deadlines
const getUpcomingDeadlines = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const tasks = await db.tasks.findByGroupId(req.user.group_id, {
      assignedTo: req.user.id
    });

    const upcomingTasks = tasks.filter(task => {
      if (!task.deadline || task.status === 'done' || task.status === 'cancelled') {
        return false;
      }
      const deadlineDate = new Date(task.deadline);
      return deadlineDate <= futureDate;
    });

    // Sort by deadline
    upcomingTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    res.json({
      tasks: upcomingTasks,
      count: upcomingTasks.length
    });
  } catch (error) {
    console.error('Get upcoming deadlines error:', error);
    res.status(500).json({ 
      error: 'Failed to get upcoming deadlines' 
    });
  }
};

module.exports = {
  getTasks,
  getMyTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  getTaskStats,
  getUpcomingDeadlines
};