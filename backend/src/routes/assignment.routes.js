const express = require('express');
const controller = require('../controllers/assignment.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(requireAuth, requireRole('Admin', 'Manager'));
router.get('/', controller.list);
router.post('/', controller.rules, controller.create);
router.delete('/:id', controller.remove);

module.exports = router;
