const express = require('express');
const controller = require('../controllers/customerMeasurement.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/customer/:customer_id', requireAuth, controller.getByCustomer);
router.post('/', requireAuth, requireRole('Admin', 'Manager'), controller.rules, controller.upsert);

module.exports = router;
