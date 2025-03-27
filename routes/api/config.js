const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/auth');
const configController = require('../../controllers/configController');

// Session route
router.get('/session', protect, configController.getCurrentSession);

// Deadlines route
router.get('/deadlines', protect, configController.getDeadlines);

// System alerts route
router.get('/alerts', protect, admin, configController.getSystemAlerts);

module.exports = router;