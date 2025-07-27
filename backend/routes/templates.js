const express = require('express');
const router = express.Router();
const protocolTemplateController = require('../controllers/protocolTemplateController');
const { authenticate, requireGroup } = require('../middleware/auth');

// All routes require authentication and group membership
router.use(authenticate);
router.use(requireGroup);

// Get all templates
router.get('/', protocolTemplateController.getTemplates);

// Get single template
router.get('/:id', protocolTemplateController.getTemplateById);

// Create new template
router.post('/', protocolTemplateController.createTemplate);

// Update template
router.put('/:id', protocolTemplateController.updateTemplate);

// Delete template
router.delete('/:id', protocolTemplateController.deleteTemplate);

module.exports = router;