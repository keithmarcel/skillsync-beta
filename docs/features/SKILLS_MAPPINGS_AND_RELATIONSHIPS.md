# Skills Mappings and Relationships - Complete Technical Guide

**Document Version:** 1.0  
**Last Updated:** October 7, 2025  
**Audience:** Senior Engineers (no prior codebase knowledge required)

---

## Executive Summary

SkillSync's **universal currency architecture** connects everything through skills. This document explains how skills power the relationships between jobs, programs, assessments, users, and education, creating a comprehensive workforce intelligence platform.

**Key Architecture:** Skills are the central node connecting all platform components.

---

## Table of Contents

1. [Universal Currency Architecture](#1-universal-currency-architecture)
2. [Job-Skills Relationships](#2-job-skills-relationships)
3. [Program-Skills Relationships](#3-program-skills-relationships)
4. [Assessment-Skills Integration](#4-assessment-skills-integration)
5. [User-Skills Tracking](#5-user-skills-tracking)
6. [Skills Gap Analysis](#6-skills-gap-analysis)
7. [Learning Pathways](#7-learning-pathways)
8. [Cross-System Data Flow](#8-cross-system-data-flow)
9. [Implementation Details](#9-implementation-details)

---

## 1. Universal Currency Architecture

### 1.1 Skills as the Central Node

**Traditional Platforms:**
```
Jobs ←→ Resumes (Keyword matching)
Programs ←→ Enrollments (Generic recommendations)
Assessments ←→ Scores (Simple percentages)
```

**SkillSync Architecture:**
```
                    SKILLS
                   /  |  \
                  /   |   \
                 /    |    \
                /     |     \
          JOBS ←──────┼──────→ PROGRAMS
               ↗      |      ↙
              ↗       |     ↙
             ↗        |    ↙
        USERS ←───────┼───────→ ASSESSMENTS
             ↘        |    ↗
              ↘       |   ↗
               ↘      |  ↗
          LEARNING ←──┼──→ EMPLOYERS
                   PATHWAYS
```

**Result:** Everything connects through skills, enabling precision matching and intelligent recommendations.

---

### 1.2 Relationship Types

**Direct Relationships:**
- **Jobs ↔ Skills:** What skills are required for jobs
- **Programs ↔ Skills:** What skills programs teach
- **Assessments ↔ Skills:** What skills are tested
- **Users ↔ Skills:** What skills users have/demonstrate

**Derived Relationships:**
- **Jobs ↔ Programs:** Via shared skills (gap filling)
- **Jobs ↔ Users:** Via skill matching (job readiness)
- **Programs ↔ Users:** Via skill gaps (education recommendations)
- **Assessments ↔ Programs:** Via skill gaps (learning pathways)

---

## 2. Job-Skills Relationships

### 2.1 Database Schema

**Job Skills Junction Table:**
```sql
CREATE TABLE job_skills (
  -- Primary relationships
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,

  -- Weighting configuration
  importance_level TEXT NOT NULL,     -- 'critical' | 'important' | 'helpful'
  proficiency_threshold INTEGER,      -- 60-100% (required level)
  weight DECIMAL(3,2),                -- 0.0-1.0 (scoring weight)

  -- Source metadata
  onet_data_source JSONB,             -- { source, relevance, reasoning, ai_matched }

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (job_id, skill_id)
);

-- Performance indexes
CREATE INDEX idx_job_skills_job ON job_skills(job_id);
CREATE INDEX idx_job_skills_skill ON job_skills(skill_id);
CREATE INDEX idx_job_skills_importance ON job_skills(importance_level);
```

---

### 2.2 Importance Level Hierarchy

**Critical Skills (importance_level = 'critical'):**
- **Importance:** 5.0/5.0
- **Threshold:** 80%+ proficiency required
- **Examples:** Core technical competencies
- **Assessment:** Must demonstrate mastery
- **Weight:** 5.0x in scoring calculations

**Important Skills (importance_level = 'important'):**
- **Importance:** 4.0/5.0
- **Threshold:** 70%+ proficiency required
- **Examples:** Key supporting competencies
- **Assessment:** Should demonstrate competence
- **Weight:** 4.0x in scoring calculations

**Helpful Skills (importance_level = 'helpful'):**
- **Importance:** 3.0/5.0
- **Threshold:** 60%+ proficiency preferred
- **Examples:** Nice-to-have competencies
- **Assessment:** Beneficial but not required
- **Weight:** 3.0x in scoring calculations

---

### 2.3 Skill Population Process

**For Featured Roles (Company-Specific):**
```typescript
// Step 1: Get job description and requirements
const job = await getJobById(jobId)

// Step 2: Extract skills from job posting + AI enhancement
const skills = await generateSkillsFromJobPosting(job)

// Step 3: Map to taxonomy and set importance
for (const skill of skills) {
  await supabase.from('job_skills').insert({
    job_id: jobId,
    skill_id: skill.id,
    importance_level: skill.importance, // 'critical', 'important', 'helpful'
    proficiency_threshold: skill.threshold,
    weight: skill.weight,
    onet_data_source: {
      source: 'COMPANY_CUSTOM',
      relevance: skill.relevance,
      reasoning: skill.reasoning,
      ai_matched: true
    }
  })
}
```

**For Standard Occupations (SOC-Based):**
```typescript
// Step 1: Get SOC code from job
const socCode = job.soc_code

// Step 2: Fetch O*NET + Lightcast skills
const onetSkills = await fetchONETSkills(socCode)
const lightcastSkills = await getLightcastSkillsForSOC(socCode)

// Step 3: AI ranking and importance assignment
const rankedSkills = await rankSkillsWithAI(job, [...onetSkills, ...lightcastSkills])

// Step 4: Save top skills with importance levels
for (const skillMatch of rankedSkills.slice(0, 15)) {
  const importanceLevel = getImportanceLevel(skillMatch.importanceLevel)

  await supabase.from('job_skills').insert({
    job_id: jobId,
    skill_id: skillMatch.skillId,
    importance_level: importanceLevel,
    proficiency_threshold: skillMatch.importanceLevel === 'critical' ? 80 : 70,
    weight: skillMatch.relevanceScore / 100,
    onet_data_source: {
      source: 'HYBRID_AI',
      relevance: skillMatch.relevanceScore,
      reasoning: skillMatch.reasoning,
      ai_matched: true
    }
  })
}
```

---

### 2.4 Job Skills Queries

**Get Skills for a Job:**
```typescript
async function getJobSkills(jobId: string): Promise<JobSkill[]> {
  const { data } = await supabase
    .from('job_skills')
    .select(`
      *,
      skill:skills(
        id,
        name,
        category,
        description,
        onet_importance
      )
    `)
    .eq('job_id', jobId)
    .order('importance_level', { ascending: false })
    .order('weight', { ascending: false })

  return data || []
}
```

**Get Jobs Requiring a Skill:**
```typescript
async function getJobsBySkill(skillId: string): Promise<Job[]> {
  const { data } = await supabase
    .from('job_skills')
    .select(`
      job:jobs(
        id,
        title,
        company:companies(name, logo_url),
        importance_level,
        proficiency_threshold
      )
    `)
    .eq('skill_id', skillId)

  return data?.map(d => d.job).filter(Boolean) || []
}
```

---

## 3. Program-Skills Relationships

### 3.1 Database Schema

**Program Skills Junction Table:**
```sql
CREATE TABLE program_skills (
  -- Primary relationships
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,

  -- Coverage configuration
  coverage_level TEXT NOT NULL,       -- 'primary' | 'secondary' | 'supplemental'
  weight DECIMAL(3,2),                -- 0.0-1.0 (curriculum emphasis)

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (program_id, skill_id)
);

-- Performance indexes
CREATE INDEX idx_program_skills_program ON program_skills(program_id);
CREATE INDEX idx_program_skills_skill ON program_skills(skill_id);
CREATE INDEX idx_program_skills_coverage ON program_skills(coverage_level);
```

---

### 3.2 Coverage Level Hierarchy

**Primary Coverage (coverage_level = 'primary'):**
- **Emphasis:** Core curriculum focus
- **Weight:** 1.0 (full emphasis)
- **Examples:** "Python" in Python bootcamp, "Java" in Java development program
- **Guarantee:** Program centers on teaching this skill

**Secondary Coverage (coverage_level = 'secondary'):**
- **Emphasis:** Supporting curriculum
- **Weight:** 0.7 (significant coverage)
- **Examples:** "Git" in web development, "SQL" in data science program
- **Guarantee:** Skill taught but not primary focus

**Supplemental Coverage (coverage_level = 'supplemental'):**
- **Emphasis:** Brief coverage
- **Weight:** 0.3 (mentioned/taught lightly)
- **Examples:** "Agile" in coding bootcamp, "Testing" in web development
- **Guarantee:** Skill introduced but minimal depth

---

### 3.3 Program Skills Extraction

**Strategy:** Programs inherit skills from target occupations

**CIP to SOC Crosswalk:**
```
CIP Code (Program) → SOC Codes (Occupations) → Skills (Taxonomy)
     ↓                        ↓                       ↓
11.0101 (Computer Science) → 15-1252 (Software Dev) → Python, Java, SQL
                        → 15-1244 (Network Admin) → Networking, Security
```

**Automated Extraction Process:**
```typescript
async function extractProgramSkills(programId: string) {
  // 1. Get program's CIP code
  const { data: program } = await supabase
    .from('programs')
    .select('cip_code')
    .eq('id', programId)
    .single()

  // 2. Find target SOC codes via crosswalk
  const { data: crosswalk } = await supabase
    .from('cip_soc_crosswalk')
    .select('soc_code, relevance_weight')
    .eq('cip_code', program.cip_code)

  // 3. Get skills from all target occupations
  const skillMap = new Map()

  for (const soc of crosswalk) {
    const { data: jobSkills } = await supabase
      .from('job_skills')
      .select('skill_id, importance_level')
      .eq('job_id', soc.job_id) // Jobs with this SOC code

    // Aggregate skills with coverage levels
    for (const js of jobSkills) {
      const existing = skillMap.get(js.skill_id) || { count: 0, totalImportance: 0 }

      skillMap.set(js.skill_id, {
        count: existing.count + 1,
        totalImportance: existing.totalImportance + getImportanceValue(js.importance_level),
        socCode: soc.soc_code,
        relevanceWeight: soc.relevance_weight
      })
    }
  }

  // 4. Save to program_skills with calculated coverage
  for (const [skillId, data] of skillMap.entries()) {
    const coverageLevel = calculateCoverageLevel(data.count, data.totalImportance)

    await supabase.from('program_skills').upsert({
      program_id: programId,
      skill_id: skillId,
      coverage_level: coverageLevel,
      weight: getCoverageWeight(coverageLevel)
    })
  }
}
```

---

### 3.4 Coverage Level Calculation

**Algorithm:**
```typescript
function calculateCoverageLevel(jobCount: number, totalImportance: number): string {
  const avgImportance = totalImportance / jobCount

  if (avgImportance >= 4.5) return 'primary'      // Critical in most target jobs
  if (avgImportance >= 3.5) return 'secondary'    // Important in several jobs
  return 'supplemental'                          // Helpful in some jobs
}

function getCoverageWeight(coverageLevel: string): number {
  switch (coverageLevel) {
    case 'primary': return 1.0
    case 'secondary': return 0.7
    case 'supplemental': return 0.3
    default: return 0.5
  }
}
```

---

### 3.5 Program Skills Queries

**Get Skills Taught by Program:**
```typescript
async function getProgramSkills(programId: string): Promise<ProgramSkill[]> {
  const { data } = await supabase
    .from('program_skills')
    .select(`
      *,
      skill:skills(
        id,
        name,
        category,
        description
      )
    `)
    .eq('program_id', programId)
    .order('coverage_level', { ascending: false })
    .order('weight', { ascending: false })

  return data || []
}
```

**Get Programs Teaching a Skill:**
```typescript
async function getProgramsBySkill(skillId: string): Promise<Program[]> {
  const { data } = await supabase
    .from('program_skills')
    .select(`
      program:programs(
        id,
        name,
        short_desc,
        coverage_level,
        weight
      )
    `)
    .eq('skill_id', skillId)
    .order('weight', { ascending: false })

  return data?.map(d => d.program).filter(Boolean) || []
}
```

---

## 4. Assessment-Skills Integration

### 4.1 Quiz Question to Skills Mapping

**Database Schema:**
```sql
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY,
  section_id UUID REFERENCES quiz_sections(id),
  skill_id UUID REFERENCES skills(id),     -- Links to skills taxonomy

  -- Question content
  stem TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_answer TEXT NOT NULL,

  -- Weighting (inherited from job_skills)
  importance DECIMAL(3,1) DEFAULT 3.0,     -- 1.0-5.0
  difficulty TEXT,                        -- 'beginner'|'intermediate'|'expert'

  -- Assessment tracking
  is_bank_question BOOLEAN DEFAULT false, -- Part of question pool?
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMP
);
```

---

### 4.2 Quiz Generation from Job Skills

**Process:**
```typescript
async function generateQuizForJob(jobId: string, userId: string) {
  // 1. Get required skills for job
  const jobSkills = await getJobSkills(jobId)

  // 2. Create quiz sections (one per skill)
  const sections = []
  for (const jobSkill of jobSkills) {
    const section = await supabase
      .from('quiz_sections')
      .insert({
        quiz_id: quizId,
        skill_id: jobSkill.skill_id,
        title: `${jobSkill.skill.name} Assessment`,
        questions_per_section: 3, // 3 questions per skill
        total_questions: 3
      })
      .select()
      .single()

    sections.push(section)
  }

  // 3. Generate questions for each section
  for (const section of sections) {
    const questions = await generateQuestionsForSkill(
      section.skill_id,
      section.questions_per_section,
      jobId, // Context for AI generation
      userId // Anti-cheat tracking
    )

    // 4. Save questions with skill linkage
    for (const question of questions) {
      await supabase.from('quiz_questions').insert({
        section_id: section.id,
        skill_id: section.skill_id,
        stem: question.stem,
        choices: question.choices,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        difficulty: question.difficulty,
        importance: question.importance, // From job_skills importance
        is_bank_question: false // Custom generated
      })
    }
  }
}
```

---

### 4.3 Assessment Results by Skill

**Skill-Level Scoring:**
```typescript
async function calculateAssessmentResults(assessmentId: string) {
  // 1. Get all responses with skill linkage
  const { data: responses } = await supabase
    .from('assessment_responses')
    .select(`
      *,
      question:quiz_questions(
        skill_id,
        importance,
        difficulty
      )
    `)
    .eq('assessment_id', assessmentId)

  // 2. Group by skill
  const skillGroups = responses.reduce((groups, response) => {
    const skillId = response.question.skill_id
    if (!groups[skillId]) groups[skillId] = []
    groups[skillId].push(response)
    return groups
  }, {} as Record<string, any[]>)

  // 3. Calculate weighted scores per skill
  const skillResults = []
  for (const [skillId, skillResponses] of Object.entries(skillGroups)) {
    const weightedScore = calculateWeightedSkillScore(skillResponses)
    const proficiencyLevel = determineProficiencyLevel(weightedScore)

    skillResults.push({
      skill_id: skillId,
      score: weightedScore,
      score_pct: weightedScore,
      proficiency_level: proficiencyLevel,
      correct_answers: skillResponses.filter(r => r.is_correct).length,
      total_questions: skillResponses.length
    })
  }

  // 4. Save skill-level results
  await supabase
    .from('assessment_skill_results')
    .insert(skillResults.map(result => ({
      assessment_id: assessmentId,
      ...result
    })))

  return skillResults
}
```

---

## 5. User-Skills Tracking

### 5.1 User Skills Proficiency

**Database Schema:**
```sql
CREATE TABLE user_skills (
  user_id UUID REFERENCES users(id),
  skill_id UUID REFERENCES skills(id),

  -- Proficiency tracking
  current_level DECIMAL(5,2),        -- 0-100% (from assessments)
  demonstrated_at TIMESTAMP,         -- When last demonstrated
  confidence_level TEXT,             -- 'high'|'medium'|'low'
  source TEXT,                       -- 'assessment'|'self_reported'|'verified'

  -- Development tracking
  target_level DECIMAL(5,2),         -- User's goal
  last_practiced_at TIMESTAMP,
  practice_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (user_id, skill_id)
);
```

---

### 5.2 Skills from Assessments

**Automatic Proficiency Updates:**
```typescript
async function updateUserSkillsFromAssessment(userId: string, skillResults: any[]) {
  for (const result of skillResults) {
    await supabase
      .from('user_skills')
      .upsert({
        user_id: userId,
        skill_id: result.skill_id,
        current_level: result.score_pct,
        demonstrated_at: new Date().toISOString(),
        confidence_level: result.proficiency_level === 'expert' ? 'high' : 'medium',
        source: 'assessment'
      }, {
        onConflict: 'user_id,skill_id'
      })
  }
}
```

---

### 5.3 User Skills Queries

**Get User's Skill Profile:**
```typescript
async function getUserSkills(userId: string): Promise<UserSkill[]> {
  const { data } = await supabase
    .from('user_skills')
    .select(`
      *,
      skill:skills(
        id,
        name,
        category,
        description
      )
    `)
    .eq('user_id', userId)
    .order('current_level', { ascending: false })

  return data || []
}
```

**Find Users with Skill:**
```typescript
async function getUsersBySkill(skillId: string, minLevel: number = 70): Promise<User[]> {
  const { data } = await supabase
    .from('user_skills')
    .select(`
      user:users(
        id,
        first_name,
        last_name,
        email
      ),
      current_level,
      demonstrated_at
    `)
    .eq('skill_id', skillId)
    .gte('current_level', minLevel)
    .order('current_level', { ascending: false })

  return data?.map(d => ({ ...d.user, skillLevel: d.current_level })) || []
}
```

---

## 6. Skills Gap Analysis

### 6.1 Job vs User Skills Comparison

**Gap Calculation:**
```typescript
interface SkillGap {
  skillId: string
  skillName: string
  requiredLevel: number      // From job_skills.proficiency_threshold
  currentLevel: number       // From user_skills.current_level
  gap: number                // requiredLevel - currentLevel
  gapSize: 'small' | 'medium' | 'large'
  priority: 'critical' | 'important' | 'helpful'
}

async function calculateSkillGaps(userId: string, jobId: string): Promise<SkillGap[]> {
  // 1. Get required skills for job
  const jobSkills = await getJobSkills(jobId)

  // 2. Get user's current skill levels
  const userSkills = await getUserSkills(userId)
  const userSkillMap = new Map(userSkills.map(us => [us.skill_id, us.current_level]))

  // 3. Calculate gaps
  const gaps = jobSkills.map(jobSkill => {
    const currentLevel = userSkillMap.get(jobSkill.skill_id) || 0
    const gap = Math.max(0, jobSkill.proficiency_threshold - currentLevel)

    return {
      skillId: jobSkill.skill_id,
      skillName: jobSkill.skill.name,
      requiredLevel: jobSkill.proficiency_threshold,
      currentLevel,
      gap,
      gapSize: gap <= 20 ? 'small' : gap <= 40 ? 'medium' : 'large',
      priority: jobSkill.importance_level
    }
  })

  return gaps.filter(gap => gap.gap > 0) // Only return actual gaps
}
```

---

### 6.2 Gap Visualization

**Critical Gaps (Red):** Importance = 'critical', gap > 20%
**Important Gaps (Orange):** Importance = 'important', gap > 15%
**Helpful Gaps (Yellow):** Importance = 'helpful', gap > 10%

**Dashboard Display:**
```typescript
// Group gaps by priority
const criticalGaps = gaps.filter(g => g.priority === 'critical' && g.gap > 20)
const importantGaps = gaps.filter(g => g.priority === 'important' && g.gap > 15)
const helpfulGaps = gaps.filter(g => g.priority === 'helpful' && g.gap > 10)

// Calculate overall readiness
const totalGaps = gaps.reduce((sum, g) => sum + g.gap * getImportanceWeight(g.priority), 0)
const overallReadiness = Math.max(0, 100 - totalGaps)
```

---

## 7. Learning Pathways

### 7.1 Program Recommendation Engine

**Gap-to-Program Matching:**
```typescript
async function recommendProgramsForGaps(skillGaps: SkillGap[]): Promise<ProgramRecommendation[]> {
  const recommendations = []

  // 1. Identify critical gaps
  const criticalGaps = skillGaps.filter(g => g.priority === 'critical' && g.gap > 20)
  const criticalSkillIds = criticalGaps.map(g => g.skillId)

  // 2. Find programs that teach critical skills
  const { data: programSkills } = await supabase
    .from('program_skills')
    .select(`
      program_id,
      skill_id,
      coverage_level,
      weight,
      program:programs(
        id,
        name,
        short_desc,
        duration_text,
        program_type,
        cost_range
      )
    `)
    .in('skill_id', criticalSkillIds)

  // 3. Calculate gap coverage per program
  const programMap = new Map()

  for (const ps of programSkills) {
    const existing = programMap.get(ps.program_id) || {
      program: ps.program,
      skillsCovered: 0,
      totalWeight: 0,
      coverageScore: 0
    }

    existing.skillsCovered++
    existing.totalWeight += ps.weight
    existing.coverageScore += ps.weight * (ps.coverage_level === 'primary' ? 1.0 : 0.7)

    programMap.set(ps.program_id, existing)
  }

  // 4. Rank programs by coverage
  const rankedPrograms = Array.from(programMap.values())
    .map(p => ({
      ...p.program,
      gapCoverage: p.coverageScore / criticalGaps.length,
      skillsCovered: p.skillsCovered,
      totalSkills: criticalGaps.length
    }))
    .filter(p => p.gapCoverage >= 0.6) // At least 60% coverage
    .sort((a, b) => b.gapCoverage - a.gapCoverage)
    .slice(0, 5) // Top 5 recommendations

  return rankedPrograms
}
```

---

### 7.2 Learning Sequence Optimization

**Prerequisite Chain Analysis:**
```typescript
function optimizeLearningSequence(gaps: SkillGap[], availablePrograms: Program[]): Program[] {
  // 1. Build skill dependency graph
  const skillGraph = buildSkillDependencyGraph()

  // 2. Identify foundation skills (no prerequisites)
  const foundationSkills = gaps.filter(gap =>
    !skillGraph.get(gap.skillId)?.prerequisites?.length
  )

  // 3. Order programs by foundation skill coverage first
  const orderedPrograms = availablePrograms.sort((a, b) => {
    const aFoundationCoverage = calculateFoundationCoverage(a, foundationSkills)
    const bFoundationCoverage = calculateFoundationCoverage(b, foundationSkills)

    return bFoundationCoverage - aFoundationCoverage
  })

  return orderedPrograms
}
```

---

### 7.3 Pathway Tracking

**User Progress Database:**
```sql
CREATE TABLE learning_pathways (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  job_id UUID REFERENCES jobs(id),

  -- Pathway configuration
  skill_gaps JSONB,                    -- Original gaps analysis
  recommended_programs JSONB,          -- Program sequence
  estimated_completion_months INTEGER,

  -- Progress tracking
  completed_programs UUID[],           -- Array of completed program IDs
  completed_skills UUID[],             -- Array of mastered skill IDs
  current_program_id UUID,

  -- Status
  status TEXT DEFAULT 'active',        -- 'active'|'completed'|'paused'
  started_at TIMESTAMP DEFAULT NOW(),
  last_updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 8. Cross-System Data Flow

### 8.1 Assessment → User Skills → Job Matching

**Complete Flow:**
```
Assessment Completed
        ↓
Skill Results Calculated (assessment_skill_results)
        ↓
User Skills Updated (user_skills)
        ↓
Job Readiness Calculated (role_readiness_scores)
        ↓
Employer Notifications Sent (employer_invitations)
        ↓
Skills Gaps Identified
        ↓
Program Recommendations Generated
        ↓
Learning Pathway Created (learning_pathways)
```

---

### 8.2 Real-Time Synchronization

**Event-Driven Updates:**
```typescript
// Assessment completion trigger
async function onAssessmentComplete(assessmentId: string) {
  // 1. Calculate skill results
  const skillResults = await calculateAssessmentResults(assessmentId)

  // 2. Update user skills
  await updateUserSkillsFromAssessment(assessment.user_id, skillResults)

  // 3. Calculate job readiness
  await calculateRoleReadiness(assessment.user_id, assessment.job_id, skillResults)

  // 4. Check employer invitations
  await checkEmployerInvitations(assessment.user_id, assessment.job_id, skillResults)

  // 5. Generate learning recommendations
  await generateLearningPathway(assessment.user_id, assessment.job_id)
}
```

---

### 8.3 Performance Optimization

**Caching Strategy:**
```typescript
// Cache skill relationships for performance
const skillCache = new Map()

async function getCachedJobSkills(jobId: string): Promise<JobSkill[]> {
  if (skillCache.has(jobId)) {
    return skillCache.get(jobId)
  }

  const skills = await getJobSkills(jobId)
  skillCache.set(jobId, skills)

  // Expire after 1 hour
  setTimeout(() => skillCache.delete(jobId), 60 * 60 * 1000)

  return skills
}
```

---

## 9. Implementation Details

### 9.1 Core Service Files

**Skills Relationships:** `/src/lib/services/skills-relationships.ts`
**Gap Analysis:** `/src/lib/services/skills-gap-analysis.ts`
**Learning Pathways:** `/src/lib/services/learning-pathways.ts`
**Program Matching:** `/src/lib/services/program-recommendations.ts`

### 9.2 Database Queries

**Complex Relationship Queries:**
```typescript
// Find users qualified for jobs based on skills
async function findQualifiedUsers(jobId: string, minProficiency: number = 80) {
  return await supabase.rpc('get_qualified_candidates', {
    job_id: jobId,
    min_proficiency: minProficiency
  })
}

// Find programs that fill specific skill gaps
async function findGapFillingPrograms(skillIds: string[], minCoverage: number = 0.7) {
  return await supabase.rpc('get_programs_for_skills', {
    skill_ids: skillIds,
    min_coverage: minCoverage
  })
}
```

---

## 10. Testing & Validation

### 10.1 Relationship Integrity Tests

**Skill Mapping Validation:**
```typescript
test('job skills relationships are consistent', async () => {
  const jobs = await getAllJobs()

  for (const job of jobs) {
    const skills = await getJobSkills(job.id)

    // Ensure all skills exist in taxonomy
    for (const skill of skills) {
      const skillExists = await skillExistsInTaxonomy(skill.skill_id)
      expect(skillExists).toBe(true)
    }

    // Ensure importance levels are valid
    const validLevels = ['critical', 'important', 'helpful']
    for (const skill of skills) {
      expect(validLevels).toContain(skill.importance_level)
    }
  }
})
```

---

### 10.2 Data Flow Integration Tests

**End-to-End Skills Flow:**
```typescript
test('complete skills data flow works', async () => {
  // 1. Create job with skills
  const job = await createJobWithSkills()

  // 2. Generate assessment
  const assessment = await generateAssessment(job.id)

  // 3. Simulate user completion
  const results = await completeAssessment(assessment.id)

  // 4. Verify user skills updated
  const userSkills = await getUserSkills(results.user_id)
  expect(userSkills.length).toBeGreaterThan(0)

  // 5. Verify job readiness calculated
  const readiness = await getRoleReadiness(results.user_id, job.id)
  expect(readiness).toBeDefined()

  // 6. Verify program recommendations generated
  const programs = await getRecommendedPrograms(results.user_id, job.id)
  expect(programs.length).toBeGreaterThan(0)
})
```

---

**This universal currency architecture enables SkillSync to deliver precision workforce intelligence by connecting all platform components through a comprehensive skills framework.**

---

*Last Updated: October 7, 2025 | Status: Production Ready*
