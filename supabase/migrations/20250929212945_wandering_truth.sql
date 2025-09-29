/*
  # Fix providers table RLS INSERT policy

  1. Security
    - Drop existing INSERT policies that may be conflicting
    - Create proper INSERT policy for authenticated users
    - Ensure users can insert their own provider records during signup
*/

-- Drop any existing INSERT policies for providers table
DROP POLICY IF EXISTS "Allow authenticated users to insert their own provider record" ON providers;
DROP POLICY IF EXISTS "Users can insert own provider data" ON providers;
DROP POLICY IF EXISTS "Providers can insert own data" ON providers;

-- Create a new INSERT policy that allows authenticated users to insert their own records
CREATE POLICY "Enable insert for authenticated users own records" ON providers
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;