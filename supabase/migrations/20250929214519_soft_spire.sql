/*
  # Fix providers table INSERT policy

  1. Security
    - Drop existing conflicting INSERT policies
    - Create new INSERT policy allowing authenticated users to insert their own records
    - Ensure RLS is enabled on providers table

  This fixes the "new row violates row-level security policy" error during signup.
*/

-- Drop any existing INSERT policies that might conflict
DROP POLICY IF EXISTS "Users can insert own provider data" ON providers;
DROP POLICY IF EXISTS "authenticated_users_can_insert_providers" ON providers;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own provider profile" ON providers;

-- Ensure RLS is enabled
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Create the correct INSERT policy
CREATE POLICY "Allow authenticated users to insert their own provider profile"
  ON providers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);