const { body, validationResult } = require('express-validator');
const { pg, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { comparePassword, hashPassword } = require('../utils/password');
const { generateOTP, sendOTP } = require('../services/emailService');
const { logSecurityEvent } = require('../utils/securityLogger');
const { generateSecret, generateQRCode, verifyToken } = require('../utils/twoFactorAuth');
const env = require('../config/env');

const loginRules = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required')
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character')
];

function throwIfInvalid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const login = asyncHandler(async (req, res) => {
  if (env.NODE_ENV !== 'production') {
    console.log('Login attempt for username:', req.body.username);
  }
  throwIfInvalid(req);
  
  const username = req.body.username;
  const ip = req.ip || req.connection.remoteAddress;
  
  // Check if account is locked
  const lockoutResult = await query(req, `
    SELECT failed_attempts, lockout_until
    FROM Users
    WHERE username = $1;
  `, { username });
  
  const userRecord = lockoutResult.rows[0];
  if (userRecord && userRecord.lockout_until && new Date(userRecord.lockout_until) > new Date()) {
    logSecurityEvent('LOGIN_ATTEMPT_LOCKED', { username, ip });
    throw httpError(429, 'Account is temporarily locked due to too many failed login attempts. Please try again later.');
  }

  const result = await query(req, `
    SELECT id, username, password_hash, role, worker_id, failed_attempts, password_expires_at
    FROM Users
    WHERE username = $1 AND is_active = true
    LIMIT 1;
  `, { username });

  const user = result.rows[0];
  
  // Check if password is expired
  if (user && user.password_expires_at && new Date(user.password_expires_at) < new Date()) {
    logSecurityEvent('LOGIN_PASSWORD_EXPIRED', { username, ip });
    throw httpError(403, 'Password has expired. Please reset your password.');
  }
  
  if (!user || !(await comparePassword(req.body.password, user.password_hash))) {
    // Increment failed attempts
    const failedAttempts = (user?.failed_attempts || 0) + 1;
    const lockoutUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Lock for 15 minutes after 5 failed attempts
    
    await query(req, `
      UPDATE Users
      SET failed_attempts = $1, lockout_until = $2
      WHERE username = $3;
    `, { failedAttempts, lockoutUntil, username });

    if (env.NODE_ENV !== 'production') {
      console.log('Login failed: Invalid credentials');
    }
    
    logSecurityEvent('LOGIN_FAILED', { username, ip, failedAttempts, locked: !!lockoutUntil });
    throw httpError(401, 'Invalid username or password');
  }

  // Reset failed attempts on successful login
  await query(req, `
    UPDATE Users
    SET failed_attempts = 0, lockout_until = NULL
    WHERE id = $1;
  `, { id: user.id });

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    workerId: user.worker_id
  };

  req.session.save((error) => {
    if (error) {
      if (env.NODE_ENV !== 'production') {
        console.error('Session save error:', error);
      }
      throw error;
    }
    if (env.NODE_ENV !== 'production') {
      console.log('Session saved successfully, user:', req.session.user);
    }
    logSecurityEvent('LOGIN_SUCCESS', { userId: user.id, username, ip, role: user.role });
    res.json({ data: { user: req.session.user } });
  });
});

const logout = asyncHandler(async (req, res) => {
  req.session.destroy((error) => {
    if (error) throw error;
    res.clearCookie(req.app.locals.cookieName);
    res.json({ data: { ok: true } });
  });
});

const session = asyncHandler(async (req, res) => {
  res.json({ data: { user: req.session?.user || null } });
});

const changePassword = asyncHandler(async (req, res) => {
  throwIfInvalid(req);
  const userId = req.session.user.id;
  const result = await query(req, `
    SELECT id, password_hash
    FROM Users
    WHERE id = $1 AND is_active = true;
  `, { id: userId });
  const user = result.rows[0];
  if (!user || !(await comparePassword(req.body.currentPassword, user.password_hash))) {
    throw httpError(400, 'Current password is incorrect');
  }

  const passwordHash = await hashPassword(req.body.newPassword);
  const passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
  
  await query(req, `
    UPDATE Users 
    SET password_hash = $1, 
        password_changed_at = NOW(),
        password_expires_at = $2
    WHERE id = $3;
  `, { passwordHash, passwordExpiresAt, id: userId });

  logSecurityEvent('PASSWORD_CHANGED', { userId });
  res.json({ data: { ok: true } });
});

const createWorkerUserRules = [
  body('worker_id').isInt().withMessage('Worker ID is required'),
  body('username').trim().isEmail().withMessage('Username must be a valid email address').isLength({ max: 80 }),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character')
];

const createWorkerUser = asyncHandler(async (req, res) => {
  throwIfInvalid(req);
  const { worker_id, username, password } = req.body;

  // Check if worker exists
  const workerResult = await query(req, 'SELECT id FROM Workers WHERE id = $1;', { id: worker_id });
  if (!workerResult.rows[0]) {
    throw httpError(404, 'Worker not found');
  }

  // Check if username already exists
  const existingUser = await query(req, 'SELECT id FROM Users WHERE username = $1;', { username });
  if (existingUser.rows[0]) {
    throw httpError(400, 'Username already exists');
  }

  const passwordHash = await hashPassword(password);
  const passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
  
  const result = await query(req, `
    INSERT INTO Users(username, password_hash, role, worker_id, is_active, password_expires_at, password_changed_at)
    VALUES ($1, $2, 'Worker', $3, true, $4, NOW())
    RETURNING id, username, role, worker_id;
  `, { username, passwordHash, worker_id, passwordExpiresAt });

  res.status(201).json({ data: result.rows[0] });
});

const createUserRules = [
  body('username').trim().isEmail().withMessage('Username must be a valid email address').isLength({ max: 80 }),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character'),
  body('role').isIn(['Admin', 'Manager']).withMessage('Role must be Admin or Manager')
];

const forgotPasswordRules = [
  body('username').trim().isEmail().withMessage('Username must be a valid email address')
];

const verifyOTPRules = [
  body('username').trim().isEmail().withMessage('Username must be a valid email address'),
  body('otp').trim().isLength({ min: 8, max: 8 }).withMessage('OTP must be 8 digits')
];

const resetPasswordRules = [
  body('username').trim().isEmail().withMessage('Username must be a valid email address'),
  body('otp').trim().isLength({ min: 8, max: 8 }).withMessage('OTP must be 8 digits'),
  body('newPassword')
    .isLength({ min: 8, max: 128 }).withMessage('New password must be 8-128 characters')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character')
];

const enable2FARules = [
  body('token').trim().isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
];

const verify2FARules = [
  body('token').trim().isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
];

const createUser = asyncHandler(async (req, res) => {
  throwIfInvalid(req);
  const { username, password, role } = req.body;

  // Check if username already exists
  const existingUser = await query(req, 'SELECT id FROM Users WHERE username = $1;', { username });
  if (existingUser.rows[0]) {
    throw httpError(400, 'Username already exists');
  }

  const passwordHash = await hashPassword(password);
  const passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
  
  const result = await query(req, `
    INSERT INTO Users(username, password_hash, role, is_active, password_expires_at, password_changed_at)
    VALUES ($1, $2, $3, true, $4, NOW())
    RETURNING id, username, role;
  `, { username, passwordHash, role, passwordExpiresAt });

  res.status(201).json({ data: result.rows[0] });
});

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = req.pagination;
  
  const result = await query(req, `
    SELECT id, username, role, is_active, created_at
    FROM Users
    ORDER BY created_at DESC
    OFFSET $1 LIMIT $2;
  `, { offset, limit });
  
  // Get total count
  const countResult = await query(req, 'SELECT COUNT(*) as total FROM Users;');
  const total = countResult.rows[0].total;
  
  res.json({ 
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  throwIfInvalid(req);
  const { username } = req.body;

  // Check if user exists
  const user = await query(req, 'SELECT id, username FROM Users WHERE username = $1 AND is_active = true;', { username });
  if (!user.rows[0]) {
    // For security, still return success even if user doesn't exist
    res.json({ data: { message: 'If the email exists, an OTP has been sent' } });
    return;
  }

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  // Store OTP in database
  await query(req, `
    INSERT INTO PasswordResetOTP(username, otp, expires_at)
    VALUES($1, $2, $3);
  `, { username, otp, expiresAt });

  // Send OTP email
  try {
    await sendOTP(username, otp);
  } catch (emailError) {
    console.error('Failed to send OTP email:', emailError);
    throw httpError(500, 'Failed to send OTP email');
  }

  res.json({ data: { message: 'OTP has been sent to your email' } });
});

const verifyOTP = asyncHandler(async (req, res) => {
  throwIfInvalid(req);
  const { username, otp } = req.body;

  // Check if OTP exists and is valid
  const result = await query(req, `
    SELECT id, expires_at, used
    FROM PasswordResetOTP
    WHERE username = $1 AND otp = $2
    ORDER BY created_at DESC;
  `, { username, otp });

  const otpRecord = result.rows[0];
  if (!otpRecord) {
    throw httpError(400, 'Invalid OTP');
  }

  if (otpRecord.used) {
    throw httpError(400, 'OTP has already been used');
  }

  if (new Date(otpRecord.expires_at) < new Date()) {
    throw httpError(400, 'OTP has expired');
  }

  res.json({ data: { message: 'OTP verified successfully' } });
});

const resetPassword = asyncHandler(async (req, res) => {
  throwIfInvalid(req);
  const { username, otp, newPassword } = req.body;

  // Verify OTP
  const result = await query(req, `
    SELECT id, expires_at, used
    FROM PasswordResetOTP
    WHERE username = $1 AND otp = $2
    ORDER BY created_at DESC;
  `, { username, otp });

  const otpRecord = result.rows[0];
  if (!otpRecord) {
    throw httpError(400, 'Invalid OTP');
  }

  if (otpRecord.used) {
    throw httpError(400, 'OTP has already been used');
  }

  if (new Date(otpRecord.expires_at) < new Date()) {
    throw httpError(400, 'OTP has expired');
  }

  // Mark OTP as used
  await query(req, `
    UPDATE PasswordResetOTP
    SET used = true
    WHERE id = $1;
  `, { id: otpRecord.id });

  // Update password
  const passwordHash = await hashPassword(newPassword);
  const passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
  
  await query(req, `
    UPDATE Users
    SET password_hash = $1,
        password_expires_at = $2,
        password_changed_at = NOW()
    WHERE username = $3;
  `, { passwordHash, passwordExpiresAt, username });

  res.json({ data: { message: 'Password reset successfully' } });
});

const setup2FA = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  
  // Generate secret
  const secret = generateSecret();
  
  // Store secret temporarily (not enabled yet)
  await query(req, `
    UPDATE Users
    SET two_factor_secret = $1
    WHERE id = $2;
  `, { secret: secret.base32, id: userId });
  
  // Generate QR code
  const qrCode = await generateQRCode(secret);
  
  res.json({ data: { secret: secret.base32, qrCode } });
});

const enable2FA = asyncHandler(async (req, res) => {
  throwIfInvalid(req);
  const userId = req.session.user.id;
  const { token } = req.body;
  
  // Get user's secret
  const result = await query(req, `
    SELECT two_factor_secret
    FROM Users
    WHERE id = $1;
  `, { id: userId });
  
  const user = result.rows[0];
  if (!user || !user.two_factor_secret) {
    throw httpError(400, '2FA not set up. Please setup 2FA first.');
  }
  
  // Verify token
  if (!verifyToken(token, user.two_factor_secret)) {
    throw httpError(400, 'Invalid token');
  }
  
  // Enable 2FA
  await query(req, `
    UPDATE Users
    SET two_factor_enabled = true
    WHERE id = $1;
  `, { id: userId });
  
  logSecurityEvent('2FA_ENABLED', { userId });
  res.json({ data: { message: '2FA enabled successfully' } });
});

const disable2FA = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  
  await query(req, `
    UPDATE Users
    SET two_factor_enabled = false, two_factor_secret = NULL
    WHERE id = $1;
  `, { id: userId });
  
  logSecurityEvent('2FA_DISABLED', { userId });
  res.json({ data: { message: '2FA disabled successfully' } });
});

const verify2FA = asyncHandler(async (req, res) => {
  throwIfInvalid(req);
  const { token } = req.body;
  const userId = req.session.user.id;
  
  // Get user's secret
  const result = await query(req, `
    SELECT two_factor_secret, two_factor_enabled
    FROM Users
    WHERE id = $1;
  `, { id: userId });
  
  const user = result.rows[0];
  if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
    throw httpError(400, '2FA not enabled for this account');
  }
  
  // Verify token
  if (!verifyToken(token, user.two_factor_secret)) {
    logSecurityEvent('2FA_VERIFICATION_FAILED', { userId });
    throw httpError(400, 'Invalid token');
  }
  
  // Mark 2FA as verified in session
  req.session.twoFactorVerified = true;
  req.session.save((error) => {
    if (error) throw error;
    res.json({ data: { message: '2FA verified successfully' } });
  });
});

module.exports = {
  loginRules,
  changePasswordRules,
  createWorkerUserRules,
  createUserRules,
  forgotPasswordRules,
  verifyOTPRules,
  resetPasswordRules,
  enable2FARules,
  verify2FARules,
  login,
  logout,
  session,
  changePassword,
  createWorkerUser,
  createUser,
  listUsers,
  forgotPassword,
  verifyOTP,
  resetPassword,
  setup2FA,
  enable2FA,
  disable2FA,
  verify2FA
};
