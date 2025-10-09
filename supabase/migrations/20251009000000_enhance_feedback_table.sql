-- Enhance feedback table with route context and feedback level
-- Migration: 20251009000000_enhance_feedback_table.sql

-- Add route_path column to track where feedback was submitted
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS route_path TEXT;

-- Add feedback_level column to store numeric rating (1-5 scale)
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS feedback_level INTEGER CHECK (feedback_level BETWEEN 1 AND 5);

-- Add index for querying by feedback level
CREATE INDEX IF NOT EXISTS idx_feedback_level ON public.feedback(feedback_level);

-- Add index for querying by route path
CREATE INDEX IF NOT EXISTS idx_feedback_route_path ON public.feedback(route_path);

-- Add comment explaining emoji to level mapping
COMMENT ON COLUMN public.feedback.feedback_level IS 'Feedback level: 1=😟 (negative), 3=😐 (neutral), 5=😍 (positive)';
COMMENT ON COLUMN public.feedback.route_path IS 'Route path where feedback was submitted (e.g., /jobs, /programs/123)';
