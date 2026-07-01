const express = require('express');
const controller = require('../controllers/workerPayment.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { parsePagination } = require('../middleware/pagination.middleware');
const { auditMiddleware } = require('../utils/auditLogger');

const router = express.Router();

router.get('/', requireAuth, parsePagination, controller.list);
router.get('/balance', requireAuth, controller.workerBalance);
router.post('/', requireAuth, requireRole('Admin', 'Manager'), auditMiddleware('WorkerPayment'), controller.rules, controller.create);
router.delete('/:id', requireAuth, requireRole('Admin', 'Manager'), auditMiddleware('WorkerPayment'), controller.remove);

module.exports = router;
