-- Add account lockout columns to Users table
ALTER TABLE dbo.Users
ADD failed_attempts INT DEFAULT 0,
    lockout_until DATETIME NULL;
