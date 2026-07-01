-- PostgreSQL version of add_audit_log.sql
-- Create AuditLog table for comprehensive audit logging
CREATE TABLE AuditLog (
  id SERIAL PRIMARY KEY,
  user_id INT NULL,
  username VARCHAR(80) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id INT NULL,
  old_value TEXT NULL,
  new_value TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IX_AuditLog_user_id ON AuditLog(user_id);
CREATE INDEX IX_AuditLog_action ON AuditLog(action);
CREATE INDEX IX_AuditLog_entity_type ON AuditLog(entity_type);
CREATE INDEX IX_AuditLog_created_at ON AuditLog(created_at);
