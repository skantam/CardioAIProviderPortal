/*
  # Fix providers table RLS policies

  1. Security
    - Add INSERT policy for authenticated users to create their own provider records
    - Add SELECT policy for authenticated users to read their own provider data
    - Add UPDATE policy for authenticated users to update their own provider data
*/

-- Enable RLS on providers table (if not already enabled)
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own provider data" ON providers;
DROP POLICY IF EXISTS "Users can read own provider data" ON providers;
DROP POLICY IF EXISTS "Users can update own provider data" ON providers;

-- Allow authenticated users to insert their own provider records
CREATE POLICY "Users can insert own provider data"
  ON providers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own provider data
CREATE POLICY "Users can read own provider data"
  ON providers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to update their own provider data
CREATE POLICY "Users can update own provider data"
  ON providers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);