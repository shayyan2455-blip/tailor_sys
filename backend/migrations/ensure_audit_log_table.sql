-- Ensure AuditLog table exists
CREATE TABLE IF NOT EXISTS AuditLog (
    id SERIAL PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(80) NULL,
    action VARCHAR(100) NULL,
    entity_type VARCHAR(50) NULL,
    entity_id INT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT FK_AuditLog_user FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_AuditLog_user_id ON AuditLog(user_id);
CREATE INDEX IF NOT EXISTS IX_AuditLog_entity ON AuditLog(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS IX_AuditLog_created_at ON AuditLog(created_at);
