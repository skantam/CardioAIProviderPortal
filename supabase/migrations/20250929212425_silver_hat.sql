/*
  # Fix providers table INSERT policy

  1. Security Changes
    - Drop existing INSERT policy that may be conflicting
    - Create new INSERT policy allowing authenticated users to insert their own provider records
    - Ensure the policy uses auth.uid() = user_id for proper authorization

  This resolves the RLS violation error during signup when creating provider records.
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Authenticated users can insert own provider data" ON providers;
DROP POLICY IF EXISTS "Users can insert own provider data" ON providers;

-- Create a new INSERT policy that allows authenticated users to insert their own provider records
CREATE POLICY "Allow authenticated users to insert own provider data"
  ON providers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);