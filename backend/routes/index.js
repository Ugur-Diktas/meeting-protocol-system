const express = require('express');
const router = express.Router();

// Import route modules (we'll create these later)
// const authRoutes = require('./auth');
// const protocolRoutes = require('./protocols');
// const groupRoutes = require('./groups');
// const userRoutes = require('./users');

// Mount routes
// router.use('/auth', authRoutes);
// router.use('/protocols', protocolRoutes);
// router.use('/groups', groupRoutes);
// router.use('/users', userRoutes);

// Temporary test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API routes working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;