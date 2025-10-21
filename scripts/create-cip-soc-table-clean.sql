-- Create CIP-SOC Crosswalk Table - CLEAN VERSION
-- Run this in Supabase SQL Editor

-- Drop table if it exists (clean slate)
DROP TABLE IF EXISTS public.cip_soc_crosswalk CASCADE;

-- Create table fresh
CREATE TABLE public.cip_soc_crosswalk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cip_code TEXT NOT NULL,
  cip_title TEXT,
  soc_code TEXT NOT NULL,
  soc_title TEXT,
  match_strength TEXT DEFAULT 'primary' CHECK (match_strength IN ('primary', 'secondary', 'tertiary')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_cip_soc_cip_code ON public.cip_soc_crosswalk(cip_code);
CREATE INDEX idx_cip_soc_soc_code ON public.cip_soc_crosswalk(soc_code);
CREATE INDEX idx_cip_soc_match_strength ON public.cip_soc_crosswalk(match_strength);
CREATE INDEX idx_cip_soc_cip_soc ON public.cip_soc_crosswalk(cip_code, soc_code);

-- Enable RLS
ALTER TABLE public.cip_soc_crosswalk ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to CIP-SOC crosswalk"
  ON public.cip_soc_crosswalk
  FOR SELECT
  TO public
  USING (true);

-- Only admins can modify
CREATE POLICY "Only admins can modify CIP-SOC crosswalk"
  ON public.cip_soc_crosswalk
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Add comments
COMMENT ON TABLE public.cip_soc_crosswalk IS 'NCES CIP-SOC crosswalk mapping education programs to occupations';
COMMENT ON COLUMN public.cip_soc_crosswalk.match_strength IS 'Primary = direct match, Secondary = related, Tertiary = possible match';

-- Verify
SELECT 'CIP-SOC crosswalk table created successfully!' AS status;
SELECT COUNT(*) AS current_mappings FROM public.cip_soc_crosswalk;
