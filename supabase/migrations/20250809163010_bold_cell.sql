/*
  # Add embeddings column for vector similarity search

  1. Changes
    - Add `embedding` column to assessments table (vector type with 384 dimensions for gte-small model)
    - Create index on embedding column for fast similarity search
    - Add function to generate embeddings for existing assessments
    - Add function to perform vector similarity search

  2. Security
    - No RLS changes needed as embeddings inherit table permissions
*/

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to assessments table
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS assessments_embedding_idx ON assessments 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to generate text representation for embedding
CREATE OR REPLACE FUNCTION get_assessment_text(assessment_row assessments)
RETURNS text AS $$
BEGIN
  RETURN COALESCE(assessment_row.risk_category, '') || ' ' ||
         COALESCE(assessment_row.overall_recommendation, '') || ' ' ||
         COALESCE(assessment_row.provider_comments, '') || ' ' ||
         COALESCE(assessment_row.risk_score::text, '') || ' ' ||
         COALESCE(assessment_row.inputs::text, '') || ' ' ||
         COALESCE(assessment_row.recommendations::text, '');
END;
$$ LANGUAGE plpgsql;

-- Function to search assessments by vector similarity
CREATE OR REPLACE FUNCTION search_assessments_vector(
  query_embedding vector(384),
  similarity_threshold float DEFAULT 0.1,
  match_count int DEFAULT 50
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
) AS $$
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
    (1 - (a.embedding <=> query_embedding))::float as similarity
  FROM assessments a
  WHERE a.embedding IS NOT NULL
    AND (1 - (a.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY a.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;