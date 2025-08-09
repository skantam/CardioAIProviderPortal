/*
  # Add vector search functionality for assessments

  1. New Functions
    - `search_assessments` - Performs vector similarity search on assessments
    - `get_user_email` - Helper function to get user email by UUID

  2. Security
    - Functions are accessible to authenticated users
    - Proper RLS policies maintained
*/

-- Function to get user email by UUID
CREATE OR REPLACE FUNCTION get_user_email(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT email 
    FROM auth.users 
    WHERE id = user_uuid
  );
END;
$$;

-- Function to search assessments using vector similarity
CREATE OR REPLACE FUNCTION search_assessments(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_status text
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  risk_score text,
  risk_category text,
  timestamp timestamptz,
  created_at timestamptz,
  status text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.risk_score,
    a.risk_category,
    a.timestamp,
    a.created_at,
    a.status,
    1 - (a.embedding <=> query_embedding) as similarity
  FROM assessments a
  WHERE a.status = filter_status
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add embedding column to assessments table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE assessments ADD COLUMN embedding vector(384);
  END IF;
END $$;

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS assessments_embedding_idx ON assessments 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);