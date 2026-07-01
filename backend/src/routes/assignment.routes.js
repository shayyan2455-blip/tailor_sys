const express = require('express');
const controller = require('../controllers/assignment.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { parsePagination } = require('../middleware/pagination.middleware');
const { auditMiddleware } = require('../utils/auditLogger');

const router = express.Router();
router.use(requireAuth, requireRole('Admin', 'Manager'));
router.get('/', parsePagination, controller.list);
router.post('/', auditMiddleware('Assignment'), controller.rules, controller.create);
router.delete('/:id', auditMiddleware('Assignment'), controller.remove);

module.exports = router;
