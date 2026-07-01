const express = require('express');
const controller = require('../controllers/expense.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { parsePagination } = require('../middleware/pagination.middleware');
const { auditMiddleware } = require('../utils/auditLogger');

const router = express.Router();
router.use(requireAuth, requireRole('Admin', 'Manager'));
router.get('/', parsePagination, controller.list);
router.post('/', auditMiddleware('Expense'), controller.rules, controller.create);
router.put('/:id', auditMiddleware('Expense'), controller.rules, controller.update);
router.delete('/:id', auditMiddleware('Expense'), controller.remove);

module.exports = router;
