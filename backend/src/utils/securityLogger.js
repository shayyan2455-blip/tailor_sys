const fs = require('fs');
const path = require('path');

// Use /tmp directory for serverless environments (Vercel)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const logDir = isServerless ? '/tmp/logs' : path.join(__dirname, '../../logs');
const logFile = path.join(logDir, 'security.log');

// Ensure log directory exists
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  console.warn('Failed to create log directory, file logging disabled:', err.message);
}

function logSecurityEvent(event, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    ...details
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  // Try to write to file, but don't fail if it doesn't work
  try {
    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error('Failed to write security log:', err);
      }
    });
  } catch (err) {
    // File logging failed, just log to console
  }

  // Also log to console in development or serverless
  if (process.env.NODE_ENV !== 'production' || isServerless) {
    console.log('[SECURITY]', event, details);
  }
}

module.exports = {
  logSecurityEvent
};
