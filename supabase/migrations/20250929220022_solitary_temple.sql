/*
  # Fix providers table RLS policy for INSERT operations

  1. Security Changes
    - Drop all existing policies on providers table to avoid conflicts
    - Create new INSERT policy that allows authenticated users to insert their own records
    - Ensure SELECT and UPDATE policies exist for authenticated users
    - Enable RLS on providers table

  This migration fixes the "new row violates row-level security policy" error
  by properly configuring RLS policies for the providers table.
*/

-- Disable RLS temporarily to clean up policies
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to insert their own provider record" ON providers;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own provider record" ON providers;
DROP POLICY IF EXISTS "Users can insert own provider record" ON providers;
DROP POLICY IF EXISTS "providers_authenticated_insert" ON providers;
DROP POLICY IF EXISTS "Allow authenticated users to read their own provider record" ON providers;
DROP POLICY IF EXISTS "Allow authenticated users to update their own provider record" ON providers;

-- Re-enable RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy that allows any authenticated user to insert a record
-- where the user_id matches their auth.uid()
CREATE POLICY "providers_insert_policy" ON providers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create SELECT policy for authenticated users to read their own records
CREATE POLICY "providers_select_policy" ON providers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create UPDATE policy for authenticated users to update their own records
CREATE POLICY "providers_update_policy" ON providers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);