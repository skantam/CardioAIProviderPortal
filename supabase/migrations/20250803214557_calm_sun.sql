/*
  # Create function to get user email from auth.users

  1. New Functions
    - `get_user_email(user_uuid)` - Returns email for given user ID from auth.users table
  
  2. Security
    - Function uses security definer to access auth.users table
    - Only returns email, no other sensitive data
*/

CREATE OR REPLACE FUNCTION get_user_email(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;
  
  RETURN user_email;
END;
$$;