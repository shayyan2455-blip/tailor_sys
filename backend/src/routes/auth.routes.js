const express = require('express');
const controller = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', controller.loginRules, controller.login);
router.post('/logout', requireAuth, controller.logout);
router.get('/session', controller.session);
router.post('/change-password', requireAuth, controller.changePasswordRules, controller.changePassword);

module.exports = router;
