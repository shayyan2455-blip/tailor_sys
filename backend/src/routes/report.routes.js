const express = require('express');
const controller = require('../controllers/report.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(requireAuth);
router.get('/pending-orders', requireRole('Admin', 'Manager'), controller.pendingOrders);
router.get('/ready-orders', requireRole('Admin', 'Manager'), controller.readyOrders);
router.get('/delivered-orders', requireRole('Admin', 'Manager'), controller.deliveredOrders);
router.get('/recovery', requireRole('Admin', 'Manager'), controller.recovery);
router.get('/worker-ledger', requireRole('Admin', 'Manager'), controller.workerLedger);
router.get('/profit', requireRole('Admin'), controller.profit);

module.exports = router;
