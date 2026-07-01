USE TailorERP;
GO
-- Add password expiration columns to Users table
ALTER TABLE dbo.Users
ADD password_expires_at DATETIME NULL,
    password_changed_at DATETIME NULL;
