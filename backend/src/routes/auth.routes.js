const express = require('express');
const controller = require('../controllers/auth.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { parsePagination } = require('../middleware/pagination.middleware');

const router = express.Router();

router.post('/login', controller.loginRules, controller.login);
router.post('/logout', requireAuth, controller.logout);
router.get('/session', controller.session);
router.post('/change-password', requireAuth, controller.changePasswordRules, controller.changePassword);
router.post('/create-worker-user', requireAuth, requireRole('Admin'), controller.createWorkerUserRules, controller.createWorkerUser);
router.post('/create-user', requireAuth, requireRole('Admin'), controller.createUserRules, controller.createUser);
router.get('/users', requireAuth, requireRole('Admin'), parsePagination, controller.listUsers);
router.post('/forgot-password', controller.forgotPasswordRules, controller.forgotPassword);
router.post('/verify-otp', controller.verifyOTPRules, controller.verifyOTP);
router.post('/reset-password', controller.resetPasswordRules, controller.resetPassword);
router.post('/2fa/setup', requireAuth, controller.setup2FA);
router.post('/2fa/enable', requireAuth, controller.enable2FARules, controller.enable2FA);
router.post('/2fa/disable', requireAuth, controller.disable2FA);
router.post('/2fa/verify', requireAuth, controller.verify2FARules, controller.verify2FA);

module.exports = router;
