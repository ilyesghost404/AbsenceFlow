-- ==========================================
-- Migration: Add 'source' column to absences table
-- Distinguishes employee-submitted requests from automatic/system-generated absences
-- ==========================================

-- Step 1: Add the source column with default 'employee_request'
ALTER TABLE absences
ADD COLUMN IF NOT EXISTS source VARCHAR(30) DEFAULT 'employee_request' NOT NULL;

-- Step 2: Add CHECK constraint for valid source values
ALTER TABLE absences
ADD CONSTRAINT valid_absence_source
CHECK (source IN ('employee_request', 'automatic'));

-- Step 3: Backfill existing automatic records
-- The scheduler creates absences with reason 'Automatic absence - no check-in detected'
UPDATE absences
SET source = 'automatic'
WHERE reason ILIKE '%Automatic absence%';

-- Step 4: Create index for fast filtering by source
CREATE INDEX IF NOT EXISTS idx_absences_source ON absences(source);
