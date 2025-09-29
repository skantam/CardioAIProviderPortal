/*
  # Fix signup RLS policies for providers table

  1. Security
    - Drop existing conflicting policies
    - Create proper INSERT policy for authenticated users
    - Create proper INSERT policy for service role (for signup flow)
    - Ensure RLS is enabled

  This migration ensures that signup works correctly by allowing both authenticated users
  and the service role to insert provider records during the signup process.
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Enable insert for authenticated users own records" ON providers;
DROP POLICY IF EXISTS "Users can insert own provider records" ON providers;
DROP POLICY IF EXISTS "Allow authenticated users to insert own records" ON providers;

-- Ensure RLS is enabled
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to insert their own records
CREATE POLICY "authenticated_users_can_insert_own_records"
  ON providers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for service role (needed during signup process)
CREATE POLICY "service_role_can_insert"
  ON providers
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Ensure existing SELECT and UPDATE policies work correctly
DROP POLICY IF EXISTS "Providers can read own data" ON providers;
DROP POLICY IF EXISTS "Providers can update own data" ON providers;

CREATE POLICY "providers_can_read_own_data"
  ON providers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "providers_can_update_own_data"
  ON providers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);