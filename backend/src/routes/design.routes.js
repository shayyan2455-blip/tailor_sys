const express = require('express');
const controller = require('../controllers/design.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { parsePagination } = require('../middleware/pagination.middleware');
const { auditMiddleware } = require('../utils/auditLogger');

const router = express.Router();
router.use(requireAuth, requireRole('Admin', 'Manager'));
router.get('/', parsePagination, controller.list);
router.post('/', auditMiddleware('Design'), controller.rules, controller.create);
router.put('/:id', auditMiddleware('Design'), controller.rules, controller.update);
router.delete('/:id', auditMiddleware('Design'), controller.remove);

module.exports = router;
