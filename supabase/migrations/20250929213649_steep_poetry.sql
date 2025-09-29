/*
  # Fix providers table RLS INSERT policy

  1. Security
    - Drop existing conflicting INSERT policies
    - Create proper INSERT policy for authenticated users
    - Ensure users can only insert their own provider records
*/

-- Drop any existing INSERT policies that might be conflicting
DROP POLICY IF EXISTS "Users can insert own provider data" ON providers;
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_records" ON providers;
DROP POLICY IF EXISTS "service_role_can_insert" ON providers;

-- Create a single, clear INSERT policy for authenticated users
CREATE POLICY "authenticated_users_can_insert_providers"
  ON providers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;