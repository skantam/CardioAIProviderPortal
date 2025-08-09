/*
  # Add created_at column to assessments table

  1. Schema Changes
    - Add `created_at` column to assessments table with timestamp type
    - Set default value to current timestamp
    - Update existing records to have a created_at value based on timestamp column
*/

-- Add created_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE assessments ADD COLUMN created_at timestamptz DEFAULT now();
    
    -- Update existing records to use timestamp column value if available
    UPDATE assessments 
    SET created_at = timestamp 
    WHERE created_at IS NULL AND timestamp IS NOT NULL;
    
    -- For records without timestamp, set to current time
    UPDATE assessments 
    SET created_at = now() 
    WHERE created_at IS NULL;
  END IF;
END $$;