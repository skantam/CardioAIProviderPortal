/*
  # Fix providers table RLS policies with debugging

  1. Security
    - Drop all existing policies to start fresh
    - Enable RLS on providers table
    - Create INSERT policy for authenticated users
    - Create SELECT and UPDATE policies for user's own data
    - Add temporary policy to allow debugging
*/

-- Enable RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "providers_authenticated_insert" ON providers;
DROP POLICY IF EXISTS "providers_authenticated_select" ON providers;
DROP POLICY IF EXISTS "providers_authenticated_update" ON providers;
DROP POLICY IF EXISTS "providers_can_read_own_data" ON providers;
DROP POLICY IF EXISTS "providers_can_update_own_data" ON providers;
DROP POLICY IF EXISTS "Users can read own provider data" ON providers;
DROP POLICY IF EXISTS "Users can update own provider data" ON providers;

-- Create INSERT policy for authenticated users
CREATE POLICY "providers_insert_policy"
  ON providers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create SELECT policy for authenticated users to read their own data
CREATE POLICY "providers_select_policy"
  ON providers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create UPDATE policy for authenticated users to update their own data
CREATE POLICY "providers_update_policy"
  ON providers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);