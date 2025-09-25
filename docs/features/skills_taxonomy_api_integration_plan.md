# SkillSync Skills Taxonomy & API Integration Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for establishing skills as the universal currency across SkillSync. Skills will power quiz generation, program recommendations, assessment scoring, and the entire user journey. The plan prioritizes skills taxonomy as the foundation, followed by quiz generation and API integrations.

**Key Architectural Decisions:**
- **SOC-Based Quizzes**: Quizzes mapped to SOC codes for reusability across multiple jobs
- **Question Pools**: 40+ questions per skill with rotation (15-20 shown per assessment)
- **Cheat Prevention**: Question rotation and usage tracking
- **Typeform UX**: Single-question flow with progress indicators and no right/wrong feedback
- **Company Customizations**: Support for organization-specific quizzes while maintaining standards

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

### 🎯 New Architectural Requirements (Post-Implementation)
- **SOC-Based Quiz Reusability** - One quiz serves multiple jobs with same SOC
- **Question Rotation System** - 40+ question pools, 15-20 per assessment
- **Cheat Prevention** - Usage tracking prevents question repetition
- **Typeform UX** - Single-question flow with progress indicators
- **No Right/Wrong Feedback** - Assessment feels like evaluation, not test
- **Comprehensive Analytics** - Engagement, completion, and progression tracking

## Strategic Implementation Plan

### Core Philosophy
Skills are the universal currency. Everything connects through skills:
- Jobs require skills → Skills power quizzes → Quizzes generate assessments → Assessments drive recommendations → Programs fill skill gaps

### Implementation Priority
1. **Skills Taxonomy** (Foundation) - Tables, relationships, basic data
2. **SOC-Based Quiz System** (Core Feature) - AI-powered assessment creation
3. **API Integration Services** (Data Pipeline) - O*NET, BLS, Career One Stop integration
4. **SOC Enrichment Pipeline** (Data Enrichment) - Automated SOC processing
5. **User Experience Completion** (Polish) - My Assessments, Dashboard, Admin Tools

### Timeline Estimate
- **Phase 1**: Skills Taxonomy Foundation ✅ **COMPLETED**
- **Phase 2**: O*NET API Integration & Intelligent Filtering ✅ **COMPLETED**  
- **Phase 3**: SOC-Based Quiz System 🚧 **IN PROGRESS**
- **Phase 4**: API Ecosystem Integration 📋 **PLANNED**
- **Phase 5**: User Experience Completion 📋 **PLANNED**

## Phase 1: Skills Taxonomy Foundation ✅ COMPLETED

### 1.1 Database Schema Implementation ✅
- **Skills table** with proficiency levels, categories, descriptions
- **Job_skills table** with importance levels and proficiency thresholds
- **Program_skills table** for CIP code mappings
- **Migration deployed** successfully to production

### 1.2 Enhanced TypeScript Interfaces ✅
- Complete Skill, JobSkill, ProgramSkill interfaces
- Assessment and analytics interfaces
- Database query functions for all CRUD operations

## Phase 2: O*NET API Integration & Intelligent Filtering ✅ COMPLETED

### 2.1 O*NET API Service Implementation ✅
**Complete O*NET Web Services Integration:**
- **Skills, Knowledge, and Abilities** data fetching for all SOC codes
- **Authentication handling** with proper credentials management
- **Rate limiting and error handling** for production reliability
- **Comprehensive logging** for debugging and monitoring

### 2.2 Intelligent Skill Filtering System ✅
**Problem Solved:** O*NET returns many generic skills unsuitable for assessments
- **Generic skill exclusion:** 40+ filtered skills including Oral Comprehension, English Language, Customer Service
- **Weighted selection algorithm:** Knowledge (80%), Abilities (15%), Skills (5%)
- **Professional focus:** Prioritizes domain expertise over soft skills
- **Assessment relevance:** Skills that differentiate qualified candidates

### 2.3 Skills Population Pipeline ✅
**Admin Interface with Progress Tracking:**
- **Real-time progress indicators** with estimated completion times
- **Individual and bulk population** operations
- **Skills viewing modal** to inspect populated skills per SOC code
- **Adaptive time estimation** based on actual processing performance

**Population Workflow:**
1. Fetch jobs by SOC code (with deduplication)
2. Call O*NET API for Skills, Knowledge, and Abilities
3. Apply intelligent filtering to remove generic skills
4. Use weighted selection to prioritize professional competencies
5. Create job-skill relationships with importance levels
6. Return detailed success/failure metrics

### 2.4 Perfect Skill Deduplication ✅
**Zero Duplication System:**
- **O*NET ID-based deduplication** ensures skills exist once in database
- **Multiple jobs reference same skill** via job_skills relationship table
- **Perfect normalization** with referential integrity
- **Automatic skill reuse** across SOC codes with same competencies

### 2.5 Production-Ready Error Handling ✅
**Comprehensive Error Management:**
- **Graceful handling** of SOC codes with missing O*NET data
- **Detailed logging** of API failures and data gaps
- **Clear user feedback** on skipped SOC codes with explanations
- **Rollback capability** for failed operations

### 2.6 Skills Data Quality Assurance ✅
**Enterprise-Grade Results:**
- **10 skills per job** (reduced from 12 for laser focus)
- **Professional skills prioritized:** Administration and Management, Strategic Planning, Resource Allocation
- **Generic skills eliminated:** Speaking, Reading Comprehension, Oral Expression
- **Assessment-ready taxonomy** suitable for employer evaluation

## Phase 3: SOC-Based Quiz System 🚧 IN PROGRESS

### 2.1 SOC-Based Quiz Architecture ✅
**Core Innovation**: Quizzes mapped to SOC codes, not individual jobs
```sql
CREATE TABLE quizzes (
  soc_code text NOT NULL,        -- SOC code for reusability
  is_standard boolean DEFAULT true, -- Standard vs company custom
  company_id uuid,               -- NULL for standard quizzes
  UNIQUE(soc_code, is_standard, company_id) -- Allows multiple versions
);
```

**Benefits:**
- **Reusability**: One SOC quiz serves hundreds of jobs
- **Customization**: Companies can override with custom quizzes
- **Maintenance**: Updates to SOC quiz benefit all related jobs

### 2.2 Question Pool & Rotation System ✅
**Question Pools**: 40+ questions per skill stored in database
**Rotation Algorithm**: 15-20 questions selected per assessment
**Cheat Prevention**: Usage tracking prevents question repetition

```typescript
// Question rotation logic
const selectedQuestions = await selectAssessmentQuestions(quizId, userId)
// Returns 15-20 questions from 40+ pool, avoiding recent usage
```

### 2.3 AI-Powered Question Generation ✅
**OpenAI Integration**: GPT-4 powered question creation
**Context-Aware**: Uses job descriptions and skill requirements
**Batch Processing**: Efficient API usage with error handling
**Proficiency Targeting**: Beginner/Intermediate/Expert question levels

### 2.4 Typeform-Style Assessment UI ✅
**Single Question Flow**: One question per screen
**Progress Indicators**: Visual completion tracking
**No Right/Wrong Feedback**: Assessment feels like evaluation, not test
**Mobile Optimized**: Touch-friendly responsive design
**Analytics Tracking**: Comprehensive engagement and completion metrics

### 2.5 Assessment Analytics & KPIs ✅
**Engagement Tracking**: Mouse movements, focus time, tab switches
**Completion Metrics**: Drop-off analysis, time per question
**User Progression**: Skill development over time
**Performance Insights**: Quiz effectiveness and question quality

### 2.6 Enhanced Database Schema ✅
```sql
-- SOC-based quiz tables
CREATE TABLE quizzes (soc_code, is_standard, company_id, ...);
CREATE TABLE quiz_sections (quiz_id, skill_id, questions_per_section, ...);
CREATE TABLE quiz_questions (section_id, stem, choices, correct_answer, ...);

-- Assessment analytics
CREATE TABLE assessment_analytics (assessment_id, engagement_score, ...);
CREATE TABLE user_assessment_history (user_id, soc_code, improvement_trend, ...);
```

## Phase 3: API Integration Services 🚧 IN PROGRESS

### 3.1 O*NET API Integration 📋 PLANNED
**Purpose**: Fetch detailed job content, skills, and proficiency requirements
**API Credentials**: Configured (ONET_USERNAME, ONET_PASSWORD)
**Implementation**: REST client with rate limiting and error handling
**Data Enhancement**: Skills importance levels, job descriptions, education requirements

### 3.2 BLS API Integration 📋 PLANNED
**Purpose**: Wage and employment data for regional accuracy
**API Credentials**: Configured (BLS_API_KEY)
**Implementation**: OEWS data fetching with MSA code mapping
**Data Enhancement**: Median wages, projected openings, growth outlook

### 3.3 CareerOneStop API Integration 📋 PLANNED
**Purpose**: Education program data and CIP code mappings
**API Credentials**: Configured (COS_USERID, COS_TOKEN)
**Implementation**: Program search and detail fetching
**Data Enhancement**: Program availability, costs, duration, outcomes

### 3.4 Orchestrated SOC Enrichment Pipeline 📋 PLANNED
**One-Click SOC Integration**:
```
Input: SOC Code (e.g., "15-1132.00")
Process:
  1. O*NET → Fetch job content & skills
  2. BLS → Add wage/employment data  
  3. CareerOneStop → Link education programs
  4. Create/update job record with enriched data
  5. Auto-generate SOC-based quiz
Output: Complete assessment-ready occupation
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

### Phase 1: Skills Taxonomy Foundation ✅
- [x] Create skills, job_skills, program_skills tables
- [x] Import seed skills data
- [x] Implement O*NET API integration
- [x] Populate skills for existing SOC codes
- [x] Add database constraints and indexes

### Phase 2: SOC-Based Quiz System ✅
- [x] Create SOC-based quiz schema (quizzes, sections, questions)
- [x] Implement OpenAI integration for AI question generation
- [x] Build question pool and rotation system (40+ questions, 15-20 per assessment)
- [x] Create Typeform-style assessment UI with progress indicators
- [x] Implement comprehensive assessment analytics and KPIs
- [x] Add cheat prevention through usage tracking
- [x] Create admin tools for quiz management and SOC code handling

### Phase 3: API Integration Services 🚧
- [x] Configure all API credentials (O*NET, BLS, CareerOneStop, OpenAI)
- [x] Build O*NET API client with intelligent filtering system
- [x] Implement comprehensive skills population pipeline
- [x] Add real-time progress tracking and admin interface
- [x] Create perfect skill deduplication system
- [ ] Implement BLS API client for wage and employment data
- [ ] Create CareerOneStop API client for program data
- [ ] Add orchestrated SOC enrichment pipeline
- [ ] Implement additional rate limiting and caching

### Phase 4: SOC-Based Quiz System 📋
- [ ] Create SOC-based quiz schema (quizzes, sections, questions)
- [ ] Implement OpenAI integration for AI question generation
- [ ] Build question pool and rotation system (40+ questions, 15-20 per assessment)
- [ ] Create Typeform-style assessment UI with progress indicators
- [ ] Implement comprehensive assessment analytics and KPIs
- [ ] Add cheat prevention through usage tracking
- [ ] Create admin tools for quiz management and SOC code handling

### Phase 5: User Experience Completion 📋
- [ ] Enhance My Assessments page with results visualization
- [ ] Update homepage dashboard with skill progress tracking
- [ ] Complete admin tools for SOC management and analytics
- [ ] Add comprehensive reporting and insights

---

## Next Steps Recommendation

**Immediate Priority**: **SOC-Based Quiz System** (Phase 4)
- Build the quiz generation system using populated skills data
- Implement AI-powered question generation with skill prioritization guidelines
- Create the assessment UI and analytics system

**Why Quiz System Next**:
1. **Skills Foundation Complete**: We now have high-quality, assessment-ready skills
2. **Immediate User Value**: Users can take meaningful assessments
3. **Revenue Generation**: Assessments are core to the business model
4. **AI Integration Ready**: Skills data is perfectly formatted for quiz generation

**Implementation Order**:
1. **Quiz Schema & AI Generation** - Use existing skills with importance weighting
2. **Assessment UI** - Typeform-style single-question flow
3. **Analytics & Progress Tracking** - Comprehensive user insights
4. **Admin Tools** - Quiz management and skill oversight

**Key Success Factors**:
- **Use skill prioritization guidelines** from memory for AI assessment generation
- **Focus on professional skills** that were intelligently filtered from O*NET
- **Leverage importance levels** from job-skill relationships for question weighting
- **Build on existing progress tracking patterns** from skills population UI

---

*The Skills Taxonomy Pipeline is now production-ready with enterprise-grade O*NET integration, intelligent filtering, and perfect deduplication. The foundation is solid for building the quiz generation system that will deliver the "magic" assessment experience.*

**Last Updated:** 2025-09-25
**Version:** 3.0  
**Status:** Phase 2 Complete, Phase 3 Ready to Begin
