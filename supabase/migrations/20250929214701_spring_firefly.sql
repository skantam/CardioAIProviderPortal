/*
  # Fix providers table RLS policy for INSERT operations

  1. Security
    - Drop all existing INSERT policies to avoid conflicts
    - Create a single, clear INSERT policy for authenticated users
    - Ensure users can only insert records with their own user_id
    - Enable RLS on the providers table
*/

-- Ensure RLS is enabled
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Drop all existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to insert their own provider profile" ON providers;
DROP POLICY IF EXISTS "Allow insert own provider record" ON providers;
DROP POLICY IF EXISTS "Users can insert own provider records" ON providers;
DROP POLICY IF EXISTS "Authenticated users can insert own provider data" ON providers;
DROP POLICY IF EXISTS "providers_insert_policy" ON providers;

-- Create a single, clear INSERT policy
CREATE POLICY "providers_authenticated_insert" 
ON providers 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Verify other necessary policies exist
DO $$
BEGIN
  -- Ensure SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'providers' 
    AND policyname = 'providers_authenticated_select'
  ) THEN
    CREATE POLICY "providers_authenticated_select" 
    ON providers 
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);
  END IF;

  -- Ensure UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'providers' 
    AND policyname = 'providers_authenticated_update'
  ) THEN
    CREATE POLICY "providers_authenticated_update" 
    ON providers 
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;