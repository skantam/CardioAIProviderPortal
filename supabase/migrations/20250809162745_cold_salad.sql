/*
  # Create search function for assessments

  1. New Functions
    - `search_assessments` - PostgreSQL function to handle complex search queries
      - Supports numeric search (risk scores with range matching)
      - Supports date search (multiple formats)
      - Supports text search across all relevant fields including JSONB
      - Returns up to 5 results ordered by creation date

  2. Security
    - Function uses SECURITY DEFINER to run with elevated privileges
    - Proper input validation and error handling
*/

CREATE OR REPLACE FUNCTION search_assessments(
    p_search_term TEXT,
    p_status TEXT
)
RETURNS SETOF assessments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    search_pattern TEXT := '%' || LOWER(p_search_term) || '%';
    numeric_query NUMERIC;
    search_date DATE;
BEGIN
    -- Attempt to parse numeric query
    BEGIN
        numeric_query := p_search_term::NUMERIC;
    EXCEPTION
        WHEN invalid_text_representation THEN
            numeric_query := NULL;
    END;

    -- Attempt to parse date query (MM/DD/YYYY or YYYY-MM-DD)
    BEGIN
        IF p_search_term LIKE '%/%/%' THEN
            search_date := TO_DATE(p_search_term, 'MM/DD/YYYY');
        ELSE
            search_date := p_search_term::DATE;
        END IF;
    EXCEPTION
        WHEN invalid_datetime_format THEN
            search_date := NULL;
        WHEN others THEN
            search_date := NULL;
    END;

    RETURN QUERY
    SELECT *
    FROM assessments
    WHERE
        status = p_status
        AND (
            -- Numeric search (risk_score)
            (numeric_query IS NOT NULL AND (
                risk_score::NUMERIC = numeric_query OR
                (risk_score::NUMERIC >= GREATEST(0, numeric_query - 5) AND risk_score::NUMERIC <= LEAST(100, numeric_query + 5))
            ))
            OR
            -- Date search (timestamp or created_at)
            (search_date IS NOT NULL AND (
                DATE(timestamp) >= search_date OR DATE(created_at) >= search_date
            ))
            OR
            -- Text-based search on multiple fields
            (numeric_query IS NULL AND search_date IS NULL AND (
                (LOWER(risk_category) LIKE search_pattern) OR
                (LOWER(overall_recommendation) LIKE search_pattern) OR
                (LOWER(provider_comments) LIKE search_pattern) OR
                (LOWER(inputs::text) LIKE search_pattern) OR
                (LOWER(recommendations::text) LIKE search_pattern)
            ))
        )
    ORDER BY created_at DESC
    LIMIT 5;
END;
$$;