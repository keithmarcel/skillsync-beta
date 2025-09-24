# SkillSync Seed Pack v0 (Pinellas-first)

This pack includes:
- **SQL schema** (`sql/schema.sql`)
- **Seed CSVs** (skills, companies, jobs, job_skills, schools, programs, program_skills, CIP codes, CIP<->SOC, quizzes, sections, questions)
- **Edge Function stubs** for ETL:
  - `etl_onet_soc_skills.ts`
  - `etl_onet_cip_crosswalk.ts`
  - `etl_careeronestop_programs_pinellas.ts`
  - `etl_bls_oews_msa.ts`

## Import order (Supabase)
1. Run `sql/schema.sql`.
2. Import CSVs in this order:
   - `skills.csv`
   - `companies.csv`
   - `jobs.csv`
   - `job_skills.csv`
   - `schools.csv`
   - `cip_codes.csv`
   - `programs.csv`
   - `program_skills.csv`
   - `cip_soc_crosswalk.csv`
   - `quizzes.csv` → `quiz_sections.csv` → `quiz_questions.csv`

## Readiness & Bands
- `>= 85` → **proficient**
- `50–84` → **building**
- `< 50` → **needs_dev**

## Freshness Strategy
Mirror third-party data to your DB; never call third-party at render time.
- O*NET skills/SOC & crosswalk: **monthly** scheduled ETL
- CareerOneStop programs: **weekly** for Pinellas
- BLS OEWS wages: **annual**
- NCES CIP: **one-time**
- Optional: Lightcast Open Skills synonyms: **biweekly**

## Windsurf UI Stack
- **shadcn/ui** (headless + Radix-based components)
- **Tailwind CSS** (utility classes; Tailwind UI patterns encouraged)
- **MUI Charts** (bar, pie, gauge) for Readiness report & Snapshot

### Quick notes
- Favor server-computed readiness; client may show optimistic UI.
- Do **not** store resume files; store extracted features only.
- `jobs` unifies featured roles + occupations via `job_kind`.

— Generated 2025-08-20T05:08:24.797398Z
