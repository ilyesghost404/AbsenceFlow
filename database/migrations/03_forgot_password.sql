-- ==========================================
-- Migration: Add Forgot Password OTP fields to users table
-- ==========================================

-- Add columns for storing reset code, its expiry timestamp, and verification status
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_code_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_verified BOOLEAN DEFAULT FALSE;
