USE TailorERP;
GO
-- Create AuditLog table for comprehensive audit logging
CREATE TABLE dbo.AuditLog (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NULL,
  username NVARCHAR(80) NULL,
  action NVARCHAR(100) NOT NULL,
  entity_type NVARCHAR(50) NULL,
  entity_id INT NULL,
  old_value NVARCHAR(MAX) NULL,
  new_value NVARCHAR(MAX) NULL,
  ip_address NVARCHAR(45) NULL,
  user_agent NVARCHAR(500) NULL,
  created_at DATETIME DEFAULT GETDATE(),
  INDEX IX_AuditLog_user_id (user_id),
  INDEX IX_AuditLog_action (action),
  INDEX IX_AuditLog_entity_type (entity_type),
  INDEX IX_AuditLog_created_at (created_at)
);
