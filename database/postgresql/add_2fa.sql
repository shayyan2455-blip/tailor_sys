-- PostgreSQL version of add_2fa.sql
-- Add Two-Factor Authentication columns to Users table
ALTER TABLE Users
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN two_factor_secret VARCHAR(255) NULL;
