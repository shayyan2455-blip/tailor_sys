const express = require('express');
const controller = require('../controllers/expensePayment.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { auditMiddleware } = require('../utils/auditLogger');

const router = express.Router();
router.use(requireAuth, requireRole('Admin', 'Manager'));
router.get('/expenses/:expenseId/payments', controller.list);
router.post('/expenses/:expenseId/payments', auditMiddleware('ExpensePayment'), controller.rules, controller.create);
router.put('/expenses/:expenseId/payments/:id', auditMiddleware('ExpensePayment'), controller.rules, controller.update);
router.delete('/expenses/:expenseId/payments/:id', auditMiddleware('ExpensePayment'), controller.remove);

module.exports = router;
