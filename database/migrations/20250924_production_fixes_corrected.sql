-- PRODUCTION FIXES - Copy and paste these into your Supabase SQL Editor
-- This fixes the favoriting system to work for both featured roles and occupations

-- 1. Add the missing column
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- 2. Drop old function (cautious)
DROP FUNCTION IF EXISTS get_favorite_jobs_with_company();

-- 3. Create the CORRECTED FUNCTION (matches existing schema)
CREATE OR REPLACE FUNCTION get_favorite_jobs_with_company()
RETURNS TABLE (
    id uuid,
    job_kind job_kind,
    title text,
    soc_code text,
    company_id uuid,
    job_type text,
    category text,
    location_city text,
    location_state text,
    median_wage_usd numeric,
    long_desc text,
    featured_image_url text,
    skills_count integer,
    company json
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        j.id,
        j.job_kind,
        j.title,
        j.soc_code,
        j.company_id,
        j.job_type,
        j.category,
        j.location_city,
        j.location_state,
        j.median_wage_usd,
        j.long_desc,
        j.featured_image_url,
        j.skills_count,
        row_to_json(c.*)
    FROM jobs j
    JOIN favorites f ON j.id = f.entity_id
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE f.user_id = auth.uid() 
      AND f.entity_kind = 'job'
      AND j.job_kind IN ('featured_role', 'high_demand');
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_favorite_jobs_with_company() TO authenticated;
