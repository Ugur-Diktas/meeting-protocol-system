const { db } = require('../models');

// Get current user's group details
const getMyGroup = async (req, res) => {
  try {
    if (!req.user.group_id) {
      return res.status(404).json({ 
        error: 'You are not a member of any group' 
      });
    }

    const group = await db.groups.findById(req.user.group_id);
    
    if (!group) {
      return res.status(404).json({ 
        error: 'Group not found' 
      });
    }

    // Get group members
    const members = await db.users.findByGroupId(group.id);

    res.json({
      group,
      members
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ 
      error: 'Failed to get group information' 
    });
  }
};

// Create a new group
const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ 
        error: 'Group name is required' 
      });
    }

    // Generate unique 6-character code
    let code;
    let attempts = 0;
    do {
      code = generateGroupCode();
      const existing = await db.groups.findByCode(code);
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return res.status(500).json({ 
        error: 'Failed to generate unique group code' 
      });
    }

    // Create group
    const group = await db.groups.create({
      name,
      description,
      code
    });

    // Update user to join the group as admin
    await db.users.update(req.user.id, {
      group_id: group.id,
      role: 'admin'
    });

    // Log activity
    await db.logActivity(
      group.id,
      req.user.id,
      'group',
      group.id,
      'created',
      { name, code }
    );

    res.status(201).json({
      message: 'Group created successfully',
      group,
      code
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ 
      error: 'Failed to create group' 
    });
  }
};

// Join a group using code
const joinGroup = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ 
        error: 'Group code is required' 
      });
    }

    // Check if user already has a group
    if (req.user.group_id) {
      return res.status(400).json({ 
        error: 'You are already a member of a group. Leave your current group first.' 
      });
    }

    // Find group by code
    const group = await db.groups.findByCode(code.toUpperCase());

    if (!group) {
      return res.status(404).json({ 
        error: 'Invalid group code' 
      });
    }

    // Join group
    await db.users.update(req.user.id, {
      group_id: group.id,
      role: 'member'
    });

    // Log activity
    await db.logActivity(
      group.id,
      req.user.id,
      'group',
      group.id,
      'member_joined',
      { userId: req.user.id, userName: req.user.name }
    );

    res.json({
      message: 'Successfully joined the group',
      group
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ 
      error: 'Failed to join group' 
    });
  }
};

// Leave current group
const leaveGroup = async (req, res) => {
  try {
    if (!req.user.group_id) {
      return res.status(400).json({ 
        error: 'You are not a member of any group' 
      });
    }

    const groupId = req.user.group_id;

    // Update user
    await db.users.update(req.user.id, {
      group_id: null,
      role: 'member'
    });

    // Log activity
    await db.logActivity(
      groupId,
      req.user.id,
      'group',
      groupId,
      'member_left',
      { userId: req.user.id, userName: req.user.name }
    );

    res.json({
      message: 'Successfully left the group'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ 
      error: 'Failed to leave group' 
    });
  }
};

// Update group details (admin only)
const updateGroup = async (req, res) => {
  try {
    const { name, description, settings } = req.body;

    if (!req.user.group_id) {
      return res.status(403).json({ 
        error: 'You must belong to a group' 
      });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Only group admins can update group details' 
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (settings !== undefined) updates.settings = settings;

    const group = await db.groups.update(req.user.group_id, updates);

    // Log activity
    await db.logActivity(
      req.user.group_id,
      req.user.id,
      'group',
      req.user.group_id,
      'updated',
      updates
    );

    res.json({
      message: 'Group updated successfully',
      group
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ 
      error: 'Failed to update group' 
    });
  }
};

// Get group activity log
const getGroupActivity = async (req, res) => {
  try {
    if (!req.user.group_id) {
      return res.status(403).json({ 
        error: 'You must belong to a group' 
      });
    }

    const limit = parseInt(req.query.limit) || 50;
    const activities = await db.activityLogs.findByGroupId(req.user.group_id, limit);

    res.json({
      activities
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ 
      error: 'Failed to get activity log' 
    });
  }
};

// Helper function to generate group code
function generateGroupCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = {
  getMyGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  updateGroup,
  getGroupActivity
};