-- PostgreSQL version of add_password_expiration.sql
-- Add password expiration columns to Users table
ALTER TABLE Users
ADD COLUMN password_expires_at TIMESTAMP NULL,
ADD COLUMN password_changed_at TIMESTAMP NULL;
