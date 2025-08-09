/*
  # Add license number to providers table

  1. Changes
    - Add `license_number` column to `providers` table
    - Column is required (NOT NULL) for new provider registrations
    - Alphanumeric validation will be handled at application level

  2. Security
    - No changes to RLS policies needed
    - Existing policies will cover the new column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'license_number'
  ) THEN
    ALTER TABLE providers ADD COLUMN license_number text NOT NULL DEFAULT '';
  END IF;
END $$;