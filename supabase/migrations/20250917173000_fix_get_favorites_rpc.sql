-- supabase/migrations/20250917173000_fix_get_favorites_rpc.sql

-- Function to get favorite jobs for the currently authenticated user, including company data
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
    WHERE f.user_id = auth.uid() AND f.entity_kind = 'job';
$$;

-- Function to get favorite programs for the currently authenticated user, including school data
CREATE OR REPLACE FUNCTION get_favorite_programs_with_school()
RETURNS TABLE (
    id uuid,
    school_id uuid,
    name text,
    program_type text,
    format text,
    duration_text text,
    short_desc text,
    program_url text,
    cip_code text,
    school json
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        p.id,
        p.school_id,
        p.name,
        p.program_type,
        p.format,
        p.duration_text,
        p.short_desc,
        p.program_url,
        p.cip_code,
        row_to_json(s.*)
    FROM programs p
    JOIN favorites f ON p.id = f.entity_id
    LEFT JOIN schools s ON p.school_id = s.id
    WHERE f.user_id = auth.uid() AND f.entity_kind = 'program';
$$;
