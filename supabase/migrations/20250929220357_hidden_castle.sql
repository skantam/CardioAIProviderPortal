/*
  # Remove problematic trigger and fix RLS policy for providers

  1. Remove trigger that overwrites user_id with auth.uid()
  2. Drop the trigger function
  3. Clean up existing RLS policies
  4. Create proper RLS policy that allows authenticated users to insert their own records

  This fixes the issue where the trigger was setting user_id to NULL during signup,
  causing RLS policy violations.
*/

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS set_provider_user_id ON providers;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.set_provider_user_id();

-- Disable RLS temporarily to clean up policies
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to create their own provider profile" ON providers;
DROP POLICY IF EXISTS "Allow authenticated users to read their own provider profile" ON providers;
DROP POLICY IF EXISTS "Allow authenticated users to update their own provider profile" ON providers;
DROP POLICY IF EXISTS "providers_insert_policy" ON providers;
DROP POLICY IF EXISTS "providers_select_policy" ON providers;
DROP POLICY IF EXISTS "providers_update_policy" ON providers;
DROP POLICY IF EXISTS "Users can insert own provider profile" ON providers;
DROP POLICY IF EXISTS "Users can read own provider profile" ON providers;
DROP POLICY IF EXISTS "Users can update own provider profile" ON providers;

-- Re-enable RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Create the correct INSERT policy that allows authenticated users to insert their own records
CREATE POLICY "Allow providers to insert their own profile" ON providers
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create SELECT policy
CREATE POLICY "Allow providers to read their own profile" ON providers
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Create UPDATE policy  
CREATE POLICY "Allow providers to update their own profile" ON providers
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);