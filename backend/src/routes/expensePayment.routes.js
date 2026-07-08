const express = require('express');
const router = express.Router();
const { rules, list, create, update, remove } = require('../controllers/expensePayment.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/expenses/:expenseId/payments', authenticate, list);
router.post('/expenses/:expenseId/payments', authenticate, validateRequest(rules), create);
router.put('/expenses/:expenseId/payments/:id', authenticate, validateRequest(rules), update);
router.delete('/expenses/:expenseId/payments/:id', authenticate, remove);

module.exports = router;
