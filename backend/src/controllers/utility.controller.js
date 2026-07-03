const path = require('path');
const { pg, query } = require('../config/db');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { createBackup } = require('../utils/backup');

// Backup functionality disabled for now - can be re-enabled in future
const backup = asyncHandler(async (req, res) => {
  throw httpError(503, 'Backup functionality is currently disabled. It can be re-enabled in the future when needed.');
  // Original backup code (commented out):
  // try {
  //   const backupFile = await createBackup();
  //   res.json({ data: { file: backupFile } });
  // } catch (error) {
  //   console.error('Backup error:', error);
  //   throw httpError(500, `Backup failed: ${error.message}`);
  // }
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
