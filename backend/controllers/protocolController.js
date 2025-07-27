const { db } = require('../models');

// Get all protocols for the user's group
const getProtocols = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const protocols = await db.protocols.findByGroupId(req.user.group_id, filters);

    res.json({
      protocols
    });
  } catch (error) {
    console.error('Get protocols error:', error);
    res.status(500).json({ 
      error: 'Failed to get protocols' 
    });
  }
};

// Get single protocol by ID
const getProtocolById = async (req, res) => {
  try {
    const { id } = req.params;

    const protocol = await db.protocols.findById(id);

    if (!protocol) {
      return res.status(404).json({ 
        error: 'Protocol not found' 
      });
    }

    // Check if user has access
    if (protocol.group_id !== req.user.group_id) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Get comments
    const comments = await db.protocolComments.findByProtocolId(id);
    protocol.comments = comments;

    res.json({
      protocol
    });
  } catch (error) {
    console.error('Get protocol error:', error);
    res.status(500).json({ 
      error: 'Failed to get protocol' 
    });
  }
};

// Create new protocol
const createProtocol = async (req, res) => {
  try {
    const { templateId, meetingDate, title, data } = req.body;

    // Validate input
    if (!meetingDate || !title) {
      return res.status(400).json({ 
        error: 'Meeting date and title are required' 
      });
    }

    // Get template if specified
    let templateData = {};
    if (templateId) {
      const template = await db.protocolTemplates.findById(templateId);
      if (template) {
        templateData = template.structure;
      }
    }

    // Create protocol
    const protocol = await db.protocols.create({
      group_id: req.user.group_id,
      template_id: templateId,
      meeting_date: meetingDate,
      title,
      data: data || templateData,
      created_by: req.user.id,
      status: 'draft'
    });

    // Log activity
    await db.logActivity(
      req.user.group_id,
      req.user.id,
      'protocol',
      protocol.id,
      'created',
      { title, meetingDate }
    );

    res.status(201).json({
      message: 'Protocol created successfully',
      protocol
    });
  } catch (error) {
    console.error('Create protocol error:', error);
    res.status(500).json({ 
      error: 'Failed to create protocol' 
    });
  }
};

// Update protocol
const updateProtocol = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, data, status, lockedSections } = req.body;

    // Get existing protocol
    const existing = await db.protocols.findById(id);

    if (!existing) {
      return res.status(404).json({ 
        error: 'Protocol not found' 
      });
    }

    // Check access
    if (existing.group_id !== req.user.group_id) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Check if protocol is finalized
    if (existing.status === 'finalized' && status !== 'finalized') {
      return res.status(400).json({ 
        error: 'Cannot modify finalized protocol' 
      });
    }

    // Prepare updates
    const updates = {
      updated_by: req.user.id
    };
    if (title !== undefined) updates.title = title;
    if (data !== undefined) updates.data = data;
    if (status !== undefined) updates.status = status;
    if (lockedSections !== undefined) updates.locked_sections = lockedSections;

    // Calculate changes for version history
    const changes = {};
    if (title !== existing.title) changes.title = { old: existing.title, new: title };
    if (status !== existing.status) changes.status = { old: existing.status, new: status };

    updates.changes = changes;

    // Update protocol (this will create a version automatically)
    const protocol = await db.protocols.update(id, updates);

    // Log activity
    await db.logActivity(
      req.user.group_id,
      req.user.id,
      'protocol',
      id,
      'updated',
      changes
    );

    // Emit real-time update
    req.io.to(`protocol-${id}`).emit('protocol-updated', {
      protocolId: id,
      updates,
      updatedBy: req.user
    });

    res.json({
      message: 'Protocol updated successfully',
      protocol
    });
  } catch (error) {
    console.error('Update protocol error:', error);
    res.status(500).json({ 
      error: 'Failed to update protocol' 
    });
  }
};

// Update specific section of protocol
const updateProtocolSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { sectionId, content } = req.body;

    if (!sectionId || content === undefined) {
      return res.status(400).json({ 
        error: 'Section ID and content are required' 
      });
    }

    // Get existing protocol
    const existing = await db.protocols.findById(id);

    if (!existing) {
      return res.status(404).json({ 
        error: 'Protocol not found' 
      });
    }

    // Check access
    if (existing.group_id !== req.user.group_id) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Check if section is locked
    if (existing.locked_sections?.includes(sectionId)) {
      return res.status(400).json({ 
        error: 'This section is locked' 
      });
    }

    // Update section data
    const updatedData = { ...existing.data };
    updatedData[sectionId] = content;

    // Update protocol
    const protocol = await db.protocols.update(id, {
      data: updatedData,
      updated_by: req.user.id,
      changes: { section: sectionId }
    });

    // Emit real-time update
    req.io.to(`protocol-${id}`).emit('section-updated', {
      protocolId: id,
      sectionId,
      content,
      updatedBy: req.user
    });

    res.json({
      message: 'Section updated successfully',
      section: { id: sectionId, content }
    });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ 
      error: 'Failed to update section' 
    });
  }
};

// Finalize protocol
const finalizeProtocol = async (req, res) => {
  try {
    const { id } = req.params;

    const protocol = await db.protocols.finalize(id, req.user.id);

    // Log activity
    await db.logActivity(
      req.user.group_id,
      req.user.id,
      'protocol',
      id,
      'finalized',
      { finalizedAt: protocol.finalized_at }
    );

    // Create tasks from protocol
    await createTasksFromProtocol(protocol);

    res.json({
      message: 'Protocol finalized successfully',
      protocol
    });
  } catch (error) {
    console.error('Finalize protocol error:', error);
    res.status(500).json({ 
      error: 'Failed to finalize protocol' 
    });
  }
};

// Get protocol versions
const getProtocolVersions = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if protocol exists and user has access
    const protocol = await db.protocols.findById(id);
    if (!protocol || protocol.group_id !== req.user.group_id) {
      return res.status(404).json({ 
        error: 'Protocol not found' 
      });
    }

    const versions = await db.protocolVersions.findByProtocolId(id);

    res.json({
      versions
    });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ 
      error: 'Failed to get protocol versions' 
    });
  }
};

// Update protocol attendees
const updateAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendees } = req.body;

    // Check protocol access
    const protocol = await db.protocols.findById(id);
    if (!protocol || protocol.group_id !== req.user.group_id) {
      return res.status(404).json({ 
        error: 'Protocol not found' 
      });
    }

    // Prepare attendee data
    const attendeeData = attendees.map(att => ({
      protocol_id: id,
      user_id: att.userId,
      attendance_type: att.type,
      arrival_time: att.arrivalTime,
      departure_time: att.departureTime,
      capacity_tasks: att.capacityTasks || 100,
      capacity_responsibilities: att.capacityResponsibilities || 100,
      notes: att.notes
    }));

    // Bulk upsert
    await db.protocolAttendees.bulkUpsert(attendeeData);

    res.json({
      message: 'Attendees updated successfully'
    });
  } catch (error) {
    console.error('Update attendees error:', error);
    res.status(500).json({ 
      error: 'Failed to update attendees' 
    });
  }
};

// Add comment to protocol section
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { sectionId, comment } = req.body;

    if (!sectionId || !comment) {
      return res.status(400).json({ 
        error: 'Section ID and comment are required' 
      });
    }

    // Check protocol access
    const protocol = await db.protocols.findById(id);
    if (!protocol || protocol.group_id !== req.user.group_id) {
      return res.status(404).json({ 
        error: 'Protocol not found' 
      });
    }

    const newComment = await db.protocolComments.create({
      protocol_id: id,
      section_id: sectionId,
      user_id: req.user.id,
      comment
    });

    // Emit real-time update
    req.io.to(`protocol-${id}`).emit('comment-added', {
      protocolId: id,
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

// Resolve comment
const resolveComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    const comment = await db.protocolComments.resolve(commentId, req.user.id);

    // Emit real-time update
    req.io.to(`protocol-${id}`).emit('comment-resolved', {
      protocolId: id,
      commentId,
      resolvedBy: req.user
    });

    res.json({
      message: 'Comment resolved successfully',
      comment
    });
  } catch (error) {
    console.error('Resolve comment error:', error);
    res.status(500).json({ 
      error: 'Failed to resolve comment' 
    });
  }
};

// Helper function to create tasks from protocol
async function createTasksFromProtocol(protocol) {
  try {
    const todos = protocol.data.todos || {};
    const tasks = [];

    // Extract tasks from todo sections
    for (const [userId, userTodos] of Object.entries(todos)) {
      if (Array.isArray(userTodos)) {
        for (const todo of userTodos) {
          if (todo.title && todo.title.trim()) {
            tasks.push({
              protocol_id: protocol.id,
              group_id: protocol.group_id,
              title: todo.title,
              description: todo.description,
              assigned_to: userId,
              deadline: todo.deadline,
              priority: todo.priority || 'medium',
              created_by: protocol.finalized_by,
              category: 'protocol-task'
            });
          }
        }
      }
    }

    // Bulk create tasks
    if (tasks.length > 0) {
      for (const task of tasks) {
        await db.tasks.create(task);
      }
    }
  } catch (error) {
    console.error('Error creating tasks from protocol:', error);
  }
}

module.exports = {
  getProtocols,
  getProtocolById,
  createProtocol,
  updateProtocol,
  updateProtocolSection,
  finalizeProtocol,
  getProtocolVersions,
  updateAttendees,
  addComment,
  resolveComment
};