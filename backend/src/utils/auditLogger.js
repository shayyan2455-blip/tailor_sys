const { query } = require('../config/db');

/**
 * Log an audit event
 */
async function logAuditEvent(req, action, entityType = null, entityId = null, oldValue = null, newValue = null) {
  try {
    const userId = req.session?.user?.id || null;
    const username = req.session?.user?.username || null;
    const ipAddress = req.ip || req.connection.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await query(req, `
      INSERT INTO AuditLog (user_id, username, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW());
    `, [
      userId,
      username,
      action,
      entityType,
      entityId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      ipAddress,
      userAgent
    ]);
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw error to avoid breaking application flow
  }
}

/**
 * Audit middleware factory
 * Automatically logs create, update, delete operations
 */
function auditMiddleware(entityType) {
  return async (req, res, next) => {
    // Store original json and status methods
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    let action = null;
    let entityId = null;
    let oldValue = null;
    let newValue = null;

    // Determine action based on method
    if (req.method === 'POST') {
      action = 'CREATE';
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      action = 'UPDATE';
    } else if (req.method === 'DELETE') {
      action = 'DELETE';
    }

    // Override json to capture response data
    res.json = function(data) {
      if (action && data) {
        newValue = data.data || data;
        if (newValue && newValue.id) {
          entityId = newValue.id;
        }
        
        // Log audit event
        logAuditEvent(req, action, entityType, entityId, oldValue, newValue);
      }
      return originalJson(data);
    };

    next();
  };
}

module.exports = {
  logAuditEvent,
  auditMiddleware
};
