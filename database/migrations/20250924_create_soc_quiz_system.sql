-- Migration: Create SOC-based quiz system with reusability
-- Date: 2025-09-24
-- Purpose: Establish reusable quiz architecture mapped to SOC codes

BEGIN;

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migrations (
  name TEXT PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Check if migration already executed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.migrations WHERE name = '20250924_create_soc_quiz_system') THEN
    RAISE NOTICE 'Migration 20250924_create_soc_quiz_system already executed';
    RETURN;
  END IF;

  -- Create quizzes table (mapped to SOC codes for reusability)
  CREATE TABLE IF NOT EXISTS public.quizzes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    soc_code text NOT NULL, -- SOC code this quiz assesses (enables reusability)
    title text NOT NULL,
    description text,
    estimated_minutes integer DEFAULT 15,
    total_questions integer DEFAULT 0, -- Total questions in pool
    questions_per_assessment integer DEFAULT 15, -- How many to show per assessment
    version integer DEFAULT 1,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    ai_generated boolean DEFAULT true,
    is_standard boolean DEFAULT true, -- Standard O*NET quiz vs company custom
    company_id uuid REFERENCES public.companies(id), -- NULL for standard quizzes
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Ensure uniqueness: one standard quiz per SOC code
    UNIQUE(soc_code, is_standard, company_id)
  );

  -- Create quiz skill sections (organizes questions by required skills)
  CREATE TABLE IF NOT EXISTS public.quiz_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    questions_per_section integer DEFAULT 5, -- How many questions from this skill per assessment
    total_questions integer DEFAULT 0, -- Total questions available for this skill
    order_index integer NOT NULL,
    created_at timestamptz DEFAULT now(),

    UNIQUE(quiz_id, skill_id) -- One section per skill per quiz
  );

  -- Create quiz questions table (question pool per skill)
  CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id uuid REFERENCES public.quiz_sections(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    stem text NOT NULL, -- Question text
    choices jsonb NOT NULL, -- {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}
    correct_answer text NOT NULL, -- "A", "B", "C", or "D"
    explanation text, -- Why this answer is correct
    difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'expert')),
    points integer DEFAULT 1,
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0, -- How many times this question has been used
    last_used_at timestamptz,
    created_at timestamptz DEFAULT now(),

    -- Ensure question uniqueness within a section
    UNIQUE(section_id, stem)
  );

  -- Create assessments table (instances of quiz taking)
  CREATE TABLE IF NOT EXISTS public.assessments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL, -- Can be NULL for standalone assessments
    method text NOT NULL CHECK (method IN ('quiz', 'resume')),
    selected_questions jsonb, -- Array of question IDs selected for this assessment
    readiness_pct numeric CHECK (readiness_pct >= 0 AND readiness_pct <= 100),
    status_tag text CHECK (status_tag IN ('role_ready', 'close_gaps', 'needs_development')),
    completed_at timestamptz,
    time_spent_minutes integer,
    created_at timestamptz DEFAULT now()
  );

  -- Create assessment responses (user answers)
  CREATE TABLE IF NOT EXISTS public.assessment_responses (
    assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_id uuid REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_answer text, -- "A", "B", "C", or "D"
    is_correct boolean,
    time_spent_seconds integer,
    answered_at timestamptz DEFAULT now(),

    PRIMARY KEY (assessment_id, question_id)
  );

  -- Create skill-level assessment results
  CREATE TABLE IF NOT EXISTS public.assessment_skill_results (
    assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    questions_asked integer NOT NULL,
    correct_answers integer NOT NULL,
    score_pct numeric NOT NULL CHECK (score_pct >= 0 AND score_pct <= 100),
    band text NOT NULL CHECK (band IN ('needs_development', 'building', 'proficient')),
    created_at timestamptz DEFAULT now(),

    PRIMARY KEY (assessment_id, skill_id)
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_quizzes_soc_code ON public.quizzes(soc_code);
  CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);
  CREATE INDEX IF NOT EXISTS idx_quiz_sections_quiz_id ON public.quiz_sections(quiz_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_sections_skill_id ON public.quiz_sections(skill_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_questions_section_id ON public.quiz_questions(section_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_questions_skill_id ON public.quiz_questions(skill_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON public.quiz_questions(is_active);
  CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);
  CREATE INDEX IF NOT EXISTS idx_assessments_quiz_id ON public.assessments(quiz_id);
  CREATE INDEX IF NOT EXISTS idx_assessments_status ON public.assessments(status_tag);
  CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment_id ON public.assessment_responses(assessment_id);
  CREATE INDEX IF NOT EXISTS idx_assessment_skill_results_assessment_id ON public.assessment_skill_results(assessment_id);

  -- Update existing tables to support quiz relationships
  ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS quiz_id uuid REFERENCES public.quizzes(id);
  ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS custom_quiz_enabled boolean DEFAULT false;

  -- Record migration completion
  INSERT INTO public.migrations (name) VALUES ('20250924_create_soc_quiz_system');

  RAISE NOTICE 'Migration 20250924_create_soc_quiz_system completed successfully - SOC-based quiz system established';
END $$;

COMMIT;
