USE TailorERP;
GO
-- Create OTP table for password reset
CREATE TABLE dbo.PasswordResetOTP (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(80) NOT NULL,
    otp NVARCHAR(8) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BIT DEFAULT 0,
    created_at DATETIME DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_PasswordResetOTP_Users FOREIGN KEY (username) REFERENCES dbo.Users(username) ON DELETE CASCADE
);

-- Add index for faster lookups
CREATE INDEX IX_PasswordResetOTP_username ON dbo.PasswordResetOTP(username);
CREATE INDEX IX_PasswordResetOTP_expires_at ON dbo.PasswordResetOTP(expires_at);
