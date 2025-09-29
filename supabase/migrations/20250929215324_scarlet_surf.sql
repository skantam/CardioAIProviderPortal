/*
  # Fix providers table RLS policies for signup

  1. Security
    - Drop all existing policies to avoid conflicts
    - Create simple, clear policies for authenticated users
    - Ensure RLS is enabled
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "providers_insert_policy" ON providers;
DROP POLICY IF EXISTS "providers_select_policy" ON providers;
DROP POLICY IF EXISTS "providers_update_policy" ON providers;
DROP POLICY IF EXISTS "providers_authenticated_insert" ON providers;
DROP POLICY IF EXISTS "Users can insert own provider data" ON providers;
DROP POLICY IF EXISTS "Users can read own provider data" ON providers;
DROP POLICY IF EXISTS "Users can update own provider data" ON providers;

-- Ensure RLS is enabled
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Create simple, clear policies
CREATE POLICY "Allow authenticated users to insert their own provider record"
  ON providers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to read their own provider record"
  ON providers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update their own provider record"
  ON providers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);