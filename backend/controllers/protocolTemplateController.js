const { db } = require('../models');

// Get all templates available to the group
const getTemplates = async (req, res) => {
  try {
    const templates = await db.protocolTemplates.findByGroupId(req.user.group_id);

    res.json({
      templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ 
      error: 'Failed to get templates' 
    });
  }
};

// Get single template
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await db.protocolTemplates.findById(id);

    if (!template) {
      return res.status(404).json({ 
        error: 'Template not found' 
      });
    }

    // Check access - template must be global or belong to user's group
    if (template.group_id && template.group_id !== req.user.group_id) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    res.json({
      template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ 
      error: 'Failed to get template' 
    });
  }
};

// Create new template
const createTemplate = async (req, res) => {
  try {
    const { name, description, structure } = req.body;

    // Validate input
    if (!name || !structure) {
      return res.status(400).json({ 
        error: 'Template name and structure are required' 
      });
    }

    // Validate structure
    if (!structure.sections || !Array.isArray(structure.sections)) {
      return res.status(400).json({ 
        error: 'Template structure must contain sections array' 
      });
    }

    const template = await db.protocolTemplates.create({
      group_id: req.user.group_id,
      name,
      description,
      structure,
      created_by: req.user.id
    });

    // Log activity
    await db.logActivity(
      req.user.group_id,
      req.user.id,
      'template',
      template.id,
      'created',
      { name }
    );

    res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ 
      error: 'Failed to create template' 
    });
  }
};

// Update template
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, structure } = req.body;

    // Get existing template
    const existing = await db.protocolTemplates.findById(id);

    if (!existing) {
      return res.status(404).json({ 
        error: 'Template not found' 
      });
    }

    // Check ownership
    if (existing.group_id !== req.user.group_id) {
      return res.status(403).json({ 
        error: 'You can only update templates from your group' 
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (structure !== undefined) updates.structure = structure;

    const template = await db.protocolTemplates.update(id, updates);

    // Log activity
    await db.logActivity(
      req.user.group_id,
      req.user.id,
      'template',
      id,
      'updated',
      updates
    );

    res.json({
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ 
      error: 'Failed to update template' 
    });
  }
};

// Delete template
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing template
    const existing = await db.protocolTemplates.findById(id);

    if (!existing) {
      return res.status(404).json({ 
        error: 'Template not found' 
      });
    }

    // Check ownership
    if (existing.group_id !== req.user.group_id) {
      return res.status(403).json({ 
        error: 'You can only delete templates from your group' 
      });
    }

    // Don't allow deleting default templates
    if (existing.is_default) {
      return res.status(400).json({ 
        error: 'Cannot delete default templates' 
      });
    }

    await db.protocolTemplates.delete(id);

    // Log activity
    await db.logActivity(
      req.user.group_id,
      req.user.id,
      'template',
      id,
      'deleted',
      { name: existing.name }
    );

    res.json({
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ 
      error: 'Failed to delete template' 
    });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};