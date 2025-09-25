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

  -- Handle existing quizzes table (from initial schema)
  -- Add missing columns to existing quizzes table
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS title text;
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS description text;
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS soc_code text;
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS total_questions integer DEFAULT 0;
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS questions_per_assessment integer DEFAULT 15;
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false;
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_standard boolean DEFAULT true;
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

  -- Add unique constraint (drop existing first if it exists)
  ALTER TABLE public.quizzes DROP CONSTRAINT IF EXISTS quizzes_soc_code_is_standard_company_id_key;
  ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_soc_code_is_standard_company_id_key UNIQUE(soc_code, is_standard, company_id);

  -- Create quiz sections table
  CREATE TABLE IF NOT EXISTS public.quiz_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    questions_per_section integer DEFAULT 5,
    total_questions integer DEFAULT 0,
    order_index integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(quiz_id, skill_id)
  );

  -- Handle existing quiz_sections table (add missing columns)
  ALTER TABLE public.quiz_sections ADD COLUMN IF NOT EXISTS skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE;
  ALTER TABLE public.quiz_sections ADD COLUMN IF NOT EXISTS questions_per_section integer DEFAULT 5;
  ALTER TABLE public.quiz_sections ADD COLUMN IF NOT EXISTS total_questions integer DEFAULT 0;

  -- Create quiz questions table
  CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id uuid REFERENCES public.quiz_sections(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    stem text NOT NULL,
    choices jsonb NOT NULL,
    correct_answer text NOT NULL,
    explanation text,
    difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'expert')),
    points integer DEFAULT 1,
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0,
    last_used_at timestamptz,
    created_at timestamptz DEFAULT now()
  );

  -- Handle existing quiz_questions table (add missing columns)
  ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE;
  ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS explanation text;
  ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS points integer DEFAULT 1;
  ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
  ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0;
  ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

  -- Handle existing assessments table
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE;
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS selected_questions jsonb;
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS started_at timestamptz;
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS last_question_at timestamptz;
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS total_time_spent integer DEFAULT 0;
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS questions_completed integer DEFAULT 0;
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS current_question_index integer DEFAULT 0;
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS browser_info jsonb;
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS engagement_score numeric DEFAULT 0;

  -- Create assessment responses table
  CREATE TABLE IF NOT EXISTS public.assessment_responses (
    assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_id uuid REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_answer text,
    is_correct boolean,
    time_spent_seconds integer,
    answered_at timestamptz DEFAULT now(),
    question_started_at timestamptz DEFAULT now(),
    first_interaction_at timestamptz,
    confidence_level integer,
    difficulty_rating integer,
    mouse_movements integer DEFAULT 0,
    key_presses integer DEFAULT 0,

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

  -- Create analytics tables
  CREATE TABLE IF NOT EXISTS public.assessment_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE,
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    completion_rate numeric NOT NULL,
    total_questions integer NOT NULL,
    answered_questions integer NOT NULL,
    total_duration_seconds integer NOT NULL,
    average_time_per_question numeric,
    time_distribution jsonb,
    focus_score numeric,
    hesitation_score numeric,
    consistency_score numeric,
    average_difficulty_rating numeric,
    difficulty_distribution jsonb,
    device_type text,
    browser_name text,
    screen_resolution text,
    page_views integer DEFAULT 1,
    tab_switches integer DEFAULT 0,
    window_blurs integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.quiz_performance_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
    date date NOT NULL,
    soc_code text NOT NULL,
    total_assessments integer DEFAULT 0,
    completed_assessments integer DEFAULT 0,
    completion_rate numeric DEFAULT 0,
    average_duration_seconds numeric,
    median_duration_seconds numeric,
    average_engagement_score numeric,
    average_focus_score numeric,
    average_questions_answered numeric,
    question_completion_rates jsonb,
    unique_users integer DEFAULT 0,
    return_users integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(quiz_id, date)
  );

  CREATE TABLE IF NOT EXISTS public.user_assessment_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    soc_code text NOT NULL,
    total_assessments integer DEFAULT 0,
    completed_assessments integer DEFAULT 0,
    average_score numeric,
    first_assessment_at timestamptz,
    latest_assessment_at timestamptz,
    best_score numeric,
    improvement_trend jsonb,
    skills_improved jsonb,
    strongest_skills jsonb,
    development_areas jsonb,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, soc_code)
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
