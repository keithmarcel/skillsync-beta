-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.assessment_skill_results (
  assessment_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  score_pct numeric NOT NULL,
  band USER-DEFINED NOT NULL,
  CONSTRAINT assessment_skill_results_pkey PRIMARY KEY (assessment_id, skill_id),
  CONSTRAINT assessment_skill_results_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id),
  CONSTRAINT assessment_skill_results_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id)
);
CREATE TABLE public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  job_id uuid,
  method USER-DEFINED NOT NULL,
  analyzed_at timestamp with time zone DEFAULT now(),
  readiness_pct numeric,
  status_tag text CHECK (status_tag = ANY (ARRAY['role_ready'::text, 'close_gaps'::text, 'needs_development'::text])),
  CONSTRAINT assessments_pkey PRIMARY KEY (id),
  CONSTRAINT assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT assessments_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.cip_codes (
  cip_code text NOT NULL,
  title text NOT NULL,
  level text,
  CONSTRAINT cip_codes_pkey PRIMARY KEY (cip_code)
);
CREATE TABLE public.cip_soc_crosswalk (
  cip_code text NOT NULL,
  soc_code text NOT NULL,
  source text DEFAULT 'ONET'::text,
  CONSTRAINT cip_soc_crosswalk_pkey PRIMARY KEY (cip_code, soc_code),
  CONSTRAINT cip_soc_crosswalk_cip_code_fkey FOREIGN KEY (cip_code) REFERENCES public.cip_codes(cip_code)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  company_image_url text,
  is_trusted_partner boolean DEFAULT false,
  hq_city text,
  hq_state text,
  revenue_range text,
  employee_range text,
  industry text,
  bio text,
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.company_job_openings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  external_job_title text,
  soc_code text,
  apply_url text,
  region_code text,
  CONSTRAINT company_job_openings_pkey PRIMARY KEY (id),
  CONSTRAINT company_job_openings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.favorites (
  user_id uuid NOT NULL,
  entity_kind text NOT NULL CHECK (entity_kind = ANY (ARRAY['job'::text, 'program'::text])),
  entity_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (user_id, entity_kind, entity_id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  sentiment text CHECK (sentiment = ANY (ARRAY['like'::text, 'neutral'::text, 'dislike'::text])),
  score_int integer,
  text text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.job_skills (
  job_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  weight numeric DEFAULT 1.0,
  CONSTRAINT job_skills_pkey PRIMARY KEY (job_id, skill_id),
  CONSTRAINT job_skills_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id)
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_kind USER-DEFINED NOT NULL,
  title text NOT NULL,
  soc_code text,
  company_id uuid,
  job_type text,
  category text,
  location_city text,
  location_state text,
  median_wage_usd numeric,
  long_desc text,
  featured_image_url text,
  skills_count integer DEFAULT 0,
  required_proficiency_pct numeric,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  zip_code text,
  avatar_url text,
  agreed_to_terms boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.program_skills (
  program_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  weight numeric DEFAULT 1.0,
  CONSTRAINT program_skills_pkey PRIMARY KEY (program_id, skill_id),
  CONSTRAINT program_skills_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT program_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id)
);
CREATE TABLE public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid,
  name text NOT NULL,
  program_type text,
  format text,
  duration_text text,
  short_desc text,
  program_url text,
  cip_code text,
  CONSTRAINT programs_pkey PRIMARY KEY (id),
  CONSTRAINT programs_cip_code_fkey FOREIGN KEY (cip_code) REFERENCES public.cip_codes(cip_code),
  CONSTRAINT programs_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  section_id uuid,
  stem text NOT NULL,
  choices jsonb NOT NULL,
  answer_key text NOT NULL,
  difficulty text,
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.quiz_sections(id)
);
CREATE TABLE public.quiz_responses (
  assessment_id uuid NOT NULL,
  question_id uuid NOT NULL,
  selected text,
  is_correct boolean,
  CONSTRAINT quiz_responses_pkey PRIMARY KEY (assessment_id, question_id),
  CONSTRAINT quiz_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id),
  CONSTRAINT quiz_responses_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id)
);
CREATE TABLE public.quiz_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid,
  skill_id uuid,
  order_index integer,
  CONSTRAINT quiz_sections_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_sections_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id),
  CONSTRAINT quiz_sections_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id)
);
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid,
  estimated_minutes integer DEFAULT 15,
  version integer DEFAULT 1,
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.resume_features (
  assessment_id uuid NOT NULL,
  extracted_skills jsonb,
  notes text,
  CONSTRAINT resume_features_pkey PRIMARY KEY (assessment_id),
  CONSTRAINT resume_features_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id)
);
CREATE TABLE public.schools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  about_url text,
  city text,
  state text,
  CONSTRAINT schools_pkey PRIMARY KEY (id)
);
CREATE TABLE public.skill_aliases (
  skill_id uuid NOT NULL,
  alias text NOT NULL,
  CONSTRAINT skill_aliases_pkey PRIMARY KEY (skill_id, alias),
  CONSTRAINT skill_aliases_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id)
);
CREATE TABLE public.skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  onet_id text,
  category text,
  description text,
  lightcast_id text UNIQUE,
  source text DEFAULT 'ONET/LIGHTCAST'::text,
  source_version text,
  CONSTRAINT skills_pkey PRIMARY KEY (id)
);