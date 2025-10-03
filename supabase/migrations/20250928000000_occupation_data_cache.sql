-- Occupation Data Cache Tables
-- Stores BLS and CareerOneStop API data with intelligent TTL management

BEGIN;

-- BLS Wage Data Cache
CREATE TABLE IF NOT EXISTS bls_wage_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soc_code TEXT NOT NULL,
  area_code TEXT NOT NULL,
  area_name TEXT NOT NULL,
  median_wage DECIMAL(10,2),
  mean_wage DECIMAL(10,2),
  employment_level INTEGER,
  employment_rse DECIMAL(5,2),
  wage_rse DECIMAL(5,2),
  data_year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'), -- 90-day TTL
  UNIQUE(soc_code, area_code, data_year)
);

-- BLS Employment Projections Cache
CREATE TABLE IF NOT EXISTS bls_employment_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soc_code TEXT NOT NULL UNIQUE,
  occupation_title TEXT NOT NULL,
  employment_2022 INTEGER,
  employment_2032 INTEGER,
  change_number INTEGER,
  change_percent DECIMAL(5,2),
  growth_rate TEXT,
  median_wage_2023 DECIMAL(10,2),
  education_level TEXT,
  work_experience TEXT,
  on_job_training TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '180 days') -- 180-day TTL
);

-- CareerOneStop Programs Cache
CREATE TABLE IF NOT EXISTS cos_programs_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL,
  soc_code TEXT NOT NULL,
  program_name TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_type TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  program_type TEXT,
  delivery_method TEXT,
  duration TEXT,
  cost DECIMAL(10,2),
  program_url TEXT,
  cip_code TEXT,
  description TEXT,
  prerequisites JSONB DEFAULT '[]',
  outcomes JSONB DEFAULT '[]',
  accreditation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '60 days'), -- 60-day TTL
  UNIQUE(external_id, soc_code)
);

-- CareerOneStop Certifications Cache
CREATE TABLE IF NOT EXISTS cos_certifications_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soc_code TEXT NOT NULL,
  certification_name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]',
  renewal_period TEXT,
  cost DECIMAL(10,2),
  exam_required BOOLEAN DEFAULT false,
  related_socs JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '120 days'), -- 120-day TTL
  UNIQUE(soc_code, certification_name, issuing_organization)
);

-- Occupation Data Enrichment Status
CREATE TABLE IF NOT EXISTS occupation_enrichment_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soc_code TEXT NOT NULL UNIQUE,
  bls_wage_updated_at TIMESTAMP WITH TIME ZONE,
  bls_projections_updated_at TIMESTAMP WITH TIME ZONE,
  cos_programs_updated_at TIMESTAMP WITH TIME ZONE,
  cos_certifications_updated_at TIMESTAMP WITH TIME ZONE,
  last_enrichment_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bls_wage_data_soc_code ON bls_wage_data(soc_code);
CREATE INDEX IF NOT EXISTS idx_bls_wage_data_expires_at ON bls_wage_data(expires_at);
CREATE INDEX IF NOT EXISTS idx_bls_employment_projections_soc_code ON bls_employment_projections(soc_code);
CREATE INDEX IF NOT EXISTS idx_bls_employment_projections_expires_at ON bls_employment_projections(expires_at);
CREATE INDEX IF NOT EXISTS idx_cos_programs_cache_soc_code ON cos_programs_cache(soc_code);
CREATE INDEX IF NOT EXISTS idx_cos_programs_cache_expires_at ON cos_programs_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cos_certifications_cache_soc_code ON cos_certifications_cache(soc_code);
CREATE INDEX IF NOT EXISTS idx_cos_certifications_cache_expires_at ON cos_certifications_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_occupation_enrichment_status_soc_code ON occupation_enrichment_status(soc_code);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_occupation_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_deleted INTEGER := 0;
  current_deleted INTEGER := 0;
BEGIN
  -- Clean expired BLS wage data
  DELETE FROM bls_wage_data WHERE expires_at < NOW();
  GET DIAGNOSTICS current_deleted = ROW_COUNT;
  total_deleted := total_deleted + current_deleted;
  
  -- Clean expired BLS employment projections
  DELETE FROM bls_employment_projections WHERE expires_at < NOW();
  GET DIAGNOSTICS current_deleted = ROW_COUNT;
  total_deleted := total_deleted + current_deleted;
  
  -- Clean expired CareerOneStop programs
  DELETE FROM cos_programs_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS current_deleted = ROW_COUNT;
  total_deleted := total_deleted + current_deleted;
  
  -- Clean expired CareerOneStop certifications
  DELETE FROM cos_certifications_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS current_deleted = ROW_COUNT;
  total_deleted := total_deleted + current_deleted;
  
  RETURN total_deleted;
END;
$$;

-- Function to get cached BLS wage data
CREATE OR REPLACE FUNCTION get_cached_bls_wage_data(p_soc_code TEXT, p_area_code TEXT DEFAULT '45300')
RETURNS TABLE (
  soc_code TEXT,
  area_code TEXT,
  area_name TEXT,
  median_wage DECIMAL,
  mean_wage DECIMAL,
  employment_level INTEGER,
  data_year INTEGER,
  is_expired BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bwd.soc_code,
    bwd.area_code,
    bwd.area_name,
    bwd.median_wage,
    bwd.mean_wage,
    bwd.employment_level,
    bwd.data_year,
    (bwd.expires_at < NOW()) as is_expired
  FROM bls_wage_data bwd
  WHERE bwd.soc_code = p_soc_code 
    AND bwd.area_code = p_area_code
  ORDER BY bwd.data_year DESC, bwd.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to get cached CareerOneStop programs
CREATE OR REPLACE FUNCTION get_cached_cos_programs(p_soc_code TEXT)
RETURNS TABLE (
  program_name TEXT,
  provider_name TEXT,
  provider_type TEXT,
  city TEXT,
  state TEXT,
  program_type TEXT,
  delivery_method TEXT,
  duration TEXT,
  cost DECIMAL,
  program_url TEXT,
  cip_code TEXT,
  description TEXT,
  is_expired BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cpc.program_name,
    cpc.provider_name,
    cpc.provider_type,
    cpc.city,
    cpc.state,
    cpc.program_type,
    cpc.delivery_method,
    cpc.duration,
    cpc.cost,
    cpc.program_url,
    cpc.cip_code,
    cpc.description,
    (cpc.expires_at < NOW()) as is_expired
  FROM cos_programs_cache cpc
  WHERE cpc.soc_code = p_soc_code
    AND cpc.expires_at > NOW()
  ORDER BY cpc.created_at DESC;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON bls_wage_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bls_employment_projections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cos_programs_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cos_certifications_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON occupation_enrichment_status TO authenticated;

GRANT EXECUTE ON FUNCTION clean_expired_occupation_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION get_cached_bls_wage_data(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cached_cos_programs(TEXT) TO authenticated;

-- Enable RLS
ALTER TABLE bls_wage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE bls_employment_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cos_programs_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE cos_certifications_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupation_enrichment_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to BLS wage data" ON bls_wage_data;
DROP POLICY IF EXISTS "Allow read access to BLS employment projections" ON bls_employment_projections;
DROP POLICY IF EXISTS "Allow read access to CareerOneStop programs" ON cos_programs_cache;
DROP POLICY IF EXISTS "Allow read access to CareerOneStop certifications" ON cos_certifications_cache;
DROP POLICY IF EXISTS "Allow read access to enrichment status" ON occupation_enrichment_status;
DROP POLICY IF EXISTS "Allow admin operations on BLS wage data" ON bls_wage_data;
DROP POLICY IF EXISTS "Allow admin operations on BLS employment projections" ON bls_employment_projections;
DROP POLICY IF EXISTS "Allow admin operations on CareerOneStop programs" ON cos_programs_cache;
DROP POLICY IF EXISTS "Allow admin operations on CareerOneStop certifications" ON cos_certifications_cache;
DROP POLICY IF EXISTS "Allow admin operations on enrichment status" ON occupation_enrichment_status;

-- RLS Policies (allow read access to all authenticated users)
CREATE POLICY "Allow read access to BLS wage data" ON bls_wage_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to BLS employment projections" ON bls_employment_projections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to CareerOneStop programs" ON cos_programs_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to CareerOneStop certifications" ON cos_certifications_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to enrichment status" ON occupation_enrichment_status FOR SELECT TO authenticated USING (true);

-- Allow admin operations (insert/update/delete) for service role
CREATE POLICY "Allow admin operations on BLS wage data" ON bls_wage_data FOR ALL TO service_role USING (true);
CREATE POLICY "Allow admin operations on BLS employment projections" ON bls_employment_projections FOR ALL TO service_role USING (true);
CREATE POLICY "Allow admin operations on CareerOneStop programs" ON cos_programs_cache FOR ALL TO service_role USING (true);
CREATE POLICY "Allow admin operations on CareerOneStop certifications" ON cos_certifications_cache FOR ALL TO service_role USING (true);
CREATE POLICY "Allow admin operations on enrichment status" ON occupation_enrichment_status FOR ALL TO service_role USING (true);

COMMIT;
