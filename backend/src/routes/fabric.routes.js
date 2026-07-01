const express = require('express');
const controller = require('../controllers/fabric.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { parsePagination } = require('../middleware/pagination.middleware');
const { auditMiddleware } = require('../utils/auditLogger');

const router = express.Router();
router.use(requireAuth, requireRole('Admin', 'Manager'));
router.get('/', parsePagination, controller.list);
router.post('/', auditMiddleware('Fabric'), controller.rules, controller.create);
router.put('/:id', auditMiddleware('Fabric'), controller.rules, controller.update);
router.delete('/:id', auditMiddleware('Fabric'), controller.remove);

module.exports = router;
