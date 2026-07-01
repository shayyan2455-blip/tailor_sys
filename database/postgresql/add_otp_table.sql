-- PostgreSQL version of add_otp_table.sql
-- Create OTP table for password reset
CREATE TABLE PasswordResetOTP (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL,
    otp VARCHAR(8) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT FK_PasswordResetOTP_Users FOREIGN KEY (username) REFERENCES Users(username) ON DELETE CASCADE
);

-- Add index for faster lookups
CREATE INDEX IX_PasswordResetOTP_username ON PasswordResetOTP(username);
CREATE INDEX IX_PasswordResetOTP_expires_at ON PasswordResetOTP(expires_at);
