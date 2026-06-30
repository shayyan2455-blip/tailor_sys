const path = require('path');
const { sql, query } = require('../config/db');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const backup = asyncHandler(async (req, res) => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const file = path.join(env.BACKUP_DIRECTORY, `${env.DB_NAME}_${stamp}.bak`);
  await query(req, `
    DECLARE @db sysname = DB_NAME();
    DECLARE @sql NVARCHAR(MAX) = N'BACKUP DATABASE ' + QUOTENAME(@db) + N' TO DISK = @file WITH INIT, COMPRESSION';
    EXEC sp_executesql @sql, N'@file NVARCHAR(4000)', @file = @backup_file;
  `, { backup_file: { type: sql.NVarChar(4000), value: file } });
  res.json({ data: { file } });
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
