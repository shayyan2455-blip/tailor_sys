const express = require('express');
const controller = require('../controllers/report.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { parsePagination } = require('../middleware/pagination.middleware');

const router = express.Router();
router.use(requireAuth);
router.get('/pending-orders', requireRole('Admin', 'Manager'), parsePagination, controller.pendingOrders);
router.get('/ready-orders', requireRole('Admin', 'Manager'), parsePagination, controller.readyOrders);
router.get('/delivered-orders', requireRole('Admin', 'Manager'), parsePagination, controller.deliveredOrders);
router.get('/recovery', requireRole('Admin', 'Manager'), parsePagination, controller.recovery);
router.get('/worker-ledger', requireRole('Admin', 'Manager'), parsePagination, controller.workerLedger);
router.get('/profit', requireRole('Admin'), controller.profit);
router.get('/dashboard-stats', requireRole('Admin', 'Manager'), controller.dashboardStats);

module.exports = router;
