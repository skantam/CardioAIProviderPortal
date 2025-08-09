/*
  # Rename timestamp column to assessment_timestamp

  1. Changes
    - Rename `timestamp` column to `assessment_timestamp` in assessments table
    - Update any indexes or constraints that reference the old column name

  2. Notes
    - Uses IF EXISTS checks to prevent errors if column doesn't exist
    - Preserves all existing data and constraints
*/

DO $$
BEGIN
  -- Check if timestamp column exists and assessment_timestamp doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' AND column_name = 'timestamp'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' AND column_name = 'assessment_timestamp'
  ) THEN
    -- Rename the column
    ALTER TABLE assessments RENAME COLUMN timestamp TO assessment_timestamp;
  END IF;
END $$;