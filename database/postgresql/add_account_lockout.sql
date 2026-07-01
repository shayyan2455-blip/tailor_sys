-- PostgreSQL version of add_account_lockout.sql
-- Add account lockout columns to Users table
ALTER TABLE Users
ADD COLUMN failed_attempts INT DEFAULT 0,
ADD COLUMN lockout_until TIMESTAMP NULL;
