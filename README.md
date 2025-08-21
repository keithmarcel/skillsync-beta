# SkillSync MVP

A skills assessment and job matching platform for Pinellas County, FL.

## Features

- Skills assessments via resume upload or quiz
- Job matching (Featured Roles + High-Demand Occupations)
- Educational program recommendations based on skill gaps
- Readiness scoring with proficiency bands

## Tech Stack

- Next.js 14 + TypeScript
- Tailwind CSS + shadcn/ui components
- MUI X Charts for data visualization
- Supabase (Postgres + Auth + Edge Functions)
- OpenAI for skills extraction and summaries

## Getting Started

1. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your API keys in `.env.local`

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Database Setup

1. Import the schema from `docs/db/supabase_schema.sql`
2. Import seed data CSVs (when available)
3. Deploy Edge Functions for LLM operations

## Architecture

- Unified jobs table with `job_kind` enum (featured_role/occupation)
- Skills backbone with O*NET alignment
- CIP↔SOC crosswalk for programs→occupations mapping
- Assessment system with deterministic quiz scoring
- Program matching based on skill gaps
