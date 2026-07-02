-- Ensure PasswordResetOTP table exists for forgot password functionality
-- Run this in Supabase SQL Editor

-- Create PasswordResetOTP table if it doesn't exist
CREATE TABLE IF NOT EXISTS PasswordResetOTP (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL,
    otp VARCHAR(8) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT FK_PasswordResetOTP_Users FOREIGN KEY (username) REFERENCES Users(username) ON DELETE CASCADE
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS IX_PasswordResetOTP_username ON PasswordResetOTP(username);
CREATE INDEX IF NOT EXISTS IX_PasswordResetOTP_expires_at ON PasswordResetOTP(expires_at);
