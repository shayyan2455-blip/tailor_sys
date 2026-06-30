const express = require('express');
const controller = require('../controllers/production.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(requireAuth);
router.get('/active', requireRole('Admin', 'Manager', 'Worker'), controller.activeList);
router.patch('/stage', requireRole('Admin', 'Manager', 'Worker'), controller.toggleRules, controller.toggleStage);

module.exports = router;
