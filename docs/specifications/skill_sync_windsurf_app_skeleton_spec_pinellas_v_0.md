# SkillSync — Windsurf App Skeleton Spec (Pinellas v0)

> **Purpose:** This Markdown is a hand-off to Windsurf (and any human dev) to scaffold the SkillSync MVP app skeleton. It includes tech stack choices, routes, components, schema/API wiring, LLM functions, ETL jobs, and a turnkey prompt for Windsurf to generate the initial codebase.

---

## 1) Product & Tech Overview

**Goal:** Prove the end-to-end loop for one market (Pinellas County, FL): select role/occupation → assess (quiz or resume) → compute readiness → surface gaps → match programs.

**Key principles**

- **Unified job model**: one `jobs` table for both *Featured Roles* and *Occupations*, distinguished by `job_kind`.
- **Skills backbone**: O\*NET-aligned `skills`; map jobs & programs via `job_skills` and `program_skills`. CIP↔SOC crosswalk bridges programs→occupations.
- **Privacy**: never store resume files; persist normalized features only.
- **Deterministic scoring**: MCQs graded without the LLM; LLM is used for skills extraction + short summary only.

**Stack**

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + **shadcn/ui** components (Radix under the hood); Tailwind UI layout patterns
- **Charts**: **MUI X Charts** (`@mui/x-charts`) for pie + horizontal bars + small gauge
- **Data**: Supabase (Postgres + Auth + Edge Functions)
- **State/Data fetching**: TanStack Query
- **LLM**: OpenAI (extractor + summary) with switchable OSS path via feature flag later

---

## 2) Monorepo (or single-app) File Layout

For MVP, a single Next.js app is fine. Add packages later if needed.

```
skillsync/
  .env.local.example
  package.json
  next.config.mjs
  postcss.config.cjs
  tailwind.config.cjs
  tsconfig.json
  prisma/ (optional)  
  src/
    app/
      layout.tsx
      page.tsx                 # Dashboard
      jobs/
        page.tsx               # Jobs (tabs: Featured | High-Demand | Favorites)
        [id]/page.tsx          # Job Detail (works for featured_role or occupation)
      programs/
        page.tsx               # Programs (tabs: Featured | All | Favorites)
      program-matches/
        [assessmentId]/page.tsx
      assessments/
        [id]/page.tsx          # Readiness report
      my-assessments/page.tsx
      api/ (route handlers if needed)
    components/
      cards/
        SnapshotCard.tsx
        ProficiencyBreakdownCard.tsx
        JobCard.tsx
        ProgramCard.tsx
      charts/
        ReadinessGauge.tsx
        SkillBars.tsx
        BreakdownPie.tsx
      ui/ (shadcn generated components)
      FeedbackModal.tsx
      UserMenu.tsx
      ResumeDropzone.tsx
    lib/
      supabaseClient.ts
      api.ts                   # typed wrappers for Supabase + Edge Functions
      readiness.ts             # banding + calculations
      routes.ts                # urls and helpers
      types.ts
    hooks/
      useAssessment.ts
      useFavorites.ts
  supabase/
    functions/                 # Edge functions (deploy via Supabase)
      etl_onet_soc_skills/
      etl_onet_cip_crosswalk/
      etl_careeronestop_programs_pinellas/
      etl_bls_oews_msa/
      llm_extract_skills/
      llm_readiness_summary/
      llm_generate_quiz/
```

---

## 3) Environment Variables (.env.local.example)

```
# Next.js client
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-side (set in Supabase as well)
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL_EXTRACTOR=gpt-4o-mini
OPENAI_MODEL_SUMMARY=gpt-4o-mini
OPENAI_EMBED_MODEL=text-embedding-3-small
SKILL_MATCH_THRESHOLD=0.82

# Optional (ETL)
ONET_API_KEY=
BLS_API_KEY=
COS_USERID=
COS_TOKEN=
```

---

## 4) Database Schema (Supabase / Postgres)

Use the provided `schema.sql` from the seed pack (skills, jobs, programs, etc.). Highlights:

- `jobs(job_kind enum('featured_role','occupation'), soc_code, company_id?)`
- `skills` (O\*NET-aligned)
- `job_skills`, `program_skills`
- `programs` with `cip_code` and `schools`
- `cip_codes`, `cip_soc_crosswalk`
- `assessments`, `assessment_skill_results`, `resume_features`
- `quizzes`, `quiz_sections`, `quiz_questions`, `quiz_responses`
- `favorites`, `feedback`, `companies`, `company_job_openings`

**RLS (minimum)**

- `assessments`, `assessment_skill_results`, `resume_features`, `quiz_responses`: only owner can read/write (match `auth.uid()`).
- `favorites`, `feedback`: only owner can read/write their rows.
- Reference tables (skills/jobs/programs/etc.) are readable to all.

---

## 5) Seed Data & ETL

- Import CSVs from **SkillSync Seed Pack v0** in this order:
  1. `skills` → `companies` → `jobs` → `job_skills`
  2. `schools` → `cip_codes` → `programs` → `program_skills`
  3. `cip_soc_crosswalk`
  4. `quizzes` → `quiz_sections` → `quiz_questions`
- Deploy Edge Functions (stubs included) and schedule:
  - O\*NET SOC/skills + CIP↔SOC → **monthly**
  - CareerOneStop programs (Pinellas) → **weekly**
  - BLS OEWS wages (MSA) → **annual**

---

## 6) API Layer (App → Supabase)

Prefer **typed wrappers** in `src/lib/api.ts` using supabase-js + fetch to Edge Functions.

**Jobs**

- `listJobs(kind?: 'featured_role'|'occupation', region?: string)`
- `getJob(id: string)` (include SOC + sponsor panel + `job_skills`)

**Assessments**

- `createAssessment(jobId: string, method: 'resume'|'quiz')`
- `submitQuiz(assessmentId: string, responses)` → autograde → writes `assessment_skill_results` & `assessments.readiness_pct` + `status_tag`
- `extractResumeSkills(assessmentId: string, text: string, jobId?: string)` → call `/functions/v1/llm_extract_skills` then compute skill scores
- `summarizeReadiness(assessmentId: string)` → call `/functions/v1/llm_readiness_summary`

**Matches**

- `getProgramMatches(assessmentId: string)` → join gap skills to `program_skills`, rank by coverage + fit

**Favorites**

- `toggleFavorite(kind: 'job'|'program', id: string)`
- `listFavorites(kind)`

**Feedback**

- `createFeedback({ sentiment, score_int, text })`

---

## 7) Readiness & Banding

- Per-skill bands: `>=85 → proficient`, `50–84 → building`, `<50 → needs_dev`
- Overall readiness = weighted mean across assessed skills (equal weights v0)
- Status tag: `role_ready` / `close_gaps` / `needs_development`
- Snapshot cards compute from latest user assessments + results

`src/lib/readiness.ts`

```ts
export type Band = 'proficient'|'building'|'needs_dev';
export const toBand = (pct:number): Band => pct>=85?'proficient': pct>=50?'building':'needs_dev';
```

---

## 8) UI Routes & Components

### Dashboard (`/`)

- **Snapshot cards**: Roles Ready, Overall Readiness, Skills Identified, Gaps Highlighted
- **ProficiencyBreakdownCard**: MUI Pie (proficient/building/needs\_dev) + AI 2–3 sentence summary + deep links: *Strongest Skill* and *Nearest to Proficiency*
- **Saved lists**: Jobs & Programs (favorites)

### Jobs (`/jobs`)

- Tabs: **Featured Roles** (sponsor cards), **High-Demand Occupations** (table), **Favorites**
- **JobCard**: logo, trusted badge, title, job category/type, mapped skills count, short desc, median wage, *About Company* dialog, **Details** CTA
- High-Demand table columns: *Occupation*, *Summary*, *Category*, *Median Salary*, *Readiness* (Assess | Close Gaps | Ready), *Actions*

### Job Detail (`/jobs/[id]`)

- Header: SOC code + Favorite
- Conditional **Sponsor panel** (featured roles only): logo + trusted badge + About Company dialog
- **Overview**: tags (category, type, skills count), salary/location/education/growth (when available), long description, featured image
- **Skills & Responsibilities**: core skills list; responsibilities bullets; related titles (occupations only)
- **Take your free skills assessment**: **Upload Resume** (resume→extract) | **Start Quiz** (sections per skill)
- **Who’s hiring** (occupations): sponsor logos by matching SOC

### Assessment Report (`/assessments/[id]`)

- Title + dynamic sentence: “You’ve demonstrated X of Y core skills.”
- Readiness **%** + 10-bar gauge (MUI bar chart styled as gauge)
- AI summary (2–3 sentences)
- **SkillBars**: horizontal bars for each skill with band labels
- Stepper badge: program matches count
- CTA: **View Program Matches**

### Program Matches (`/program-matches/[assessmentId]`)

- Card list: **ProgramCard** (school logo/name, program name, tags: type/format/duration, description, mapped skills, external links to *About School* and *Program Details*)

### Programs (`/programs`)

- Tabs: **Featured**, **All** (table columns: Name, Summary, Type, Format, Duration, School, Skills Provided, Actions), **Favorites**

### My Assessments (`/my-assessments`)

- Cards: job/kind, readiness %, status tag, method badge (quiz/resume), analyzed date, skills gaps count, next-step CTA (Share score | View programs | Retake/Upload)

### Global

- **UserMenu**: Account Settings, My Assessments, Saved Jobs, Saved Programs, Sign out
- **FeedbackModal**: 3 emoji (like/neutral/dislike) + optional text

---

## 9) shadcn/ui & Tailwind Setup

1. Install Tailwind & shadcn generator; generate components you need (Button, Card, Tabs, Dialog, Table, Badge, Avatar, Dropdown, Sheet, Toast).
2. Use Tailwind UI layouts for responsive grids and tables.
3. Styling preferences: large radii (rounded-2xl), soft shadows, adequate padding (p-4+), grid-based layouts.

Example: `JobCard.tsx`

```tsx
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export function JobCard({ logo, trusted, title, category, type, skillsCount, desc, wage, onDetails }: any){
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        {logo && <Image src={logo} alt="logo" width={40} height={40} className="rounded"/>}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            {trusted && <Badge variant="secondary">Trusted Partner</Badge>}
          </div>
          <div className="text-sm text-muted-foreground flex gap-2">
            <span>{category}</span>•<span>{type}</span>•<span>{skillsCount} skills</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">{desc}</p>
        {wage && <p className="text-sm text-muted-foreground">Median salary: ${'{'}wage.toLocaleString(){'}'}</p>}
      </CardContent>
      <CardFooter>
        <button className="btn btn-primary" onClick={onDetails}>Role details</button>
      </CardFooter>
    </Card>
  );
}
```

---

## 10) MUI X Charts Components

- **BreakdownPie.tsx**: `PieChart` with 3 slices (proficient/building/needs)
- **SkillBars.tsx**: `BarChart` horizontal; one bar per skill with % labels
- **ReadinessGauge.tsx**: simple 10-rect gauge (or `Gauge` from X Charts if preferred)

Minimal example (bars):

```tsx
'use client';
import { BarChart } from '@mui/x-charts/BarChart';

export function SkillBars({ data }:{ data:{label:string; pct:number}[] }){
  return (
    <BarChart
      dataset={data.map(d=>({ skill:d.label, pct:d.pct }))}
      yAxis={[{ scaleType: 'band', dataKey:'skill' }]}
      series={[{ dataKey:'pct', valueFormatter:(v)=>`${v}%` }]}
      layout="horizontal"
      height={320}
    />
  );
}
```

---

## 11) Supabase Client & API Helpers

`src/lib/supabaseClient.ts`

```ts
import { createBrowserClient } from '@supabase/ssr';
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

`src/lib/api.ts` (sketch)

```ts
export async function createAssessment(jobId:string, method:'resume'|'quiz'){
  // insert into assessments and return id
}
export async function extractResumeSkills(assessmentId:string, text:string, jobId?:string){
  const res = await fetch(`/functions/v1/llm_extract_skills?assessment_id=${assessmentId}`,{
    method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({ resume_text: text, job_id: jobId })
  });
  return res.json();
}
```

---

## 12) Quiz — Deterministic Scoring

- Questions have `answer_key` (A/B/C/D). When submitting, mark `is_correct` and compute per-skill % from section grouping.
- Write `assessment_skill_results` with band per skill, then compute `assessments.readiness_pct` and `status_tag`.

---

## 13) Program Matching — Ranking Heuristic v0

- Determine *gap skills* = skills with band ≠ `proficient`
- Score each program by sum of `program_skills.weight` for gap skills (normalize by total gaps); tie-breakers: program type, provider region proximity
- Return top N programs (e.g., 10)

---

## 14) LLM Edge Functions (Supabase)

- `llm_extract_skills`: POST `{ resume_text, job_id? }` → exact/alias match → embedding fallback → (optional) upsert to `resume_features`
- `llm_readiness_summary`: POST `{ assessment_id }` → 2–3 sentence encouragement summary
- `llm_generate_quiz` (optional): scaffolds MCQs per skill for a job

**Cost control**: pre-embed canonical `skills.name` once; rate-limit LLM routes.

---

## 15) Freshness & Caching

- Users only hit **our DB**. External data mirrored via ETL with `source_version` & `fetched_at`.
- Cadence: O\*NET monthly, CareerOneStop weekly (Pinellas), BLS annual, CIP one-time.

---

## 16) MVP Definition of Done (DoD)

- Can sign up/sign in; header greets user correctly
- Jobs page: Featured roles; High-Demand table (seeded); Favorites
- Job Detail works for both kinds; Sponsor panel conditional
- Resume upload → extraction → Readiness report with bars, pie, summary → Program matches list
- Quiz flow → same report → matches
- My Assessments & Feedback modal operational

---

## 17) Windsurf “Build-the-Skeleton” Prompt (paste into Windsurf)

```
You are Windsurf, building the SkillSync MVP skeleton in Next.js 14 + TypeScript with Tailwind, shadcn/ui, and MUI X Charts.

**Objectives**
1) Scaffold the routes and components described in the attached spec.
2) Wire Supabase auth and typed data access.
3) Implement Dashboard (snapshot cards + proficiency breakdown), Jobs (tabs), Job Detail (unified), Assessment Report, Program Matches, Programs, and My Assessments.
4) Add minimal calls to Supabase tables and Edge Functions (stubs; mock where missing).
5) Ensure resume upload uses plain text only and calls `/functions/v1/llm_extract_skills`.
6) Implement deterministic quiz grading and readiness computation on submit.
7) Use shadcn/ui for UI primitives and @mui/x-charts for charts.

**Constraints**
- Do not store resume files.
- Use the banding \(>=85 proficient, 50–84 building, <50 needs_dev\).
- Keep code modular: components/cards, charts, hooks.

**Deliverables**
- Next.js app with routes as in spec
- Tailwind + shadcn configured; base components generated
- Supabase client + simple API wrappers
- Working demo with seed data: Dashboard → Job Detail → Assessment Report → Program Matches
- Readme instructions to import CSV seeds and run
```

---

## 18) Runbook

1. Create project from this spec; install deps: `next`, `react`, `tailwindcss`, `@mui/x-charts`, `@tanstack/react-query`, `@supabase/supabase-js`.
2. Configure Tailwind + shadcn; generate Button, Card, Tabs, Dialog, Table, Badge, Avatar, Dropdown, Sheet, Toast.
3. Paste env vars.
4. Import schema + CSV seeds.
5. Deploy Edge Functions (LLM + ETL stubs); set schedules.
6. `pnpm dev` and click through the flow.

---

## 19) Open-Source LLMs (TODO — logged)

Optional future: FlashText/SkillNER + embeddings as pre-LLM extractor; feature flag for OSS summarizer (Llama/Mistral). Not in MVP.

---

**End of Spec**

