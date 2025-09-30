# Next Steps: CIP-SOC-Skills Pipeline Integration

## Current Status (Sept 30, 2025)

### ✅ Completed
- [x] Programs schema extended with 10 new fields
- [x] HubSpot programs imported (218 Bisk Amplified + 5 Direct)
- [x] Admin tools fully functional
- [x] Schools catalog affiliation implemented
- [x] Data integrity validated (35 tests passing)

### 🎯 Next Phase: CIP-SOC-Skills Pipeline

## Overview

The CIP-SOC-Skills pipeline will create the **central fabric** connecting:
- **Programs** (via CIP codes) → **Skills**
- **Jobs/Occupations** (via SOC codes) → **Skills**
- **Assessments** → **Skills**

This enables:
1. **Program-to-Job Matching** - Show relevant jobs for each program
2. **Skills Gap Analysis** - Identify missing skills between programs and jobs
3. **Personalized Learning Paths** - Recommend programs based on career goals
4. **Assessment Accuracy** - Generate targeted quizzes based on program/job skills

---

## Phase 1: CIP Code Enrichment (Week 1)

### Goal
Populate skills for all programs based on their CIP codes using O*NET/Lightcast taxonomy.

### Tasks

#### 1.1 CIP-to-SOC Crosswalk
- [ ] Download NCES CIP-SOC crosswalk data
- [ ] Create `cip_soc_crosswalk` table
- [ ] Import crosswalk mappings
- [ ] Add indexes for performance

```sql
CREATE TABLE cip_soc_crosswalk (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cip_code TEXT NOT NULL,
  soc_code TEXT NOT NULL,
  match_strength DECIMAL(3,2), -- 0.00 to 1.00
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cip_code, soc_code)
);
```

#### 1.2 CIP Skills Extraction Service
- [ ] Create `/src/lib/services/cip-skills-extraction.ts`
- [ ] Implement CIP → SOC lookup
- [ ] Fetch skills from existing SOC data
- [ ] Aggregate and deduplicate skills
- [ ] Weight skills by match strength

#### 1.3 Program Skills Population
- [ ] Create admin UI for CIP enrichment
- [ ] Batch process programs by CIP code
- [ ] Insert into `program_skills` table
- [ ] Update `skills_count` trigger
- [ ] Add progress tracking

#### 1.4 Admin Interface
- [ ] Add "Enrich Skills" button to programs admin
- [ ] Show CIP → SOC mapping in UI
- [ ] Display skill preview before save
- [ ] Allow manual skill curation (30 → 5-8 pattern)
- [ ] Bulk enrich by discipline

**Deliverables:**
- CIP crosswalk table populated
- All programs have skills linked
- Admin can enrich/re-enrich programs
- Skills count auto-updates

---

## Phase 2: Program-Job Matching (Week 2)

### Goal
Enable "Related Jobs" and "Related Programs" features based on shared skills.

### Tasks

#### 2.1 Skills Similarity Algorithm
- [ ] Create `/src/lib/services/skills-matching.ts`
- [ ] Implement Jaccard similarity for skill sets
- [ ] Add weighted matching (skill importance)
- [ ] Create matching score threshold (60%+)

#### 2.2 Database Functions
```sql
-- Get related jobs for a program
CREATE OR REPLACE FUNCTION get_related_jobs_for_program(
  program_uuid UUID,
  match_threshold DECIMAL DEFAULT 0.60,
  limit_count INT DEFAULT 10
)
RETURNS TABLE(...) AS $$
  -- Calculate skill overlap between program and jobs
  -- Return jobs with >= threshold match
$$ LANGUAGE plpgsql;

-- Get related programs for a job
CREATE OR REPLACE FUNCTION get_related_programs_for_job(
  job_uuid UUID,
  match_threshold DECIMAL DEFAULT 0.60,
  limit_count INT DEFAULT 10
)
RETURNS TABLE(...) AS $$
  -- Calculate skill overlap between job and programs
  -- Return programs with >= threshold match
$$ LANGUAGE plpgsql;
```

#### 2.3 UI Components
- [ ] Create `RelatedJobs` component for program detail pages
- [ ] Create `RelatedPrograms` component for job detail pages
- [ ] Show match percentage
- [ ] Display shared skills
- [ ] Add "View Details" links

#### 2.4 Main App Integration
- [ ] Add "Related Jobs" section to `/programs/[id]` page
- [ ] Add "Related Programs" section to `/jobs/[id]` page
- [ ] Implement lazy loading for performance
- [ ] Add caching for popular programs/jobs

**Deliverables:**
- Matching algorithm working
- Related jobs/programs showing on detail pages
- Match scores visible to users
- Shared skills highlighted

---

## Phase 3: Skills Gap Analysis (Week 3)

### Goal
Show users what skills they need to learn to qualify for target jobs.

### Tasks

#### 3.1 Gap Calculation Service
- [ ] Create `/src/lib/services/skills-gap-analysis.ts`
- [ ] Calculate missing skills: `job_skills - program_skills`
- [ ] Prioritize by skill importance/weight
- [ ] Categorize gaps (critical, important, nice-to-have)

#### 3.2 Gap Visualization
- [ ] Create `SkillsGapChart` component
- [ ] Show current skills (from program)
- [ ] Show required skills (from job)
- [ ] Highlight gaps with visual indicators
- [ ] Add skill proficiency levels

#### 3.3 Learning Path Recommendations
- [ ] Recommend programs to fill gaps
- [ ] Show skill coverage percentage
- [ ] Estimate time to proficiency
- [ ] Link to program enrollment

#### 3.4 User Dashboard
- [ ] Add "My Skills Gap" section to user profile
- [ ] Show progress toward target jobs
- [ ] Track completed programs
- [ ] Update gap as skills are acquired

**Deliverables:**
- Skills gap calculator working
- Visual gap analysis on job pages
- Program recommendations based on gaps
- User progress tracking

---

## Phase 4: Assessment Integration (Week 4)

### Goal
Generate targeted assessments based on program/job skills.

### Tasks

#### 4.1 Skills-Based Quiz Generation
- [ ] Extend `llm_generate_quiz` to accept skill lists
- [ ] Generate questions for specific skills
- [ ] Weight questions by skill importance
- [ ] Create program-specific assessments
- [ ] Create job-specific assessments

#### 4.2 Assessment Routing
- [ ] Add "Test Your Skills" to program pages
- [ ] Add "Assess Readiness" to job pages
- [ ] Pre-populate assessment with relevant skills
- [ ] Show expected proficiency levels

#### 4.3 Results Analysis
- [ ] Compare user scores to program requirements
- [ ] Compare user scores to job requirements
- [ ] Identify weak skills
- [ ] Recommend targeted learning

#### 4.4 Admin Tools
- [ ] Preview generated assessments
- [ ] Edit AI-generated questions
- [ ] Set passing thresholds
- [ ] Publish assessments

**Deliverables:**
- Skills-based assessment generation
- Program/job-specific quizzes
- Results tied to skills gaps
- Admin curation interface

---

## Technical Architecture

### Data Flow
```
1. Program (CIP Code) → CIP-SOC Crosswalk → SOC Codes
2. SOC Codes → O*NET Skills → Program Skills
3. Program Skills ↔ Job Skills → Matching Score
4. Skills Gap = Job Skills - Program Skills
5. Skills Gap → Assessment Questions
6. Assessment Results → Skills Proficiency
7. Skills Proficiency → Learning Recommendations
```

### Key Tables
- `cip_soc_crosswalk` - CIP to SOC mappings
- `program_skills` - Program to skills (existing)
- `job_skills` - Job to skills (existing)
- `skills` - Master skills taxonomy (existing)
- `assessment_skills` - Assessment to skills (existing)

### Key Services
- `/src/lib/services/cip-skills-extraction.ts`
- `/src/lib/services/skills-matching.ts`
- `/src/lib/services/skills-gap-analysis.ts`
- `/src/lib/services/assessment-generation.ts` (extend existing)

### Key Components
- `<RelatedJobs />` - Show matching jobs for program
- `<RelatedPrograms />` - Show matching programs for job
- `<SkillsGapChart />` - Visualize skills gaps
- `<LearningPathRecommendations />` - Suggest programs
- `<SkillsBasedAssessment />` - Targeted quizzes

---

## Success Metrics

### Phase 1 (CIP Enrichment)
- [ ] 100% of programs have skills populated
- [ ] Average 5-8 skills per program
- [ ] Skills sourced from O*NET/Lightcast
- [ ] Admin can re-enrich in < 30 seconds

### Phase 2 (Matching)
- [ ] Related jobs show on all program pages
- [ ] Related programs show on all job pages
- [ ] Match scores >= 60% threshold
- [ ] < 500ms query performance

### Phase 3 (Gap Analysis)
- [ ] Skills gap visible on job pages
- [ ] Program recommendations accurate
- [ ] Gap visualization clear and actionable
- [ ] User dashboard shows progress

### Phase 4 (Assessments)
- [ ] Skills-based quizzes generate in < 10s
- [ ] Questions target specific skills
- [ ] Results show skill proficiency
- [ ] Recommendations based on gaps

---

## Timeline

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1 | CIP Enrichment | All programs have skills |
| 2 | Matching | Related jobs/programs live |
| 3 | Gap Analysis | Skills gap visualization |
| 4 | Assessments | Skills-based quizzes |

**Total: 4 weeks to complete CIP-SOC-Skills pipeline**

---

## Dependencies

### External Data
- NCES CIP-SOC Crosswalk (free, government data)
- O*NET Skills (already integrated)
- Lightcast Skills (already integrated)

### Existing Systems
- Programs table (✅ ready)
- Jobs table (✅ ready)
- Skills table (✅ ready)
- Assessment system (✅ ready)
- Admin tools (✅ ready)

### New Requirements
- CIP crosswalk table
- Matching algorithm
- Gap calculation service
- UI components

---

## Risk Mitigation

### Data Quality
- **Risk:** CIP-SOC mappings may be incomplete
- **Mitigation:** Manual curation for unmapped CIPs, use program descriptions as fallback

### Performance
- **Risk:** Matching queries may be slow with large datasets
- **Mitigation:** Implement caching, pre-calculate popular matches, use database indexes

### User Experience
- **Risk:** Skills gap may be overwhelming
- **Mitigation:** Prioritize critical skills, show progress, provide clear next steps

### AI Accuracy
- **Risk:** Generated assessments may not be relevant
- **Mitigation:** Admin review required, user feedback loop, A/B testing

---

## Next Immediate Steps

1. **Review CIP Crosswalk Data** - Download and analyze NCES data
2. **Design Database Schema** - Create crosswalk table migration
3. **Build Extraction Service** - CIP → SOC → Skills pipeline
4. **Create Admin UI** - Enrichment interface for programs
5. **Test with Sample Programs** - Validate approach with 10 programs

**Ready to start Phase 1?** 🚀
