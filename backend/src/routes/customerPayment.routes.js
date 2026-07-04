const express = require('express');
const controller = require('../controllers/customerPayment.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { parsePagination } = require('../middleware/pagination.middleware');

const router = express.Router();
router.use(requireAuth);
router.get('/', requireRole('Admin', 'Manager'), parsePagination, controller.list);
router.post('/', requireRole('Admin', 'Manager'), controller.rules, controller.create);

module.exports = router;
