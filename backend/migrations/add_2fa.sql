USE TailorERP;
GO
-- Add Two-Factor Authentication columns to Users table
ALTER TABLE dbo.Users
ADD two_factor_enabled BIT DEFAULT 0,
    two_factor_secret NVARCHAR(255) NULL;
