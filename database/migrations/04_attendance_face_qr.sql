-- ==========================================
-- Migration 04: AI Face Recognition & Dynamic QR Code Verification
-- ==========================================

-- 1. Create table face_profiles
CREATE TABLE IF NOT EXISTS face_profiles (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    face_embedding JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create table qr_sessions
CREATE TABLE IF NOT EXISTS qr_sessions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Update attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS qr_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS face_confidence DOUBLE PRECISION;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS qr_session_id INTEGER REFERENCES qr_sessions(id) ON DELETE SET NULL;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS device_information TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 4. Create indices for faster searches
CREATE INDEX IF NOT EXISTS idx_face_profiles_employee ON face_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_token ON qr_sessions(token);
