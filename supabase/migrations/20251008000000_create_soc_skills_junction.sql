-- Create SOC Skills Junction Table
-- Links SOC codes to curated skills for app-wide usage

-- Create the junction table
CREATE TABLE IF NOT EXISTS public.soc_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soc_code TEXT NOT NULL,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  weight DECIMAL(3,2) DEFAULT 1.0, -- For weighted assessments
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique SOC + skill combinations
  UNIQUE(soc_code, skill_id)
);

-- Create indexes for performance
CREATE INDEX idx_soc_skills_soc_code ON public.soc_skills(soc_code);
CREATE INDEX idx_soc_skills_skill_id ON public.soc_skills(skill_id);
CREATE INDEX idx_soc_skills_display_order ON public.soc_skills(soc_code, display_order);

-- Enable RLS
ALTER TABLE public.soc_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view SOC skills"
  ON public.soc_skills FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage SOC skills"
  ON public.soc_skills FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Grant permissions
GRANT SELECT ON public.soc_skills TO authenticated, anon;
GRANT ALL ON public.soc_skills TO authenticated;

-- Add helpful comment
COMMENT ON TABLE public.soc_skills IS 'Junction table linking SOC codes to curated skills for assessments and job matching';
