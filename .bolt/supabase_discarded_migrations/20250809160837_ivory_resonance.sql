/*
  # Enable vector extension and create search function

  1. Extensions
    - Enable vector extension for similarity search
  
  2. New Functions
    - `search_assessments` function for vector similarity search
    - Uses cosine similarity for embedding comparison
  
  3. Security
    - Function accessible to authenticated users
*/

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

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

-- Create or replace the search function
CREATE OR REPLACE FUNCTION search_assessments(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.1,
  match_count int DEFAULT 5,
  filter_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  timestamp timestamptz,
  inputs jsonb,
  risk_score text,
  risk_category text,
  recommendations jsonb,
  guidelines jsonb,
  disclaimer text,
  overall_recommendation text,
  provider_comments text,
  status text,
  created_at timestamptz,
  results jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.timestamp,
    a.inputs,
    a.risk_score,
    a.risk_category,
    a.recommendations,
    a.guidelines,
    a.disclaimer,
    a.overall_recommendation,
    a.provider_comments,
    a.status,
    a.created_at,
    a.results,
    (1 - (a.embedding <=> query_embedding)) as similarity
  FROM assessments a
  WHERE 
    a.embedding IS NOT NULL
    AND (filter_status IS NULL OR a.status = filter_status)
    AND (1 - (a.embedding <=> query_embedding)) > match_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;