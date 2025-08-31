/*
  # Add vector search functionality and user email function

  1. Functions
    - `get_user_email` - Retrieves user email by UUID from auth.users
    - `search_assessments_vector` - Performs vector similarity search on assessments

  2. Schema Changes
    - Add `embedding` column to assessments table (vector(384))
    - Create vector similarity search index

  3. Security
    - Functions use SECURITY DEFINER for proper access to auth schema
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
CREATE OR REPLACE FUNCTION search_assessments_vector(
  query_embedding vector(384),
  similarity_threshold float DEFAULT 0.1,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  risk_score text,
  risk_category text,
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
    a.created_at,
    a.status,
    1 - (a.embedding <=> query_embedding) as similarity
  FROM assessments a
  WHERE a.embedding IS NOT NULL
    AND 1 - (a.embedding <=> query_embedding) > similarity_threshold
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