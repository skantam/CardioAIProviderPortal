/*
  # Fix providers table RLS policy for signup

  1. Security Changes
    - Add INSERT policy for providers table to allow authenticated users to create their own provider records
    - This enables the signup process to work properly by allowing new users to insert their provider data

  2. Changes Made
    - Create policy "Authenticated users can insert own provider data" for INSERT operations
    - Policy ensures users can only insert records where user_id matches their auth.uid()
*/

-- Add INSERT policy for providers table
CREATE POLICY "Authenticated users can insert own provider data"
  ON providers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);