-- Fix fn_compute_readiness to use importance_level instead of weight
-- The job_skills table was updated to use importance_level, but the function still references weight

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.fn_compute_readiness(uuid);

CREATE OR REPLACE FUNCTION public.fn_compute_readiness(p_assessment_id uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  v_readiness numeric;
BEGIN
  WITH r AS (
    SELECT asr.score_pct::numeric AS score,
           COALESCE(js.importance_level, 3.0)::numeric AS wt
    FROM public.assessment_skill_results asr
    LEFT JOIN public.assessments a ON a.id = asr.assessment_id
    LEFT JOIN public.job_skills js ON js.job_id = a.job_id AND js.skill_id = asr.skill_id
    WHERE asr.assessment_id = p_assessment_id
  )
  SELECT CASE WHEN SUM(wt)=0 THEN NULL ELSE SUM(score*wt)/SUM(wt) END INTO v_readiness
  FROM r;
  
  RETURN v_readiness;
END;
$$;

COMMENT ON FUNCTION public.fn_compute_readiness IS 'Calculates weighted readiness score for an assessment using importance_level from job_skills';
