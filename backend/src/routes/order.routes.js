const express = require('express');
const controller = require('../controllers/order.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { parsePagination } = require('../middleware/pagination.middleware');
const { auditMiddleware } = require('../utils/auditLogger');

const router = express.Router();
router.use(requireAuth);
router.get('/', requireRole('Admin', 'Manager'), parsePagination, controller.list);
router.get('/delivery', requireRole('Admin', 'Manager'), parsePagination, controller.deliveryList);
router.get('/:id', requireRole('Admin', 'Manager'), controller.detail);
router.post('/new', requireRole('Admin', 'Manager'), auditMiddleware('Order'), controller.rules, controller.create);
router.put('/:id', requireRole('Admin', 'Manager'), auditMiddleware('Order'), controller.rules, controller.update);

module.exports = router;
