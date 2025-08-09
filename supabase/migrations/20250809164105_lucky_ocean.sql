/*
  # Rename timestamp column to assessment_timestamp

  1. Column Rename
    - Rename `timestamp` column to `assessment_timestamp` in assessments table
    - Update any indexes or constraints that reference the old column name

  2. Safety Checks
    - Check if column exists before renaming
    - Handle case where rename has already been done
*/

DO $$
BEGIN
  -- Check if timestamp column exists and assessment_timestamp doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' 
    AND column_name = 'timestamp'
    AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' 
    AND column_name = 'assessment_timestamp'
    AND table_schema = 'public'
  ) THEN
    -- Rename the column
    ALTER TABLE assessments RENAME COLUMN timestamp TO assessment_timestamp;
    
    RAISE NOTICE 'Successfully renamed timestamp column to assessment_timestamp';
  ELSE
    RAISE NOTICE 'Column rename not needed - either timestamp does not exist or assessment_timestamp already exists';
  END IF;
END $$;