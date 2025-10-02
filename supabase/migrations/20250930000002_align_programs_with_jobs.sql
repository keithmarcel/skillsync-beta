-- Migration: Align programs table with jobs table structure
-- Date: 2025-09-30
-- Description: Add missing fields to programs table for 1:1 parity with jobs table
--              Ensures skills are the central fabric connecting programs, jobs, and assessments

-- Step 1: Add missing fields to match jobs table structure
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
ADD COLUMN IF NOT EXISTS skills_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Create indexes for performance (matching jobs table)
CREATE INDEX IF NOT EXISTS idx_programs_is_featured ON public.programs(is_featured);
CREATE INDEX IF NOT EXISTS idx_programs_school_id ON public.programs(school_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_catalog_provider ON public.programs(catalog_provider);

-- Step 3: Create trigger to update skills_count automatically (matching jobs pattern)
CREATE OR REPLACE FUNCTION update_program_skills_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE programs 
    SET skills_count = skills_count + 1 
    WHERE id = NEW.program_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE programs 
    SET skills_count = GREATEST(0, skills_count - 1) 
    WHERE id = OLD.program_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_program_skills_count ON program_skills;
CREATE TRIGGER trigger_update_program_skills_count
AFTER INSERT OR DELETE ON program_skills
FOR EACH ROW EXECUTE FUNCTION update_program_skills_count();

-- Step 4: Create trigger for updated_at timestamp (matching jobs pattern)
DROP TRIGGER IF EXISTS handle_programs_updated_at ON programs;
CREATE TRIGGER handle_programs_updated_at
BEFORE UPDATE ON programs
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Step 5: Update skills_count for existing programs
UPDATE programs p
SET skills_count = (
  SELECT COUNT(*)
  FROM program_skills ps
  WHERE ps.program_id = p.id
);

-- Step 6: Add comments for documentation
COMMENT ON COLUMN public.programs.is_featured IS 'Whether this program should appear in Featured Programs tab (true) or only All Programs tab (false)';
COMMENT ON COLUMN public.programs.skills_count IS 'Cached count of skills associated with this program (auto-updated via trigger)';
COMMENT ON COLUMN public.programs.created_at IS 'Timestamp when program was created';
COMMENT ON COLUMN public.programs.updated_at IS 'Timestamp when program was last updated (auto-updated via trigger)';

-- Step 7: Add constraint to ensure featured programs have required fields
-- First, drop the constraint if it exists
ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS chk_featured_program_has_image;

-- Update any featured programs without images to have a placeholder
UPDATE public.programs 
SET featured_image_url = '/assets/program-placeholder.jpg'
WHERE is_featured = true AND featured_image_url IS NULL;

-- Now add the constraint
ALTER TABLE public.programs
ADD CONSTRAINT chk_featured_program_has_image
CHECK (
  (is_featured = false) OR
  (is_featured = true AND featured_image_url IS NOT NULL)
);

-- Step 8: Create helper function to get featured programs (matching jobs pattern)
CREATE OR REPLACE FUNCTION get_featured_programs()
RETURNS SETOF programs AS $$
  SELECT * FROM programs
  WHERE is_featured = true 
    AND status = 'published'
  ORDER BY created_at DESC;
$$ LANGUAGE sql STABLE;

-- Step 9: Create helper function to get programs with skills
CREATE OR REPLACE FUNCTION get_programs_with_skills()
RETURNS TABLE(
  id UUID,
  name TEXT,
  school_id UUID,
  program_type TEXT,
  format TEXT,
  duration_text TEXT,
  short_desc TEXT,
  long_desc TEXT,
  discipline TEXT,
  is_featured BOOLEAN,
  skills_count INTEGER,
  skills JSONB
) AS $$
  SELECT 
    p.id,
    p.name,
    p.school_id,
    p.program_type,
    p.format,
    p.duration_text,
    p.short_desc,
    p.long_desc,
    p.discipline,
    p.is_featured,
    p.skills_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'name', s.name,
          'category', s.category,
          'weight', ps.weight
        ) ORDER BY ps.weight DESC
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'::jsonb
    ) as skills
  FROM programs p
  LEFT JOIN program_skills ps ON p.id = ps.program_id
  LEFT JOIN skills s ON ps.skill_id = s.id
  WHERE p.status = 'published'
  GROUP BY p.id;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_featured_programs() IS 'Returns all featured programs (is_featured = true, status = published)';
COMMENT ON FUNCTION get_programs_with_skills() IS 'Returns programs with their associated skills as JSONB array';
