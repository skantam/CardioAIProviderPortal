/*
  # Add embeddings column and vector search functionality

  1. New Columns
    - `embedding` (vector(384)) - stores text embeddings for similarity search

  2. Indexes
    - Vector similarity index for fast search

  3. Functions
    - `search_assessments_vector` - performs vector similarity search
    - `get_user_email` - helper function to get user email from auth
*/

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to assessments table
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
    (1 - (a.embedding <=> query_embedding)) as similarity
  FROM assessments a
  WHERE a.embedding IS NOT NULL
    AND (1 - (a.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get user email from auth.users
CREATE OR REPLACE FUNCTION get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;
  
  RETURN user_email;
END;
$$;