-- Migration: Add CIP assignment metadata
-- Date: 2025-09-30
-- Description: Add fields to track CIP assignment confidence and approval status

-- Add CIP metadata columns
ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS cip_assignment_confidence INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS cip_assignment_method TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS cip_approved BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cip_suggestions JSONB DEFAULT '[]';

-- Add comments
COMMENT ON COLUMN public.programs.cip_assignment_confidence IS 'AI confidence score (0-100) for CIP assignment';
COMMENT ON COLUMN public.programs.cip_assignment_method IS 'How CIP was assigned: manual, ai_auto, ai_reviewed, partner_provided';
COMMENT ON COLUMN public.programs.cip_approved IS 'Whether CIP assignment has been reviewed and approved (default true for testing)';
COMMENT ON COLUMN public.programs.cip_suggestions IS 'AI-suggested CIP codes with confidence scores (for future reference)';

-- Create index for filtering by approval status
CREATE INDEX IF NOT EXISTS idx_programs_cip_approved ON public.programs(cip_approved);

-- Set all existing programs to approved
UPDATE public.programs SET cip_approved = true WHERE cip_approved IS NULL;
