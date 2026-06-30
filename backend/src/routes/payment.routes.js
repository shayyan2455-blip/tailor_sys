const express = require('express');
const controller = require('../controllers/payment.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(requireAuth, requireRole('Admin', 'Manager'));
router.get('/', controller.list);
router.post('/', controller.rules, controller.create);

module.exports = router;
