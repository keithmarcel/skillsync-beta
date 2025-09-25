# SkillSync Skills Taxonomy & API Integration Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for establishing skills as the universal currency across SkillSync. Skills will power quiz generation, program recommendations, assessment scoring, and the entire user journey. The plan prioritizes skills taxonomy as the foundation, followed by quiz generation and API integrations.

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Strategic Implementation Plan](#strategic-implementation-plan)
3. [Phase 1: Skills Taxonomy Foundation](#phase-1-skills-taxonomy-foundation)
4. [Phase 2: Quiz Generation Pipeline](#phase-2-quiz-generation-pipeline)
5. [Phase 3: API Ecosystem Integration](#phase-3-api-ecosystem-integration)
6. [Phase 4: User Experience Completion](#phase-4-user-experience-completion)
7. [Technical Specifications](#technical-specifications)
8. [Success Metrics & Testing](#success-metrics--testing)

## Current State Assessment

### ✅ What's Working
- Jobs table with SOC codes for all entries (featured roles + occupations)
- Unified job schema supporting both job types
- Strong database patterns (RPC functions, RLS, migrations)
- Admin tools specification includes skills management requirements
- Basic assessment table exists but lacks quiz infrastructure

### ❌ What's Missing
- **NO skills infrastructure** - No skills table, no job-skill mappings
- **NO quiz/assessment system** - No questions, scoring logic, or generation pipeline
- **API integrations are stubs** - Edge functions exist but not implemented
- **Skills relationships** - No connections between skills, jobs, and programs

### 📊 Key Requirements
- **5-8 skills per SOC code** (no subcategories)
- **SOC codes for all jobs** (already implemented)
- **Skills as universal currency** for quizzes, recommendations, scoring
- **Real-time API data** from O*NET, BLS, Career One Stop
- **AI-powered quiz generation** based on required skills

## Strategic Implementation Plan

### Core Philosophy
Skills are the universal currency. Everything connects through skills:
- Jobs require skills → Skills power quizzes → Quizzes generate assessments → Assessments drive recommendations → Programs fill skill gaps

### Implementation Priority
1. **Skills Taxonomy** (Foundation) - Tables, relationships, basic data
2. **Quiz Generation** (Core Feature) - AI-powered assessment creation
3. **API Ecosystem** (Data Pipeline) - O*NET, BLS, Career One Stop integration
4. **User Experience** (Polish) - My Assessments, Dashboard, Admin Tools

### Timeline Estimate
- **Phase 1**: 2-3 weeks (Skills infrastructure)
- **Phase 2**: 2-3 weeks (Quiz/assessment system)
- **Phase 3**: 1-2 weeks (API ecosystem)
- **Phase 4**: 1-2 weeks (UI completion)

## Phase 1: Skills Taxonomy Foundation

### 1.1 Database Schema Implementation

#### Skills Table
```sql
CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  onet_id text UNIQUE, -- O*NET skill identifier
  category text NOT NULL, -- Business, Operations, Analytics, Technical, etc.
  description text,
  proficiency_levels jsonb DEFAULT '{
    "beginner": "Basic understanding and application",
    "intermediate": "Solid working knowledge with some independence",
    "expert": "Advanced mastery and ability to teach others"
  }'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_onet_id ON skills(onet_id);
CREATE INDEX idx_skills_active ON skills(is_active);
```

#### Job-Skills Relationships
```sql
CREATE TABLE job_skills (
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  importance_level text NOT NULL CHECK (importance_level IN ('critical', 'important', 'helpful')),
  proficiency_threshold integer DEFAULT 70 CHECK (proficiency_threshold >= 0 AND proficiency_threshold <= 100),
  weight numeric DEFAULT 1.0 CHECK (weight > 0),
  onet_data_source jsonb, -- Store original O*NET data for reference
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (job_id, skill_id)
);

-- Indexes
CREATE INDEX idx_job_skills_job_id ON job_skills(job_id);
CREATE INDEX idx_job_skills_skill_id ON job_skills(skill_id);
CREATE INDEX idx_job_skills_importance ON job_skills(importance_level);
```

#### Program-Skills Relationships
```sql
CREATE TABLE program_skills (
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  coverage_level text NOT NULL CHECK (coverage_level IN ('primary', 'secondary', 'supplemental')),
  weight numeric DEFAULT 1.0 CHECK (weight > 0),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (program_id, skill_id)
);

-- Indexes
CREATE INDEX idx_program_skills_program_id ON program_skills(program_id);
CREATE INDEX idx_program_skills_skill_id ON program_skills(skill_id);
```

### 1.2 Skills Taxonomy Population Strategy

#### Import Seed Data
- Load existing skills from seed pack (5 core skills)
- Map to categories: Business, Operations, Analytics
- Add proficiency level definitions

#### O*NET Integration
- Fetch skills for each SOC code using O*NET API
- Limit to top 5-8 most important skills per occupation
- Map O*NET skill IDs to our taxonomy
- Store importance levels and proficiency thresholds

#### Skills Categories
```
- Business & Management
- Operations & Process
- Analytics & Data
- Technical & Digital
- Communication & Leadership
- Industry-Specific (as needed)
```

### 1.3 Database Migration Script

```sql
-- Migration: Create skills taxonomy infrastructure
BEGIN;

DO $$
BEGIN
  -- Create skills table
  CREATE TABLE IF NOT EXISTS skills (...);

  -- Create job_skills table
  CREATE TABLE IF NOT EXISTS job_skills (...);

  -- Create program_skills table
  CREATE TABLE IF NOT EXISTS program_skills (...);

  -- Insert seed skills
  INSERT INTO skills (name, category, description) VALUES
  ('Strategic Planning', 'Business', 'Set long-term goals and align initiatives'),
  ('Leadership', 'Business', 'Guide teams and influence outcomes'),
  ('Project Management', 'Operations', 'Plan, execute, and control projects'),
  ('Data Analysis', 'Analytics', 'Interpret data to support decisions'),
  ('Process Improvement', 'Operations', 'Optimize workflows and reduce waste')
  ON CONFLICT (name) DO NOTHING;

  -- Record migration
  INSERT INTO migrations (name) VALUES ('20250924_create_skills_taxonomy');
END $$;

COMMIT;
```

## Phase 2: Quiz Generation Pipeline

### 2.1 Quiz Schema Implementation

#### Quizzes Table
```sql
CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id), -- NULL for job-level quizzes
  title text NOT NULL,
  description text,
  estimated_minutes integer DEFAULT 15,
  version integer DEFAULT 1,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  ai_generated boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Quiz Sections (by Skill)
```sql
CREATE TABLE quiz_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(quiz_id, skill_id)
);
```

#### Quiz Questions
```sql
CREATE TABLE quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES quiz_sections(id) ON DELETE CASCADE,
  stem text NOT NULL,
  choices jsonb NOT NULL, -- {"A": "Option A", "B": "Option B", ...}
  correct_answer text NOT NULL,
  explanation text,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'expert')),
  points integer DEFAULT 1,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### 2.2 AI Quiz Generation Service

#### OpenAI Integration
```typescript
// lib/services/quiz-generation.ts
export async function generateSkillQuiz(skillId: string, proficiency: string) {
  const skill = await getSkill(skillId);

  const prompt = `
  Generate 3 multiple choice questions testing ${skill.name} at ${proficiency} level.
  Each question should have 4 options (A, B, C, D) with one correct answer.
  Include a brief explanation for the correct answer.

  Skill: ${skill.name}
  Description: ${skill.description}
  Proficiency Level: ${proficiency}

  Return in JSON format:
  [{
    "stem": "Question text",
    "choices": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
    "correct_answer": "A",
    "explanation": "Why this is correct",
    "difficulty": "${proficiency}"
  }]
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  return JSON.parse(response.choices[0].message.content);
}
```

#### Quiz Generation Workflow
```typescript
// Generate complete quiz for job
export async function generateJobQuiz(jobId: string) {
  const job = await getJob(jobId);
  const jobSkills = await getJobSkills(jobId);

  // Create quiz
  const quiz = await createQuiz({
    job_id: jobId,
    title: `${job.title} Skills Assessment`,
    description: `Test your proficiency in the core skills required for ${job.title}`
  });

  // Generate sections for each skill
  for (const jobSkill of jobSkills) {
    const section = await createQuizSection({
      quiz_id: quiz.id,
      skill_id: jobSkill.skill_id,
      title: jobSkill.skill.name,
      order_index: jobSkills.indexOf(jobSkill)
    });

    // Generate 3 questions per skill
    const questions = await generateSkillQuiz(
      jobSkill.skill_id,
      getProficiencyLevel(jobSkill.proficiency_threshold)
    );

    for (const q of questions) {
      await createQuizQuestion({
        section_id: section.id,
        ...q,
        order_index: questions.indexOf(q)
      });
    }
  }

  return quiz;
}
```

### 2.3 Assessment Scoring Engine

#### Assessment Results Schema
```sql
CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  method assessment_method NOT NULL, -- 'quiz' | 'resume'
  readiness_pct numeric CHECK (readiness_pct >= 0 AND readiness_pct <= 100),
  status_tag text CHECK (status_tag IN ('role_ready', 'close_gaps', 'needs_development')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE assessment_skill_results (
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  score_pct numeric NOT NULL CHECK (score_pct >= 0 AND score_pct <= 100),
  band skill_band NOT NULL,
  correct_answers integer,
  total_questions integer,
  PRIMARY KEY (assessment_id, skill_id)
);

CREATE TABLE quiz_responses (
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  question_id uuid REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_answer text,
  is_correct boolean,
  time_spent_seconds integer,
  PRIMARY KEY (assessment_id, question_id)
);
```

#### Readiness Calculation
```typescript
export function calculateReadinessScore(assessmentId: string): Promise<number> {
  // Get all skill results for this assessment
  const skillResults = await getAssessmentSkillResults(assessmentId);

  // Get job skills with weights
  const jobSkills = await getJobSkillsForAssessment(assessmentId);

  // Calculate weighted average
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const result of skillResults) {
    const jobSkill = jobSkills.find(js => js.skill_id === result.skill_id);
    if (jobSkill) {
      totalWeightedScore += (result.score_pct / 100) * jobSkill.weight;
      totalWeight += jobSkill.weight;
    }
  }

  const readinessScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

  // Update assessment record
  await updateAssessmentReadiness(assessmentId, readinessScore);

  return readinessScore;
}

export function determineReadinessStatus(readinessScore: number): string {
  if (readinessScore >= 85) return 'role_ready';
  if (readinessScore >= 50) return 'close_gaps';
  return 'needs_development';
}
```

## Phase 3: API Ecosystem Integration

### 3.1 O*NET Web Services Integration

#### Edge Function: etl_onet_soc_skills.ts
```typescript
export const handler = async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get all SOC codes from jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, soc_code')
    .not('soc_code', 'is', null);

  const results = [];

  for (const job of jobs) {
    try {
      // Fetch skills for this SOC code
      const skills = await fetchONETSkills(job.soc_code);

      // Map to our skills taxonomy (limit to 5-8 most important)
      const mappedSkills = await mapONETSkillsToTaxonomy(skills.slice(0, 8));

      // Store relationships
      for (const skill of mappedSkills) {
        await supabase.from('job_skills').upsert({
          job_id: job.id,
          skill_id: skill.id,
          importance_level: skill.importance,
          proficiency_threshold: skill.threshold,
          weight: skill.weight,
          onet_data_source: skill.onetData
        });
      }

      results.push({ soc_code: job.soc_code, skills_count: mappedSkills.length });

    } catch (error) {
      console.error(`Failed to process SOC ${job.soc_code}:`, error);
    }
  }

  return new Response(JSON.stringify({
    processed: results.length,
    results
  }));
};
```

#### O*NET API Integration
```typescript
async function fetchONETSkills(socCode: string) {
  const apiKey = Deno.env.get('ONET_API_KEY');
  const baseUrl = 'https://services.onetcenter.org/ws/online';

  // Get knowledge, skills, and abilities for SOC code
  const [knowledgeRes, skillsRes, abilitiesRes] = await Promise.all([
    fetch(`${baseUrl}/occupations/${socCode}/knowledge`, {
      headers: { Authorization: `Basic ${btoa(`apiuser:${apiKey}`)}` }
    }),
    fetch(`${baseUrl}/occupations/${socCode}/skills`, {
      headers: { Authorization: `Basic ${btoa(`apiuser:${apiKey}`)}` }
    }),
    fetch(`${baseUrl}/occupations/${socCode}/abilities`, {
      headers: { Authorization: `Basic ${btoa(`apiuser:${apiKey}`)}` }
    })
  ]);

  const knowledge = await knowledgeRes.json();
  const skills = await skillsRes.json();
  const abilities = await abilitiesRes.json();

  // Combine and rank by importance
  return rankSkillsByImportance([...knowledge, ...skills, ...abilities]);
}
```

### 3.2 BLS OEWS Integration

#### Edge Function: etl_bls_oews_msa.ts
```typescript
export const handler = async () => {
  // Fetch wage data for Tampa-St. Petersburg MSA
  const msaCode = '45300'; // Tampa-St. Petersburg-Clearwater, FL MSA

  const wageData = await fetchBLSWageData(msaCode);

  // Update jobs with regional wage data
  for (const wage of wageData) {
    await updateJobWages(wage.soc_code, wage.median_wage, wage.data_year);
  }

  return { updated: wageData.length };
};
```

### 3.3 Career One Stop Programs Integration

#### Edge Function: etl_careeronestop_programs_pinellas.ts
```typescript
export const handler = async () => {
  const apiKey = Deno.env.get('COS_USERID');
  const token = Deno.env.get('COS_TOKEN');

  // Fetch programs for Pinellas County
  const programs = await fetchCareerOneStopPrograms({
    location: 'Pinellas',
    radius: 50,
    apiKey,
    token
  });

  // Process and store programs with CIP codes
  for (const program of programs) {
    const school = await findOrCreateSchool(program.provider);
    const storedProgram = await createProgram({
      school_id: school.id,
      name: program.name,
      cip_code: program.cipCode,
      program_type: mapProgramType(program.type),
      format: program.format,
      duration_text: program.duration,
      short_desc: program.description,
      program_url: program.url
    });

    // Link skills based on CIP code
    await linkProgramSkills(storedProgram.id, program.cipCode);
  }

  return { programs_added: programs.length };
};
```

### 3.4 ETL Scheduling Strategy

```typescript
// Scheduled execution (using Supabase Cron or external scheduler)
const SCHEDULES = {
  onet_skills: '0 2 * * 1',        // Weekly Mondays 2 AM
  bls_wages: '0 3 1 * *',          // Monthly 1st at 3 AM
  careeronestop_programs: '0 4 * * 3', // Weekly Wednesdays 4 AM
  lightcast_skills: '0 5 * * 5'     // Weekly Fridays 5 AM
};
```

## Phase 4: User Experience Completion

### 4.1 My Assessments Page Enhancement

#### Assessment Cards Display
- Show readiness percentage and status
- Display skill-by-skill breakdown
- Show assessment method (quiz vs resume)
- Provide gap analysis and recommendations

#### Assessment Actions
- Role Ready (85%+): Share readiness score
- Close Gaps (50-84%): View program matches
- Needs Development (0-49%): Retake assessment options

### 4.2 Homepage Dashboard Updates

#### Skills Snapshot Cards
- **Roles Ready For**: Count of jobs where user meets proficiency thresholds
- **Overall Readiness**: Average across all assessed skills
- **Skills Identified**: Total unique skills from assessments
- **Gaps Highlighted**: Skills needing development

#### Progress Visualization
- Pie chart showing proficiency distribution
- Skills nearest to proficiency
- Personalized program recommendations

### 4.3 Admin Tools Integration

#### Skills Management
- CRUD operations for skills taxonomy
- Bulk import from O*NET data
- Proficiency level management

#### Quiz Management
- AI-powered quiz generation
- Manual question editing
- Publishing workflow (draft → published)

#### Analytics Dashboard
- Assessment completion rates
- Popular skills and gaps
- Program recommendation effectiveness

## Technical Specifications

### Database Constraints & Validation

#### Skills Taxonomy Rules
- Maximum 8 skills per SOC code
- Minimum 5 skills for complete occupations
- Importance levels: critical > important > helpful
- Proficiency thresholds: 70% default, configurable

#### Quiz Generation Rules
- 3 questions per skill
- Multiple choice format (4 options)
- Difficulty levels: beginner, intermediate, expert
- Points weighted by skill importance

### API Rate Limits & Error Handling

#### O*NET API
- Rate limit: 1000 requests/hour
- Error handling: Retry with exponential backoff
- Data validation: Schema validation before storage

#### OpenAI API
- Rate limit: Based on account tier
- Cost optimization: Batch question generation
- Fallback: Manual question creation

### Security & Performance

#### RLS Policies
```sql
-- Users can view skills for jobs they can access
CREATE POLICY "Users can view job skills"
ON job_skills FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = job_skills.job_id
    AND (j.job_kind = 'occupation' OR j.company_id IS NULL OR j.company?.is_published = true)
  )
);
```

#### Performance Optimization
- Job skills pre-computed for quiz generation
- Assessment results cached with TTL
- Database indexes on frequently queried relationships

## Success Metrics & Testing

### Key Performance Indicators

#### Skills Taxonomy
- Skills coverage: 100% of SOC codes have 5-8 skills
- Data freshness: O*NET data updated weekly
- Taxonomy accuracy: Skills correctly categorized

#### Quiz Generation
- Generation success rate: 95%+ AI-generated quizzes
- Question quality: Manual review approval rate
- Assessment completion: Average completion time < 20 minutes

#### User Experience
- Assessment conversion: Users completing assessments
- Readiness improvement: Average readiness score progression
- Recommendation usage: Program match click-through rates

### Testing Strategy

#### Unit Tests
- Quiz generation logic
- Readiness calculation algorithms
- API integration error handling

#### Integration Tests
- End-to-end assessment flow
- API data synchronization
- Cross-system data consistency

#### User Acceptance Testing
- Assessment experience validation
- Skills gap analysis accuracy
- Program recommendation relevance

---

## Implementation Checklist

### Phase 1: Skills Taxonomy ✅
- [ ] Create skills, job_skills, program_skills tables
- [ ] Import seed skills data
- [ ] Implement O*NET API integration
- [ ] Populate skills for existing SOC codes
- [ ] Add database constraints and indexes

### Phase 2: Quiz Generation ✅
- [ ] Create quiz schema (quizzes, sections, questions)
- [ ] Implement OpenAI integration
- [ ] Build quiz generation service
- [ ] Create assessment scoring engine
- [ ] Add quiz taking UI components

### Phase 3: API Ecosystem ✅
- [ ] Complete O*NET skills ETL
- [ ] Implement BLS wage integration
- [ ] Build Career One Stop programs ETL
- [ ] Add Lightcast skills validation
- [ ] Set up scheduled ETL jobs

### Phase 4: User Experience ✅
- [ ] Enhance My Assessments page
- [ ] Update homepage dashboard
- [ ] Complete admin tools for skills/quizzes
- [ ] Add analytics and monitoring

---

*This plan establishes skills as the universal currency powering the entire SkillSync platform. Implementation follows the foundation-first approach, ensuring all features are built on a solid, interconnected skills infrastructure.*

**Last Updated:** 2025-09-24
**Version:** 1.0
**Status:** Active Implementation Plan
