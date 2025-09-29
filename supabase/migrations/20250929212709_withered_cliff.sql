/*
  # Fix providers table RLS policy for INSERT operations

  1. Security
    - Drop existing INSERT policy that may be conflicting
    - Create new INSERT policy allowing authenticated users to insert their own provider records
    - Policy checks that user_id matches auth.uid()
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to insert their own provider record" ON public.providers;
DROP POLICY IF EXISTS "Users can insert own provider data" ON public.providers;
DROP POLICY IF EXISTS "Allow authenticated users to insert own provider data" ON public.providers;

-- Create new INSERT policy
CREATE POLICY "Allow authenticated users to insert their own provider record" 
ON public.providers 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);