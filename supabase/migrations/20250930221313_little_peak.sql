/*
  # Add Performance Indexes for Assessments

  1. New Indexes
    - `assessments_usercountry_idx` - Index on usercountry column for faster country-based filtering
    - `assessments_status_idx` - Index on status column for faster status filtering
    - `assessments_usercountry_status_idx` - Composite index for combined filtering
    - `assessments_created_at_idx` - Index on created_at for faster date sorting

  2. Performance Benefits
    - Significantly faster assessment loading for providers
    - Improved query performance for dashboard filtering
    - Better support for date-based searches
*/

-- Index for filtering by user country
CREATE INDEX IF NOT EXISTS assessments_usercountry_idx 
ON public.assessments (usercountry);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS assessments_status_idx 
ON public.assessments (status);

-- Composite index for combined country and status filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS assessments_usercountry_status_idx 
ON public.assessments (usercountry, status);

-- Index for date-based sorting and filtering
CREATE INDEX IF NOT EXISTS assessments_created_at_idx 
ON public.assessments (created_at DESC);

-- Composite index for the complete query pattern used in dashboard
CREATE INDEX IF NOT EXISTS assessments_dashboard_query_idx 
ON public.assessments (usercountry, status, created_at DESC);