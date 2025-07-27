const express = require('express');
const router = express.Router();
const protocolController = require('../controllers/protocolController');
const { authenticate, requireGroup } = require('../middleware/auth');

// All routes require authentication and group membership
router.use(authenticate);
router.use(requireGroup);

// Get all protocols
router.get('/', protocolController.getProtocols);

// Create new protocol
router.post('/', protocolController.createProtocol);

// Get single protocol
router.get('/:id', protocolController.getProtocolById);

// Update protocol
router.put('/:id', protocolController.updateProtocol);

// Update specific section
router.put('/:id/section', protocolController.updateProtocolSection);

// Finalize protocol
router.post('/:id/finalize', protocolController.finalizeProtocol);

// Get protocol versions
router.get('/:id/versions', protocolController.getProtocolVersions);

// Update attendees
router.put('/:id/attendees', protocolController.updateAttendees);

// Comments
router.post('/:id/comments', protocolController.addComment);
router.put('/:id/comments/:commentId/resolve', protocolController.resolveComment);

module.exports = router;