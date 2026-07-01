const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
const logFile = path.join(logDir, 'security.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function logSecurityEvent(event, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    ...details
  };

  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFile(logFile, logLine, (err) => {
    if (err) {
      console.error('Failed to write security log:', err);
    }
  });

  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SECURITY]', event, details);
  }
}

module.exports = {
  logSecurityEvent
};
