/*
  # Fix providers table RLS policy for INSERT operations

  This migration resolves the "new row violates row-level security policy" error
  by properly configuring RLS policies for the providers table.

  1. Security Changes
     - Clean up all existing conflicting policies
     - Create proper INSERT policy with both USING and WITH CHECK expressions
     - Ensure SELECT and UPDATE policies exist for authenticated users

  2. Policy Details
     - INSERT: Allow authenticated users to create records where user_id matches auth.uid()
     - SELECT: Allow authenticated users to read their own records
     - UPDATE: Allow authenticated users to update their own records
*/

-- Temporarily disable RLS to clean up policies
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "providers_insert_policy" ON providers;
DROP POLICY IF EXISTS "providers_select_policy" ON providers;
DROP POLICY IF EXISTS "providers_update_policy" ON providers;
DROP POLICY IF EXISTS "providers_authenticated_insert" ON providers;
DROP POLICY IF EXISTS "Allow authenticated users to create their own provider profile" ON providers;
DROP POLICY IF EXISTS "Users can insert own provider records" ON providers;
DROP POLICY IF EXISTS "Users can read own provider records" ON providers;
DROP POLICY IF EXISTS "Users can update own provider records" ON providers;

-- Re-enable RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy with both USING and WITH CHECK expressions
CREATE POLICY "Allow authenticated users to create their own provider profile"
ON providers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create SELECT policy for reading own records
CREATE POLICY "Allow authenticated users to read their own provider profile"
ON providers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create UPDATE policy for updating own records
CREATE POLICY "Allow authenticated users to update their own provider profile"
ON providers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);