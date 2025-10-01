-- Add importance columns for three-layer weighting system
-- Part of assessment proficiency engine enhancement

-- Add O*NET importance score to skills table
-- This stores the O*NET importance rating (1.0-5.0) for each skill
ALTER TABLE public.skills
ADD COLUMN IF NOT EXISTS onet_importance DECIMAL(3,1) DEFAULT NULL;

COMMENT ON COLUMN public.skills.onet_importance IS 'O*NET importance rating (1.0-5.0) used for question weighting';

-- Add importance weight to quiz questions
-- This allows individual questions to be weighted by criticality
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS importance DECIMAL(3,1) DEFAULT 3.0;

COMMENT ON COLUMN public.quiz_questions.importance IS 'Question importance weight (1.0-5.0) for assessment scoring';

-- Add index for performance when querying by importance
CREATE INDEX IF NOT EXISTS idx_skills_onet_importance ON public.skills(onet_importance) WHERE onet_importance IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quiz_questions_importance ON public.quiz_questions(importance);

-- Add assessable flag to skills (optional, for filtering)
ALTER TABLE public.skills
ADD COLUMN IF NOT EXISTS is_assessable BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.skills.is_assessable IS 'Whether this skill should be used in assessments (filters out generic abilities)';

CREATE INDEX IF NOT EXISTS idx_skills_assessable ON public.skills(is_assessable) WHERE is_assessable = true;
