const express = require('express');
const controller = require('../controllers/production.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { parsePagination } = require('../middleware/pagination.middleware');

const router = express.Router();
router.use(requireAuth);
router.get('/active', requireRole('Admin', 'Manager', 'Worker'), parsePagination, controller.activeList);
router.patch('/stage', requireRole('Admin', 'Manager', 'Worker'), controller.toggleRules, controller.toggleStage);
router.post('/deliver', requireRole('Admin', 'Manager'), controller.deliverRules, controller.deliverOrder);
router.get('/tracking/:id', requireRole('Admin', 'Manager', 'Worker'), controller.orderTracking);

module.exports = router;
