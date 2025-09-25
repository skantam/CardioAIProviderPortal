/*
  # Add country column to providers table

  1. Changes
    - Add `country` column to `providers` table
    - Set default value to empty string for existing records
    - Make column NOT NULL with default value

  2. Security
    - No RLS changes needed as existing policies cover the new column
*/

-- Add country column to providers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'country'
  ) THEN
    ALTER TABLE providers ADD COLUMN country text NOT NULL DEFAULT '';
  END IF;
END $$;