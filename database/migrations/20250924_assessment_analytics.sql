-- Migration: Add assessment analytics and KPIs tracking
-- Date: 2025-09-24
-- Purpose: Extend schema for comprehensive assessment analytics

BEGIN;

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migrations (
  name TEXT PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Check if migration already executed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.migrations WHERE name = '20250924_assessment_analytics') THEN
    RAISE NOTICE 'Migration 20250924_assessment_analytics already executed';
    RETURN;
  END IF;

  -- Add analytics columns to assessments table
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS started_at timestamptz;
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS last_question_at timestamptz;
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS total_time_spent integer DEFAULT 0; -- seconds
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS questions_completed integer DEFAULT 0;
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS current_question_index integer DEFAULT 0;
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS browser_info jsonb; -- user agent, screen size, etc.
  ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS engagement_score numeric DEFAULT 0; -- 0-100 based on focus/time

  -- Add analytics to assessment_responses
  ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS question_started_at timestamptz DEFAULT now();
  ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS first_interaction_at timestamptz;
  ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS confidence_level integer; -- 1-5 scale (optional)
  ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS question_difficulty_rating integer; -- 1-5 scale (optional)
  ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS mouse_movements integer DEFAULT 0; -- engagement metric
  ALTER TABLE public.assessment_responses ADD COLUMN IF NOT EXISTS key_presses integer DEFAULT 0; -- engagement metric

  -- Create assessment_analytics table for aggregated KPIs
  CREATE TABLE IF NOT EXISTS public.assessment_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE,
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Completion metrics
    completion_rate numeric NOT NULL, -- 0-100
    total_questions integer NOT NULL,
    answered_questions integer NOT NULL,

    -- Time metrics
    total_duration_seconds integer NOT NULL,
    average_time_per_question numeric,
    time_distribution jsonb, -- {"easy": 45, "medium": 67, "hard": 89}

    -- Engagement metrics
    focus_score numeric, -- 0-100 based on interaction patterns
    hesitation_score numeric, -- average time before first answer
    consistency_score numeric, -- answer pattern consistency

    -- Difficulty perception
    average_difficulty_rating numeric, -- 1-5 scale
    difficulty_distribution jsonb, -- {"1": 2, "2": 5, "3": 10, "4": 3, "5": 1}

    -- Device/Browser info
    device_type text, -- desktop, mobile, tablet
    browser_name text,
    screen_resolution text,

    -- Session analytics
    page_views integer DEFAULT 1,
    tab_switches integer DEFAULT 0,
    window_blurs integer DEFAULT 0, -- times user left window

    created_at timestamptz DEFAULT now()
  );

  -- Create quiz_performance_metrics table for aggregated insights
  CREATE TABLE IF NOT EXISTS public.quiz_performance_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
    date date NOT NULL,
    soc_code text NOT NULL,

    -- Aggregate metrics
    total_assessments integer DEFAULT 0,
    completed_assessments integer DEFAULT 0,
    completion_rate numeric DEFAULT 0,

    -- Time metrics
    average_duration_seconds numeric,
    median_duration_seconds numeric,

    -- Engagement metrics
    average_engagement_score numeric,
    average_focus_score numeric,

    -- Question-level metrics
    average_questions_answered numeric,
    question_completion_rates jsonb, -- per question success rates

    -- User demographics
    unique_users integer DEFAULT 0,
    return_users integer DEFAULT 0, -- users who took multiple assessments

    created_at timestamptz DEFAULT now(),

    UNIQUE(quiz_id, date)
  );

  -- Create user_assessment_history table for longitudinal tracking
  CREATE TABLE IF NOT EXISTS public.user_assessment_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    soc_code text NOT NULL,

    -- Assessment history
    total_assessments integer DEFAULT 0,
    completed_assessments integer DEFAULT 0,
    average_score numeric,

    -- Progress tracking
    first_assessment_at timestamptz,
    latest_assessment_at timestamptz,
    best_score numeric,
    improvement_trend jsonb, -- score progression over time

    -- Skill development
    skills_improved jsonb, -- {"skill_id": {"initial": 65, "current": 85, "change": 20}}
    strongest_skills jsonb, -- top 3 skills by proficiency
    development_areas jsonb, -- skills needing most improvement

    updated_at timestamptz DEFAULT now(),

    UNIQUE(user_id, soc_code)
  );

  -- Add indexes for performance
  CREATE INDEX IF NOT EXISTS idx_assessment_analytics_assessment_id ON public.assessment_analytics(assessment_id);
  CREATE INDEX IF NOT EXISTS idx_assessment_analytics_user_id ON public.assessment_analytics(user_id);
  CREATE INDEX IF NOT EXISTS idx_assessment_analytics_quiz_id ON public.assessment_analytics(quiz_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_performance_metrics_quiz_id ON public.quiz_performance_metrics(quiz_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_performance_metrics_date ON public.quiz_performance_metrics(date);
  CREATE INDEX IF NOT EXISTS idx_user_assessment_history_user_id ON public.user_assessment_history(user_id);

  -- Record migration completion
  INSERT INTO public.migrations (name) VALUES ('20250924_assessment_analytics');

  RAISE NOTICE 'Migration 20250924_assessment_analytics completed successfully - comprehensive assessment analytics added';
END $$;

COMMIT;
