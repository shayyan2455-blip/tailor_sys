const express = require('express');
const controller = require('../controllers/utility.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(requireAuth);
router.get('/settings', requireRole('Admin'), controller.settings);
router.put('/settings', requireRole('Admin'), controller.updateSettings);
router.post('/backup', requireRole('Admin'), controller.backup);

module.exports = router;
