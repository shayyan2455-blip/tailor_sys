const { body, validationResult } = require('express-validator');
const { sql, query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { comparePassword, hashPassword } = require('../utils/password');

const loginRules = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required')
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

function throwIfInvalid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(422, 'Validation failed', errors.array());
}

const login = asyncHandler(async (req, res) => {
  throwIfInvalid(req);
  const result = await query(req, `
    SELECT TOP 1 id, username, password_hash, role, worker_id
    FROM dbo.Users
    WHERE username = @username AND is_active = 1;
  `, { username: { type: sql.NVarChar(80), value: req.body.username } });

  const user = result.recordset[0];
  if (!user || !(await comparePassword(req.body.password, user.password_hash))) {
    throw httpError(401, 'Invalid username or password');
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    workerId: user.worker_id
  };

  req.session.save((error) => {
    if (error) throw error;
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
    FROM dbo.Users
    WHERE id = @id AND is_active = 1;
  `, { id: { type: sql.Int, value: userId } });
  const user = result.recordset[0];
  if (!user || !(await comparePassword(req.body.currentPassword, user.password_hash))) {
    throw httpError(400, 'Current password is incorrect');
  }

  const passwordHash = await hashPassword(req.body.newPassword);
  await query(req, `
    UPDATE dbo.Users SET password_hash = @passwordHash WHERE id = @id;
  `, {
    id: { type: sql.Int, value: userId },
    passwordHash: { type: sql.NVarChar(255), value: passwordHash }
  });

  res.json({ data: { ok: true } });
});

module.exports = {
  loginRules,
  changePasswordRules,
  login,
  logout,
  session,
  changePassword
};
