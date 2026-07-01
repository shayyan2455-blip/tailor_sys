USE TailorERP;
GO

-- Reset admin password to 'admin123'
-- This hash was generated using bcrypt with 10 salt rounds
UPDATE dbo.Users
SET password_hash = '$2b$10$ZXFdeMzdspkvKHl1CHI7qOxyk3vIP2kVfBlmqc.o6/HDvPmSfbMKq'
WHERE username = N'admin';
GO

-- Verify the update
SELECT username, role, is_active
FROM dbo.Users
WHERE username = N'admin';
GO
