-- ==========================================
-- Migration 05: Face Identity Management Lifecycle & Audit Logs
-- ==========================================

-- 1. Drop existing face_profiles if they exist to start with a clean slate
DROP TABLE IF EXISTS face_profiles CASCADE;

-- 2. Create face_profiles table
CREATE TABLE face_profiles (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    face_embeddings JSONB NOT NULL,
    face_quality_score DOUBLE PRECISION,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled'))
);

-- 3. Create face_security_logs table
CREATE TABLE face_security_logs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- REGISTER, VERIFY, UPDATE
    result VARCHAR(50) NOT NULL, -- SUCCESS, FAILED
    confidence DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes for performance optimization
CREATE INDEX idx_face_profiles_employee_id ON face_profiles(employee_id);
CREATE INDEX idx_face_security_logs_employee_id ON face_security_logs(employee_id);
