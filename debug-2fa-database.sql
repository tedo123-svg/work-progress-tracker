-- Debug 2FA Database Schema
-- Run this in Supabase SQL Editor to check if 2FA fields exist

-- Check if 2FA columns exist in users table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('two_factor_enabled', 'verification_code', 'verification_code_expires', 'last_login')
ORDER BY column_name;

-- Check if verification_attempts table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'verification_attempts'
);

-- If the above returns no rows, run this to add the missing fields:
/*
-- Add 2FA fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Create verification attempts table to prevent brute force
CREATE TABLE IF NOT EXISTS verification_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    attempts INTEGER DEFAULT 1,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_until TIMESTAMP,
    UNIQUE(user_id, ip_address)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_attempts_user_ip ON verification_attempts(user_id, ip_address);
CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verification_code);
*/

-- Check current users and their email addresses
SELECT id, username, email, role, branch_name FROM users ORDER BY username;