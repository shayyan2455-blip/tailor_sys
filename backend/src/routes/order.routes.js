const express = require('express');
const controller = require('../controllers/order.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(requireAuth);
router.get('/', requireRole('Admin', 'Manager'), controller.list);
router.get('/:id', requireRole('Admin', 'Manager'), controller.detail);
router.post('/', requireRole('Admin', 'Manager'), controller.rules, controller.create);
router.put('/:id', requireRole('Admin', 'Manager'), controller.rules, controller.update);

module.exports = router;
