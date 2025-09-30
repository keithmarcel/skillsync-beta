

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."assessment_method" AS ENUM (
    'quiz',
    'resume'
);


ALTER TYPE "public"."assessment_method" OWNER TO "postgres";


CREATE TYPE "public"."job_kind" AS ENUM (
    'featured_role',
    'occupation'
);


ALTER TYPE "public"."job_kind" OWNER TO "postgres";


CREATE TYPE "public"."skill_band" AS ENUM (
    'proficient',
    'building',
    'needs_dev'
);


ALTER TYPE "public"."skill_band" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'super_admin',
    'partner_admin',
    'org_user',
    'basic_user'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_job_favorites"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Remove from favorites when job is archived or deleted
    IF (NEW.status = 'archived') OR (TG_OP = 'DELETE') THEN
        DELETE FROM public.favorites 
        WHERE entity_kind = 'job' 
        AND entity_id = COALESCE(NEW.id, OLD.id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."cleanup_job_favorites"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_program_favorites"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Remove from favorites when program is archived or deleted
    IF (NEW.status = 'archived') OR (TG_OP = 'DELETE') THEN
        DELETE FROM public.favorites 
        WHERE entity_kind = 'program' 
        AND entity_id = COALESCE(NEW.id, OLD.id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."cleanup_program_favorites"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_company_roles"("company_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::integer 
        FROM public.jobs 
        WHERE company_id = company_uuid 
        AND job_kind = 'featured_role'
        AND status != 'archived'
    );
END;
$$;


ALTER FUNCTION "public"."count_company_roles"("company_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_provider_programs"("school_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::integer 
        FROM public.programs 
        WHERE school_id = school_uuid
        AND status != 'archived'
    );
END;
$$;


ALTER FUNCTION "public"."count_provider_programs"("school_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_compute_readiness"("p_assessment_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_ready  numeric;
  v_status text;
BEGIN
  WITH r AS (
    SELECT asr.score_pct::numeric AS score,
           COALESCE(js.weight, 1.0)::numeric AS wt
    FROM public.assessment_skill_results asr
    LEFT JOIN public.assessments a ON a.id = asr.assessment_id
    LEFT JOIN public.job_skills js ON js.job_id = a.job_id AND js.skill_id = asr.skill_id
    WHERE asr.assessment_id = p_assessment_id
  )
  SELECT CASE WHEN SUM(wt)=0 THEN NULL ELSE SUM(score*wt)/SUM(wt) END
  INTO v_ready
  FROM r;

  IF v_ready IS NULL THEN
    v_status := NULL;
  ELSIF v_ready >= 85 THEN
    v_status := 'role_ready';
  ELSIF v_ready >= 50 THEN
    v_status := 'close_gaps';
  ELSE
    v_status := 'needs_development';
  END IF;

  UPDATE public.assessments
     SET readiness_pct = v_ready,
         status_tag    = v_status,
         analyzed_at   = NOW()
   WHERE id = p_assessment_id;
END
$$;


ALTER FUNCTION "public"."fn_compute_readiness"("p_assessment_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_kind" "public"."job_kind" NOT NULL,
    "title" "text" NOT NULL,
    "soc_code" "text",
    "company_id" "uuid",
    "job_type" "text",
    "category" "text",
    "location_city" "text",
    "location_state" "text",
    "median_wage_usd" numeric,
    "long_desc" "text",
    "featured_image_url" "text",
    "skills_count" integer DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "employment_outlook" "text",
    "education_level" "text",
    "work_experience" "text",
    "on_job_training" "text",
    "job_openings_annual" integer,
    "growth_rate_percent" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'published'::"text",
    CONSTRAINT "chk_featured_role_has_company" CHECK (((("job_kind" = 'featured_role'::"public"."job_kind") AND ("company_id" IS NOT NULL)) OR ("job_kind" = 'occupation'::"public"."job_kind"))),
    CONSTRAINT "chk_occupation_has_soc" CHECK (((("job_kind" = 'occupation'::"public"."job_kind") AND ("soc_code" IS NOT NULL)) OR ("job_kind" = 'featured_role'::"public"."job_kind"))),
    CONSTRAINT "jobs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."jobs"."job_kind" IS 'Type of job: featured_role (company-specific roles) or occupation (labor market data)';



COMMENT ON COLUMN "public"."jobs"."soc_code" IS 'Required for occupation, optional for featured_role';



COMMENT ON COLUMN "public"."jobs"."company_id" IS 'Required for featured_role, null for occupation';



COMMENT ON COLUMN "public"."jobs"."is_featured" IS 'Whether this job should appear in featured sections';



COMMENT ON COLUMN "public"."jobs"."employment_outlook" IS 'Labor market outlook for occupations';



COMMENT ON COLUMN "public"."jobs"."education_level" IS 'Typical education requirement';



COMMENT ON COLUMN "public"."jobs"."job_openings_annual" IS 'Annual job openings projection';



COMMENT ON COLUMN "public"."jobs"."growth_rate_percent" IS 'Employment growth rate percentage';



CREATE OR REPLACE FUNCTION "public"."get_favorite_jobs"() RETURNS SETOF "public"."jobs"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select j.*
  from jobs j
  join favorites f on j.id = f.entity_id
  where f.user_id = auth.uid() and f.entity_kind = 'job';
$$;


ALTER FUNCTION "public"."get_favorite_jobs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_favorite_jobs_with_company"() RETURNS TABLE("id" "uuid", "job_kind" "public"."job_kind", "title" "text", "soc_code" "text", "company_id" "uuid", "job_type" "text", "category" "text", "location_city" "text", "location_state" "text", "median_wage_usd" numeric, "long_desc" "text", "featured_image_url" "text", "skills_count" integer, "company" json)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_favorite_jobs_with_company"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "school_id" "uuid",
    "name" "text" NOT NULL,
    "program_type" "text",
    "format" "text",
    "duration_text" "text",
    "short_desc" "text",
    "program_url" "text",
    "cip_code" "text",
    "status" "text" DEFAULT 'published'::"text",
    CONSTRAINT "programs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."programs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_favorite_programs"() RETURNS SETOF "public"."programs"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select p.*
  from programs p
  join favorites f on p.id = f.entity_id
  where f.user_id = auth.uid() and f.entity_kind = 'program';
$$;


ALTER FUNCTION "public"."get_favorite_programs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_favorite_programs_with_school"() RETURNS TABLE("id" "uuid", "school_id" "uuid", "name" "text", "program_type" "text", "format" "text", "duration_text" "text", "short_desc" "text", "program_url" "text", "cip_code" "text", "school" json)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_favorite_programs_with_school"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_admin_role"() RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT admin_role
  FROM public.profiles
  WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_admin_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_assessment_owner_default"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END
$$;


ALTER FUNCTION "public"."trg_assessment_owner_default"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_assessment_results_changed"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_assessment_id uuid;
BEGIN
  v_assessment_id := COALESCE(NEW.assessment_id, OLD.assessment_id);
  PERFORM public.fn_compute_readiness(v_assessment_id);
  RETURN COALESCE(NEW, OLD);
END
$$;


ALTER FUNCTION "public"."trg_assessment_results_changed"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_audit_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'error'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."admin_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_skill_results" (
    "assessment_id" "uuid" NOT NULL,
    "skill_id" "uuid" NOT NULL,
    "score_pct" numeric NOT NULL,
    "band" "public"."skill_band" NOT NULL
);


ALTER TABLE "public"."assessment_skill_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "job_id" "uuid",
    "method" "public"."assessment_method" NOT NULL,
    "analyzed_at" timestamp with time zone DEFAULT "now"(),
    "readiness_pct" numeric,
    "status_tag" "text",
    CONSTRAINT "assessments_status_tag_check" CHECK (("status_tag" = ANY (ARRAY['role_ready'::"text", 'close_gaps'::"text", 'needs_development'::"text"])))
);


ALTER TABLE "public"."assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cip_codes" (
    "cip_code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "level" "text"
);


ALTER TABLE "public"."cip_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cip_soc_crosswalk" (
    "cip_code" "text" NOT NULL,
    "soc_code" "text" NOT NULL,
    "source" "text" DEFAULT 'ONET'::"text"
);


ALTER TABLE "public"."cip_soc_crosswalk" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "is_trusted_partner" boolean DEFAULT false,
    "hq_city" "text",
    "hq_state" "text",
    "revenue_range" "text",
    "employee_range" "text",
    "industry" "text",
    "bio" "text",
    "company_image_url" "text"
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_job_openings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "external_job_title" "text",
    "soc_code" "text",
    "apply_url" "text",
    "region_code" "text"
);


ALTER TABLE "public"."company_job_openings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."company_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "user_id" "uuid" NOT NULL,
    "entity_kind" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "favorites_entity_kind_check" CHECK (("entity_kind" = ANY (ARRAY['job'::"text", 'program'::"text"])))
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "sentiment" "text",
    "score_int" integer,
    "text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "feedback_sentiment_check" CHECK (("sentiment" = ANY (ARRAY['like'::"text", 'neutral'::"text", 'dislike'::"text"])))
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_skills" (
    "job_id" "uuid" NOT NULL,
    "skill_id" "uuid" NOT NULL,
    "weight" numeric DEFAULT 1.0
);


ALTER TABLE "public"."job_skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "zip" "text",
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'basic_user'::"public"."user_role" NOT NULL,
    "phone" "text",
    "company_name" "text",
    "job_title" "text",
    "linkedin_url" "text",
    "email" "text",
    "zip_code" "text",
    "agreed_to_terms" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "admin_role" "text",
    "company_id" "uuid",
    "school_id" "uuid",
    CONSTRAINT "profiles_admin_role_check" CHECK (("admin_role" = ANY (ARRAY['super_admin'::"text", 'company_admin'::"text", 'provider_admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."program_skills" (
    "program_id" "uuid" NOT NULL,
    "skill_id" "uuid" NOT NULL,
    "weight" numeric DEFAULT 1.0
);


ALTER TABLE "public"."program_skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_id" "uuid",
    "stem" "text" NOT NULL,
    "choices" "jsonb" NOT NULL,
    "answer_key" "text" NOT NULL,
    "difficulty" "text"
);


ALTER TABLE "public"."quiz_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_responses" (
    "assessment_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "selected" "text",
    "is_correct" boolean
);


ALTER TABLE "public"."quiz_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quiz_id" "uuid",
    "skill_id" "uuid",
    "order_index" integer
);


ALTER TABLE "public"."quiz_sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quizzes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid",
    "estimated_minutes" integer DEFAULT 15,
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."quizzes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_features" (
    "assessment_id" "uuid" NOT NULL,
    "extracted_skills" "jsonb",
    "notes" "text"
);


ALTER TABLE "public"."resume_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "about_url" "text",
    "city" "text",
    "state" "text"
);


ALTER TABLE "public"."schools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."skill_aliases" (
    "skill_id" "uuid" NOT NULL,
    "alias" "text" NOT NULL
);


ALTER TABLE "public"."skill_aliases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "onet_id" "text",
    "category" "text",
    "description" "text",
    "lightcast_id" "text",
    "source" "text" DEFAULT 'ONET/LIGHTCAST'::"text",
    "source_version" "text"
);


ALTER TABLE "public"."skills" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_skill_results"
    ADD CONSTRAINT "assessment_skill_results_pkey" PRIMARY KEY ("assessment_id", "skill_id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cip_codes"
    ADD CONSTRAINT "cip_codes_pkey" PRIMARY KEY ("cip_code");



ALTER TABLE ONLY "public"."cip_soc_crosswalk"
    ADD CONSTRAINT "cip_soc_crosswalk_pkey" PRIMARY KEY ("cip_code", "soc_code");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_job_openings"
    ADD CONSTRAINT "company_job_openings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "company_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "company_users_unique" UNIQUE ("user_id", "company_id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id", "entity_kind", "entity_id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_skills"
    ADD CONSTRAINT "job_skills_pkey" PRIMARY KEY ("job_id", "skill_id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."program_skills"
    ADD CONSTRAINT "program_skills_pkey" PRIMARY KEY ("program_id", "skill_id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_responses"
    ADD CONSTRAINT "quiz_responses_pkey" PRIMARY KEY ("assessment_id", "question_id");



ALTER TABLE ONLY "public"."quiz_sections"
    ADD CONSTRAINT "quiz_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_features"
    ADD CONSTRAINT "resume_features_pkey" PRIMARY KEY ("assessment_id");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skill_aliases"
    ADD CONSTRAINT "skill_aliases_pkey" PRIMARY KEY ("skill_id", "alias");



ALTER TABLE ONLY "public"."skills"
    ADD CONSTRAINT "skills_lightcast_id_key" UNIQUE ("lightcast_id");



ALTER TABLE ONLY "public"."skills"
    ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");



CREATE INDEX "gin_resume_features_skills" ON "public"."resume_features" USING "gin" ("extracted_skills" "jsonb_path_ops");



CREATE INDEX "idx_asr_assessment" ON "public"."assessment_skill_results" USING "btree" ("assessment_id");



CREATE INDEX "idx_asr_skill" ON "public"."assessment_skill_results" USING "btree" ("skill_id");



CREATE INDEX "idx_assess_job_time" ON "public"."assessments" USING "btree" ("job_id", "analyzed_at" DESC);



CREATE INDEX "idx_assess_user_time" ON "public"."assessments" USING "btree" ("user_id", "analyzed_at" DESC);



CREATE INDEX "idx_cipsoc_soc" ON "public"."cip_soc_crosswalk" USING "btree" ("soc_code");



CREATE INDEX "idx_company_users_company_id" ON "public"."company_users" USING "btree" ("company_id");



CREATE INDEX "idx_company_users_user_id" ON "public"."company_users" USING "btree" ("user_id");



CREATE INDEX "idx_job_skills_skill" ON "public"."job_skills" USING "btree" ("skill_id");



CREATE INDEX "idx_jobs_category" ON "public"."jobs" USING "btree" ("category");



CREATE INDEX "idx_jobs_company" ON "public"."jobs" USING "btree" ("company_id");



CREATE INDEX "idx_jobs_company_id" ON "public"."jobs" USING "btree" ("company_id");



CREATE INDEX "idx_jobs_is_featured" ON "public"."jobs" USING "btree" ("is_featured");



CREATE INDEX "idx_jobs_job_kind" ON "public"."jobs" USING "btree" ("job_kind");



CREATE INDEX "idx_jobs_kind" ON "public"."jobs" USING "btree" ("job_kind");



CREATE INDEX "idx_jobs_soc" ON "public"."jobs" USING "btree" ("soc_code");



CREATE INDEX "idx_openings_soc" ON "public"."company_job_openings" USING "btree" ("soc_code");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_prog_skills_skill" ON "public"."program_skills" USING "btree" ("skill_id");



CREATE INDEX "idx_programs_cip" ON "public"."programs" USING "btree" ("cip_code");



CREATE INDEX "idx_programs_school" ON "public"."programs" USING "btree" ("school_id");



CREATE OR REPLACE TRIGGER "handle_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "t_asr_recompute" AFTER INSERT OR DELETE OR UPDATE ON "public"."assessment_skill_results" FOR EACH ROW EXECUTE FUNCTION "public"."trg_assessment_results_changed"();



CREATE OR REPLACE TRIGGER "t_assess_owner_default" BEFORE INSERT ON "public"."assessments" FOR EACH ROW EXECUTE FUNCTION "public"."trg_assessment_owner_default"();



CREATE OR REPLACE TRIGGER "trigger_cleanup_job_favorites" AFTER DELETE OR UPDATE OF "status" ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."cleanup_job_favorites"();



CREATE OR REPLACE TRIGGER "trigger_cleanup_program_favorites" AFTER DELETE OR UPDATE OF "status" ON "public"."programs" FOR EACH ROW EXECUTE FUNCTION "public"."cleanup_program_favorites"();



ALTER TABLE ONLY "public"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assessment_skill_results"
    ADD CONSTRAINT "assessment_skill_results_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_skill_results"
    ADD CONSTRAINT "assessment_skill_results_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cip_soc_crosswalk"
    ADD CONSTRAINT "cip_soc_crosswalk_cip_code_fkey" FOREIGN KEY ("cip_code") REFERENCES "public"."cip_codes"("cip_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_job_openings"
    ADD CONSTRAINT "company_job_openings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."company_users"
    ADD CONSTRAINT "company_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."job_skills"
    ADD CONSTRAINT "job_skills_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_skills"
    ADD CONSTRAINT "job_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id");



ALTER TABLE ONLY "public"."program_skills"
    ADD CONSTRAINT "program_skills_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_skills"
    ADD CONSTRAINT "program_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_cip_code_fkey" FOREIGN KEY ("cip_code") REFERENCES "public"."cip_codes"("cip_code");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."quiz_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_responses"
    ADD CONSTRAINT "quiz_responses_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_responses"
    ADD CONSTRAINT "quiz_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_sections"
    ADD CONSTRAINT "quiz_sections_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_sections"
    ADD CONSTRAINT "quiz_sections_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_features"
    ADD CONSTRAINT "resume_features_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skill_aliases"
    ADD CONSTRAINT "skill_aliases_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete jobs based on role" ON "public"."jobs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."admin_role" = 'super_admin'::"text") OR (("p"."admin_role" = 'company_admin'::"text") AND ("p"."company_id" = "jobs"."company_id")))))));



CREATE POLICY "Admins can delete programs based on role" ON "public"."programs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."admin_role" = 'super_admin'::"text") OR (("p"."admin_role" = 'provider_admin'::"text") AND ("p"."school_id" = "programs"."school_id")))))));



CREATE POLICY "Admins can insert their own audit logs" ON "public"."admin_audit_logs" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Admins can manage job skills based on job access" ON "public"."job_skills" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."jobs" "j" ON (("j"."id" = "job_skills"."job_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."admin_role" = 'super_admin'::"text") OR (("p"."admin_role" = 'company_admin'::"text") AND ("p"."company_id" = "j"."company_id")))))));



CREATE POLICY "Admins can manage program skills based on program access" ON "public"."program_skills" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."programs" "pr" ON (("pr"."id" = "program_skills"."program_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."admin_role" = 'super_admin'::"text") OR (("p"."admin_role" = 'provider_admin'::"text") AND ("p"."school_id" = "pr"."school_id")))))));



CREATE POLICY "Admins can update jobs based on role" ON "public"."jobs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."admin_role" = 'super_admin'::"text") OR (("p"."admin_role" = 'company_admin'::"text") AND ("p"."company_id" = "jobs"."company_id")))))));



CREATE POLICY "Admins can update programs based on role" ON "public"."programs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."admin_role" = 'super_admin'::"text") OR (("p"."admin_role" = 'provider_admin'::"text") AND ("p"."school_id" = "programs"."school_id")))))));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING (("public"."get_my_admin_role"() IS NOT NULL));



CREATE POLICY "Admins can view jobs based on role" ON "public"."jobs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."admin_role" = 'super_admin'::"text") OR (("p"."admin_role" = 'company_admin'::"text") AND ("p"."company_id" = "jobs"."company_id")))))));



CREATE POLICY "Admins can view programs based on role" ON "public"."programs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."admin_role" = 'super_admin'::"text") OR (("p"."admin_role" = 'provider_admin'::"text") AND ("p"."school_id" = "programs"."school_id")))))));



CREATE POLICY "Admins can view skills" ON "public"."skills" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."admin_role" IS NOT NULL)))));



CREATE POLICY "Company admins can insert roles with limits" ON "public"."jobs" FOR INSERT WITH CHECK ((("job_kind" = 'featured_role'::"public"."job_kind") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."admin_role" = 'super_admin'::"text") OR (("p"."admin_role" = 'company_admin'::"text") AND ("p"."company_id" = "jobs"."company_id") AND ("public"."count_company_roles"("p"."company_id") < 10))))))));



CREATE POLICY "Org users can view their company associations" ON "public"."company_users" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Partner admins can view basic user assessments" ON "public"."assessments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p1",
    "public"."profiles" "p2"
  WHERE (("p1"."id" = "auth"."uid"()) AND ("p1"."role" = 'partner_admin'::"public"."user_role") AND ("p2"."id" = "assessments"."user_id") AND ("p2"."role" = 'basic_user'::"public"."user_role")))));



CREATE POLICY "Provider admins can insert programs with limits" ON "public"."programs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (("p"."admin_role" = 'super_admin'::"text") OR (("p"."admin_role" = 'provider_admin'::"text") AND ("p"."school_id" = "programs"."school_id") AND ("public"."count_provider_programs"("p"."school_id") < 300)))))));



CREATE POLICY "Super Admins can view all audit logs" ON "public"."admin_audit_logs" FOR SELECT USING (true);



CREATE POLICY "Super admins can manage all company users" ON "public"."company_users" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"public"."user_role")))));



CREATE POLICY "Super admins can manage assessments" ON "public"."assessments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."admin_role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins can manage companies" ON "public"."companies" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."admin_role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins can manage schools" ON "public"."schools" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."admin_role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins can manage skills" ON "public"."skills" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."admin_role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins can view all assessments" ON "public"."assessments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"public"."user_role")))));



CREATE POLICY "Users can delete own favorites" ON "public"."favorites" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own favorites" ON "public"."favorites" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own favorites" ON "public"."favorites" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."admin_audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "asr_del_owner" ON "public"."assessment_skill_results" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."assessments" "a"
  WHERE (("a"."id" = "assessment_skill_results"."assessment_id") AND ("a"."user_id" = "auth"."uid"())))));



CREATE POLICY "asr_ins_owner" ON "public"."assessment_skill_results" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."assessments" "a"
  WHERE (("a"."id" = "assessment_skill_results"."assessment_id") AND ("a"."user_id" = "auth"."uid"())))));



CREATE POLICY "asr_sel_owner" ON "public"."assessment_skill_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."assessments" "a"
  WHERE (("a"."id" = "assessment_skill_results"."assessment_id") AND ("a"."user_id" = "auth"."uid"())))));



CREATE POLICY "asr_upd_owner" ON "public"."assessment_skill_results" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."assessments" "a"
  WHERE (("a"."id" = "assessment_skill_results"."assessment_id") AND ("a"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."assessments" "a"
  WHERE (("a"."id" = "assessment_skill_results"."assessment_id") AND ("a"."user_id" = "auth"."uid"())))));



CREATE POLICY "assess_del_owner" ON "public"."assessments" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "assess_ins_owner" ON "public"."assessments" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "assess_sel_owner" ON "public"."assessments" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "assess_upd_owner" ON "public"."assessments" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."assessment_skill_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fav_del_owner" ON "public"."favorites" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "fav_ins_owner" ON "public"."favorites" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "fav_sel_owner" ON "public"."favorites" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fb_ins_owner" ON "public"."feedback" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "fb_sel_owner" ON "public"."feedback" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "qr_del_owner" ON "public"."quiz_responses" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."assessments" "a"
  WHERE (("a"."id" = "quiz_responses"."assessment_id") AND ("a"."user_id" = "auth"."uid"())))));



CREATE POLICY "qr_ins_owner" ON "public"."quiz_responses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."assessments" "a"
  WHERE (("a"."id" = "quiz_responses"."assessment_id") AND ("a"."user_id" = "auth"."uid"())))));



CREATE POLICY "qr_sel_owner" ON "public"."quiz_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."assessments" "a"
  WHERE (("a"."id" = "quiz_responses"."assessment_id") AND ("a"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."quiz_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_features" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rf_ins_owner" ON "public"."resume_features" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."assessments" "a"
  WHERE (("a"."id" = "resume_features"."assessment_id") AND ("a"."user_id" = "auth"."uid"())))));



CREATE POLICY "rf_sel_owner" ON "public"."resume_features" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."assessments" "a"
  WHERE (("a"."id" = "resume_features"."assessment_id") AND ("a"."user_id" = "auth"."uid"())))));



CREATE POLICY "rf_upd_owner" ON "public"."resume_features" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."assessments" "a"
  WHERE (("a"."id" = "resume_features"."assessment_id") AND ("a"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."assessments" "a"
  WHERE (("a"."id" = "resume_features"."assessment_id") AND ("a"."user_id" = "auth"."uid"())))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."cleanup_job_favorites"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_job_favorites"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_job_favorites"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_program_favorites"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_program_favorites"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_program_favorites"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_company_roles"("company_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."count_company_roles"("company_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_company_roles"("company_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_provider_programs"("school_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."count_provider_programs"("school_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_provider_programs"("school_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_compute_readiness"("p_assessment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_compute_readiness"("p_assessment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_compute_readiness"("p_assessment_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_favorite_jobs"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_favorite_jobs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_favorite_jobs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_favorite_jobs_with_company"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_favorite_jobs_with_company"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_favorite_jobs_with_company"() TO "service_role";



GRANT ALL ON TABLE "public"."programs" TO "anon";
GRANT ALL ON TABLE "public"."programs" TO "authenticated";
GRANT ALL ON TABLE "public"."programs" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_favorite_programs"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_favorite_programs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_favorite_programs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_favorite_programs_with_school"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_favorite_programs_with_school"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_favorite_programs_with_school"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_admin_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_admin_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_admin_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_assessment_owner_default"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_assessment_owner_default"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_assessment_owner_default"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_assessment_results_changed"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_assessment_results_changed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_assessment_results_changed"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_skill_results" TO "anon";
GRANT ALL ON TABLE "public"."assessment_skill_results" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_skill_results" TO "service_role";



GRANT ALL ON TABLE "public"."assessments" TO "anon";
GRANT ALL ON TABLE "public"."assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."assessments" TO "service_role";



GRANT ALL ON TABLE "public"."cip_codes" TO "anon";
GRANT ALL ON TABLE "public"."cip_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."cip_codes" TO "service_role";



GRANT ALL ON TABLE "public"."cip_soc_crosswalk" TO "anon";
GRANT ALL ON TABLE "public"."cip_soc_crosswalk" TO "authenticated";
GRANT ALL ON TABLE "public"."cip_soc_crosswalk" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."company_job_openings" TO "anon";
GRANT ALL ON TABLE "public"."company_job_openings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_job_openings" TO "service_role";



GRANT ALL ON TABLE "public"."company_users" TO "anon";
GRANT ALL ON TABLE "public"."company_users" TO "authenticated";
GRANT ALL ON TABLE "public"."company_users" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."job_skills" TO "anon";
GRANT ALL ON TABLE "public"."job_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."job_skills" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."program_skills" TO "anon";
GRANT ALL ON TABLE "public"."program_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."program_skills" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_questions" TO "anon";
GRANT ALL ON TABLE "public"."quiz_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_questions" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_responses" TO "anon";
GRANT ALL ON TABLE "public"."quiz_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_responses" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_sections" TO "anon";
GRANT ALL ON TABLE "public"."quiz_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_sections" TO "service_role";



GRANT ALL ON TABLE "public"."quizzes" TO "anon";
GRANT ALL ON TABLE "public"."quizzes" TO "authenticated";
GRANT ALL ON TABLE "public"."quizzes" TO "service_role";



GRANT ALL ON TABLE "public"."resume_features" TO "anon";
GRANT ALL ON TABLE "public"."resume_features" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_features" TO "service_role";



GRANT ALL ON TABLE "public"."schools" TO "anon";
GRANT ALL ON TABLE "public"."schools" TO "authenticated";
GRANT ALL ON TABLE "public"."schools" TO "service_role";



GRANT ALL ON TABLE "public"."skill_aliases" TO "anon";
GRANT ALL ON TABLE "public"."skill_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."skill_aliases" TO "service_role";



GRANT ALL ON TABLE "public"."skills" TO "anon";
GRANT ALL ON TABLE "public"."skills" TO "authenticated";
GRANT ALL ON TABLE "public"."skills" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
