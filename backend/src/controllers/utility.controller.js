const path = require('path');
const { pg, query } = require('../config/db');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const backup = asyncHandler(async (req, res) => {
  // Supabase handles automatic backups. This endpoint is disabled for PostgreSQL/Supabase.
  throw httpError(501, 'Database backup is handled automatically by Supabase. Manual backups are not supported.');
});

const settings = asyncHandler(async (_req, res) => {
  res.json({
    data: {
      dbName: env.DB_NAME,
      backupDirectory: env.BACKUP_DIRECTORY,
      cookieSecure: env.COOKIE_SECURE,
      corsOrigin: env.CORS_ORIGIN
    }
  });
});

const updateSettings = asyncHandler(async (req, res) => {
  if (req.body && Object.keys(req.body).length > 0) {
    throw httpError(400, 'Runtime settings are read-only. Update environment variables and restart the API.');
  }
  res.json({ data: { ok: true } });
});

module.exports = {
  backup,
  settings,
  updateSettings
};
