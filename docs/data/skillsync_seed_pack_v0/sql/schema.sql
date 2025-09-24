-- ENUMs
create type job_kind as enum ('featured_role','occupation');
create type assessment_method as enum ('quiz','resume');
create type skill_band as enum ('proficient','building','needs_dev');

-- Core reference
create table if not exists skills (
  id uuid primary key,
  name text not null,
  onet_id text,
  category text,
  description text
);

create table if not exists cip_codes (
  cip_code text primary key,
  title text not null,
  level text
);

create table if not exists cip_soc_crosswalk (
  cip_code text references cip_codes(cip_code) on delete cascade,
  soc_code text not null,
  source text default 'ONET',
  primary key (cip_code, soc_code)
);

-- Unified Jobs (occupations and featured roles)
create table if not exists companies (
  id uuid primary key,
  name text not null,
  logo_url text,
  is_trusted_partner boolean default false,
  hq_city text, hq_state text,
  revenue_range text, employee_range text, industry text,
  bio text
);

create table if not exists jobs (
  id uuid primary key,
  job_kind job_kind not null,
  title text not null,
  soc_code text,
  company_id uuid references companies(id),
  job_type text,
  category text,
  location_city text, location_state text,
  median_wage_usd numeric,
  long_desc text,
  featured_image_url text,
  skills_count int default 0
);

create table if not exists job_skills (
  job_id uuid references jobs(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  weight numeric default 1.0,
  primary key (job_id, skill_id)
);

-- Programs
create table if not exists schools (
  id uuid primary key,
  name text not null,
  logo_url text,
  about_url text,
  city text, state text
);

create table if not exists programs (
  id uuid primary key,
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  program_type text,
  format text,
  duration_text text,
  short_desc text,
  program_url text,
  cip_code text references cip_codes(cip_code)
);

create table if not exists program_skills (
  program_id uuid references programs(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  weight numeric default 1.0,
  primary key (program_id, skill_id)
);

-- Users & saves (extend auth.users with a profile view)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text, last_name text, zip text, avatar_url text
);

create table if not exists favorites (
  user_id uuid references auth.users(id) on delete cascade,
  entity_kind text check (entity_kind in ('job','program')),
  entity_id uuid not null,
  created_at timestamptz default now(),
  primary key (user_id, entity_kind, entity_id)
);

create table if not exists feedback (
  id uuid primary key,
  user_id uuid references auth.users(id),
  sentiment text check (sentiment in ('like','neutral','dislike')),
  score_int int,
  text text,
  created_at timestamptz default now()
);

-- Assessments & results
create table if not exists assessments (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  method assessment_method not null,
  analyzed_at timestamptz default now(),
  readiness_pct numeric,
  status_tag text check (status_tag in ('role_ready','close_gaps','needs_development'))
);

create table if not exists assessment_skill_results (
  assessment_id uuid references assessments(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  score_pct numeric not null,
  band skill_band not null,
  primary key (assessment_id, skill_id)
);

-- Resume artifacts (no file retention)
create table if not exists resume_features (
  assessment_id uuid primary key references assessments(id) on delete cascade,
  extracted_skills jsonb,
  notes text
);

-- Quiz scaffolding (deterministic grading)
create table if not exists quizzes (
  id uuid primary key,
  job_id uuid references jobs(id) on delete cascade,
  estimated_minutes int default 15,
  version int default 1
);

create table if not exists quiz_sections (
  id uuid primary key,
  quiz_id uuid references quizzes(id) on delete cascade,
  skill_id uuid references skills(id),
  order_index int
);

create table if not exists quiz_questions (
  id uuid primary key,
  section_id uuid references quiz_sections(id) on delete cascade,
  stem text not null,
  choices jsonb not null,
  answer_key text not null,
  difficulty text
);

create table if not exists quiz_responses (
  assessment_id uuid references assessments(id) on delete cascade,
  question_id uuid references quiz_questions(id) on delete cascade,
  selected text,
  is_correct boolean,
  primary key (assessment_id, question_id)
);

-- Who's hiring (by SOC)
create table if not exists company_job_openings (
  id uuid primary key,
  company_id uuid references companies(id) on delete cascade,
  external_job_title text,
  soc_code text,
  apply_url text,
  region_code text
);
