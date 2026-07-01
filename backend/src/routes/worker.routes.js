const express = require('express');
const controller = require('../controllers/worker.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { parsePagination } = require('../middleware/pagination.middleware');
const { auditMiddleware } = require('../utils/auditLogger');

const router = express.Router();
router.use(requireAuth, requireRole('Admin', 'Manager'));
router.get('/', parsePagination, controller.list);
router.get('/:id', controller.get);
router.post('/', auditMiddleware('Worker'), controller.rules, controller.create);
router.put('/:id', auditMiddleware('Worker'), controller.rules, controller.update);
router.delete('/:id', auditMiddleware('Worker'), controller.remove);

module.exports = router;
