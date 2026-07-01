const express = require('express');
const controller = require('../controllers/customer.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { parsePagination } = require('../middleware/pagination.middleware');
const { auditMiddleware } = require('../utils/auditLogger');

const router = express.Router();
router.use(requireAuth, requireRole('Admin', 'Manager'));
router.get('/', parsePagination, controller.list);
router.get('/:id', controller.get);
router.post('/', auditMiddleware('Customer'), controller.rules, controller.create);
router.put('/:id', auditMiddleware('Customer'), controller.rules, controller.update);
router.delete('/:id', auditMiddleware('Customer'), controller.remove);

module.exports = router;
