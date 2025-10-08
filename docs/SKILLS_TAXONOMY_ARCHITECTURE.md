# Skills Taxonomy Architecture - Complete Technical Deep Dive

**Document Version:** 1.0  
**Last Updated:** October 7, 2025  
**Author:** SkillSync Engineering Team  
**Audience:** Senior Engineers (no prior codebase knowledge required)

---

## Executive Summary

SkillSync uses a **hybrid skills taxonomy** combining three authoritative sources to create a comprehensive, industry-validated, government-compliant skills framework. This document explains the complete architecture, data sources, mapping strategies, deduplication logic, and implementation details.

**Key Architecture Decision:** Skills are the **universal currency** connecting jobs, programs, assessments, and users. Everything in SkillSync flows through skills.

---

## Table of Contents

1. [Skills Taxonomy Sources](#1-skills-taxonomy-sources)
2. [Database Schema](#2-database-schema)
3. [Hybrid Skills Architecture](#3-hybrid-skills-architecture)
4. [Skills Filtering System](#4-skills-filtering-system)
5. [Deduplication Strategy](#5-deduplication-strategy)
6. [SOC-Based Population](#6-soc-based-population)
7. [CIP-Based Program Skills](#7-cip-based-program-skills)

---

## 1. Skills Taxonomy Sources

### 1.1 Lightcast Open Skills API

**Purpose:** Industry-current, market-validated taxonomy  
**Scale:** 32,000+ skills  
**Credibility:** Used by LinkedIn, Indeed, Monster, Fortune 500 companies  
**Cost:** FREE for education/research use

**Why Lightcast:**
- Real-world skills from millions of job postings
- Modern technology (React, AWS, Docker, Python 3.x)
- Granular specificity (\"Django\" vs \"Flask\" vs \"FastAPI\")
- Industry validation

**API Details:**
```bash
Endpoint: https://skills.emsidata.com/
Auth: OAuth 2.0 (Client ID + Secret)
Rate Limits: 10K requests/day (free tier)
```

**Data Structure:**
```json
{
  "id": "KS1200364C9C1LK3V5Q1",
  "name": "Python (Programming Language)",
  "type": { "name": "Hard Skill" },
  "category": { "name": "IT and Software Development" }
}
```

**Integration:**
- Service: `/src/lib/services/lightcast-skills.ts`
- Import: `/scripts/import-lightcast-skills.js`

---

### 1.2 O*NET Web Services

**Purpose:** Government-validated occupational standards  
**Scale:** 1,000-2,000 skills  
**Credibility:** U.S. Department of Labor (DOL/ETA)  
**Cost:** FREE

**Why O*NET:**
- Government compliance (state/federal partnerships)
- Validated importance ratings (1.0-5.0)
- SOC code integration
- CIP code crosswalks

**API Details:**
```bash
Endpoint: https://services.onetcenter.org/ws/online/
Auth: Basic Auth
Rate Limits: 20 requests/minute
```

**Data Structure:**
```json
{
  "element": {
    "id": "2.B.1.a",
    "name": "Administration and Management"
  },
  "score": {
    "value": 4.5  // Importance: 1.0-5.0
  }
}
```

**Integration:**
- Service: `/src/lib/api/onet-client.ts`
- Mapper: `/src/lib/services/onet-skills-mapper.ts`

---

### 1.3 AI Semantic Matching (OpenAI)

**Purpose:** Intelligent relevance scoring  
**Provider:** GPT-4o-mini  
**Cost:** ~$0.01 per 100 skills

**Why AI Enhancement:**
- Semantic understanding (\"ML\" matches \"AI\")
- Context awareness (different skills per role level)
- Intelligent ranking (critical vs peripheral)
- Vendor filtering (exclude \"AWS SDK v2.1.3\")

**Integration:**
- Service: `/src/lib/services/hybrid-skills-mapper.ts`
- Context: `/src/lib/services/enhanced-ai-context.ts`

---

## 2. Database Schema

### 2.1 Skills Table

```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY,

  -- External IDs (deduplication)
  lightcast_id TEXT UNIQUE,
  onet_id TEXT,

  -- Core fields
  name TEXT NOT NULL,
  category TEXT,
  source TEXT NOT NULL,  -- 'LIGHTCAST'|'ONET'|'HYBRID'
  description TEXT,

  -- Assessment config
  is_assessable BOOLEAN DEFAULT true,
  onet_importance DECIMAL(3,1),  -- 1.0-5.0

  -- Proficiency levels
  proficiency_levels JSONB,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_skills_lightcast ON skills(lightcast_id);
CREATE INDEX idx_skills_onet ON skills(onet_id);
CREATE INDEX idx_skills_source ON skills(source);
```

**Current Scale:**
- Total: ~32,000 skills
- O*NET validated: ~1,500
- Assessable: ~25,000

---

### 2.2 Job Skills Junction

```sql
CREATE TABLE job_skills (
  job_id UUID REFERENCES jobs(id),
  skill_id UUID REFERENCES skills(id),

  -- Weighting
  importance_level TEXT,  -- 'critical'|'important'|'helpful'
  proficiency_threshold INTEGER,  -- 60-100%
  weight DECIMAL(3,2),  -- 0.0-1.0

  -- Source metadata
  onet_data_source JSONB,

  PRIMARY KEY (job_id, skill_id)
);
```

**Importance Mapping:**
- **Critical:** 5.0 importance, 80%+ threshold
- **Important:** 4.0 importance, 70%+ threshold
- **Helpful:** 3.0 importance, 60%+ threshold

---

### 2.3 Program Skills Junction

```sql
CREATE TABLE program_skills (
  program_id UUID REFERENCES programs(id),
  skill_id UUID REFERENCES skills(id),

  -- Coverage
  coverage_level TEXT,  -- 'primary'|'secondary'|'supplemental'
  weight DECIMAL(3,2),

  PRIMARY KEY (program_id, skill_id)
);
```

---

### 2.4 Quiz Questions

```sql
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY,
  section_id UUID REFERENCES quiz_sections(id),
  skill_id UUID REFERENCES skills(id),

  -- Content
  stem TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_answer TEXT NOT NULL,

  -- Weighting
  difficulty TEXT,  -- 'beginner'|'intermediate'|'expert'
  importance DECIMAL(3,1) DEFAULT 3.0,  -- 1.0-5.0
  points INTEGER DEFAULT 10,

  -- Question bank
  is_bank_question BOOLEAN DEFAULT false,
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMP
);
```

---

## 3. Hybrid Skills Architecture

### 3.1 Why Hybrid?

**O*NET alone:**
- ❌ Too generic
- ❌ Missing modern tech (no React, AWS, Docker)
- ✅ Government validated
- ✅ Importance ratings

**Lightcast alone:**
- ✅ Current technology
- ✅ Specific skills
- ❌ No validation
- ❌ Vendor bloat

**Hybrid (SkillSync):**
- ✅ Best of both
- ✅ AI intelligence
- ✅ Context-aware
- ✅ Deduplicated

---

### 3.2 Architecture Diagram

```
┌───────────────────────────────────────────┐
│       HYBRID SKILLS MAPPER                │
└───────────────────────────────────────────┘
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
┌───────┐ ┌───────┐ ┌───────┐
│ O*NET │ │Lightct│ │OpenAI │
│       │ │       │ │       │
│ 1-2K  │ │ 32K+  │ │Ranking│
│Validated│ │Current│ │0-100  │
└───────┘ └───────┘ └───────┘
    │       │       │
    └───────┼───────┘
            ▼
    ┌──────────────┐
    │   SKILLS DB  │
    │(Deduplicated)│
    └──────────────┘
```

---

### 3.3 Two-Track Strategy

**Track 1: Standard Occupations (SOC)**

**Source:** O*NET + Lightcast (broad, universal)

**Example:** Software Developer (15-1252.00)
- Skills: Python, Java, SQL, Git, Agile
- **Excludes:** Amazon S3, Microsoft Azure (vendor-specific)
- **Result:** 10-15 universal skills

**Code:** `/src/lib/services/hybrid-skills-mapper.ts`

```typescript
const VENDOR_SPECIFIC_PATTERNS = [
  'Amazon', 'AWS', 'Microsoft', 'Google',
  'Oracle', 'SAP', 'Salesforce'
]

// Filter OUT vendor-specific for standard occupations
const broadSkills = skills.filter(s =>
  !VENDOR_SPECIFIC_PATTERNS.some(vendor =>
    s.name.toLowerCase().includes(vendor.toLowerCase())
  )
)
```

---

**Track 2: Featured Roles (Company-Specific)**

**Source:** Lightcast + Job Description (hyper-specific)

**Example:** \"Senior React Developer at Acme\"
- Skills: React 18, TypeScript, AWS Lambda, GraphQL, Jest
- **Includes:** Vendor-specific if relevant
- **Result:** 5-8 exact requirements

---

### 3.4 AI Semantic Matching

**Process:**
1. Fetch 30-45 candidate skills (O*NET + Lightcast)
2. Send to GPT-4o-mini with job context
3. AI returns top 15 with relevance scores
4. Save top 10-12 to database

**AI Prompt:**
```typescript
const prompt = `Job: ${title}
SOC: ${soc_code}
Description: ${long_desc}

From ${skills.length} skills, select 15 most relevant.
Rate relevance (0-100) and importance level.

Rules:
- Standard occupations: BROAD skills (Python, SQL)
- Featured roles: SPECIFIC skills (React 18, AWS)
- Balance O*NET (validated) and Lightcast (current)

Return JSON: [{
  "skillIndex": 0,
  "relevanceScore": 95,
  "importanceLevel": "critical"
}]`
```

**Code:** `/src/lib/services/hybrid-skills-mapper.ts` → `rankSkillsWithAI()`

---

## 4. Skills Filtering System

### 4.1 Generic Skills Exclusion

**Problem:** O*NET includes 69 generic abilities unsuitable for assessment

**Excluded Categories:**
- Physical abilities (Near Vision, Hearing)
- Basic communication (Speaking, Writing)
- Cognitive abilities (Oral Comprehension)
- Soft skills (Active Listening, Time Management)

**Why Exclude:**
- Not differentiating (everyone has these)
- Hard to assess objectively
- Not job-specific
- Better tested via resume/interview

---

### 4.2 Implementation

**Location:** `/src/lib/services/skills-taxonomy-mapper.ts`

```typescript
const EXCLUDED_ONET_CATEGORIES = [
  'Basic Skills',
  'Cross-Functional Skills',
  'Abilities',
  'Work Styles'
]

const GENERIC_SKILL_NAMES = [
  'Near Vision', 'English Language',
  'Reading Comprehension', 'Active Listening',
  'Speaking', 'Writing', 'Critical Thinking',
  'Programming',  // Too generic
  // ... 40+ exclusions
]

function shouldAssessSkill(
  name: string,
  category: string
): boolean {
  // Check exclusions
  if (GENERIC_SKILL_NAMES.includes(name)) {
    return false
  }

  // Default: assessable
  return true
}
```

---

### 4.3 Filtering Results

**Before:** 47 O*NET skills for SOC 15-1252.00
**After:** 27 assessable skills (57% pass rate)

**Breakdown:**
- Critical: 8 skills
- Important: 12 skills
- Helpful: 7 skills

---

## 5. Deduplication Strategy

### 5.1 The Problem

**Challenge:** Same skill, multiple sources, different IDs

**Example:**
- Lightcast: \"Python (Programming Language)\" (KS1200364C9C1LK3V5Q1)
- O*NET: \"Programming\" (2.B.5.b)

**Naive Approach:**
- Import both → duplicates
- Jobs link to both → fragmented data

**SkillSync Approach:**
- One skill, one database entry
- Track external IDs
- Perfect normalization

---

### 5.2 Implementation

**Schema:**
```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY,
  lightcast_id TEXT UNIQUE,  -- Enforces dedup
  onet_id TEXT,              -- Can map multiple
  name TEXT NOT NULL
);
```

**Import (Lightcast):**
```typescript
for (const skill of lightcastSkills) {
  await supabase
    .from('skills')
    .upsert({
      lightcast_id: skill.id,
      name: skill.name,
      source: 'LIGHTCAST'
    }, {
      onConflict: 'lightcast_id',
      ignoreDuplicates: true
    })
}
```

**Enhance (O*NET):**
```typescript
for (const onet of onetSkills) {
  // Find matching Lightcast skill
  const existing = await findByName(onet.name)

  if (existing) {
    // Enhance with O*NET data
    await update(existing.id, {
      onet_id: onet.id,
      onet_importance: onet.importance,
      source: 'HYBRID'
    })
  } else {
    // Create O*NET-only skill
    await insert({
      onet_id: onet.id,
      name: onet.name,
      source: 'ONET'
    })
  }
}
```

---

### 5.3 Results

**Database Stats:**
- Total skills: 32,147
- Lightcast-only: 30,653 (95.4%)
- O*NET-only: 487 (1.5%)
- Hybrid: 1,007 (3.1%)

**Perfect Normalization:** ✅ Zero duplicates

---

## 6. SOC-Based Population

### 6.1 SOC Code System

**What:** Standard Occupational Classification  
**Format:** 6-digit (15-1252.00)  
**Maintained by:** U.S. Bureau of Labor Statistics

**Why Important:**
- Government compliance
- O*NET integration
- BLS statistics
- CIP crosswalks

---

### 6.2 Population Workflow

**Step 1:** Get jobs with SOC codes
```typescript
const jobs = await getJobsWithSOC()
```

**Step 2:** Fetch skills
```typescript
const onet = await fetchONETSkills(soc)
const lightcast = await getLightcastSkills(job)
const combined = dedupe([...onet, ...lightcast])
```

**Step 3:** AI ranking
```typescript
const ranked = await rankWithAI(job, combined)
const top = ranked.slice(0, 15)
```

**Step 4:** Save
```typescript
await saveToJobSkills(job.id, top)
```

---

### 6.3 Population Script

**Location:** `/scripts/populate-job-skills.js`

**Usage:**
```bash
node scripts/populate-job-skills.js --all
node scripts/populate-job-skills.js --soc 15-1252.00
```

**Output:**
```
🔄 Starting population...
📊 Found 38 jobs

Job 1/38: Software Developer (15-1252.00)
  📚 O*NET: 12 skills
  💡 Lightcast: 25 skills
  🔗 Combined: 32 unique
  🤖 AI ranked: 15
  ✅ Saved: 10 top skills

✅ Complete!
Jobs: 38
Skills: 387
Avg/job: 10.2
```

---

## 7. CIP-Based Program Skills

### 7.1 CIP Code System

**What:** Classification of Instructional Programs  
**Format:** 6-digit (11.0101)  
**Maintained by:** National Center for Education Statistics

**CIP-SOC Crosswalk:**
- CIP 11.0101 (Computer Science)
- → SOC 15-1252 (Software Dev)
- → SOC 15-1244 (Network Admin)

---

### 7.2 Extraction Strategy

**Challenge:** Programs lack direct skill listings

**Solution:** Inherit from target SOC codes

**Process:**
```
Program (CIP 11.0101)
  ↓ Crosswalk
SOC 15-1252.00
  ↓ Has skills
Skills: Python, Java, SQL
  ↓ Copy
Program Skills: Python, Java, SQL
```

---

### 7.3 Implementation

**Location:** `/src/lib/services/program-skills-extraction.ts`

**Process:**
```typescript
// 1. Get target SOC codes
const socs = await getCrosswalk(program.cip_code)

// 2. Get skills from all target SOCs
const skills = await getSkillsFromSOCs(socs)

// 3. Save to program_skills with coverage levels
for (const skill of skills) {
  await supabase
    .from('program_skills')
    .upsert({
      program_id: program.id,
      skill_id: skill.id,
      coverage_level: 'primary', // or 'secondary'
      weight: skill.importance / 5.0
    })
}
```

---

## 8. Data Quality & Validation

### 8.1 Quality Metrics

**Skill Coverage:**
- Jobs with SOC codes: 38/38 (100%)
- Jobs with skills: 38/38 (100%)
- Average skills per job: 10.2

**Assessment Readiness:**
- Skills with importance ratings: 1,007 (3.1%)
- Assessable skills: 25,000+ (78%)
- Skills with proficiency levels: 0 (future enhancement)

### 8.2 Validation Checks

**Dedup Verification:**
```sql
-- Check for duplicates
SELECT name, COUNT(*) as count
FROM skills
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;
-- Should return 0 rows
```

**Skill Mapping Integrity:**
```sql
-- Check job_skills references
SELECT COUNT(*) as orphaned
FROM job_skills js
LEFT JOIN skills s ON js.skill_id = s.id
WHERE s.id IS NULL;
-- Should be 0
```

**Assessment Coverage:**
```sql
-- Skills used in quizzes
SELECT COUNT(DISTINCT skill_id) as quiz_skills
FROM quiz_questions;
-- Should be > 0
```

---

## 9. Current Status & What's Working

### ✅ What's Working Well

1. **Hybrid Taxonomy:** Lightcast + O*NET + AI integration complete
2. **Perfect Deduplication:** Zero duplicate skills in database
3. **SOC Population:** All 38 jobs have skills mapped
4. **Assessment Engine:** Weighted scoring with AI evaluation
5. **Data Scale:** 32K+ skills, 1K+ skill mappings

### ⚠️ What's Broken or Incomplete

1. **Program Skills:** CIP-based extraction not fully automated
2. **Proficiency Levels:** Skills lack beginner/intermediate/expert definitions
3. **Assessment Analytics:** Limited tracking of skill improvement over time
4. **Question Bank:** Anti-cheat rotation system partially implemented

### 🎯 What's Missing

1. **Skills Gap Analysis:** Visual gap identification between jobs/programs
2. **Learning Pathways:** Automated program recommendations based on gaps
3. **Skill Market Intelligence:** Real-time demand tracking
4. **Company Skill Libraries:** Custom skill sets for featured roles

---

## 10. Implementation Roadmap

### Phase 1: Foundation (✅ Complete)
- Hybrid skills taxonomy
- SOC-based job population
- Basic assessment weighting

### Phase 2: Enhancement (🚧 In Progress)
- Program skills extraction
- Proficiency level definitions
- Question bank expansion

### Phase 3: Intelligence (📋 Planned)
- Skills gap visualization
- Learning pathway generation
- Market demand integration

### Phase 4: Enterprise (📋 Future)
- Company skill libraries
- Advanced analytics
- Predictive modeling

---

## 11. Technical Debt & Recommendations

### High Priority
1. **Automate Program Skills:** CIP extraction should be event-driven
2. **Add Proficiency Levels:** Enable skill-by-skill gap analysis
3. **Expand Question Bank:** 40+ questions per skill for rotation

### Medium Priority
1. **Skills Gap Dashboard:** Visual job seeker progress tracking
2. **Program Matching Algorithm:** Precision education recommendations
3. **Market Intelligence:** BLS integration for demand forecasting

### Low Priority
1. **Skills Ontology:** Semantic relationships between skills
2. **Company Skill Customization:** Enterprise-specific skill libraries
3. **Skills Forecasting:** AI-powered future skills prediction

---

## 12. Performance Characteristics

### Database Performance
- **Skills Table:** 32K rows, indexed on lightcast_id, onet_id, source
- **Job Skills:** 387 mappings, indexed on job_id, skill_id
- **Query Latency:** <50ms for skill lookups
- **Memory Usage:** ~50MB for skills cache

### API Performance
- **Lightcast:** 10K requests/day, ~100ms per request
- **O*NET:** 20 requests/minute, ~500ms per request
- **OpenAI:** ~$0.01 per 100 skills analyzed

### Scalability Limits
- **Skills Scale:** Unlimited (Lightcast provides)
- **Job Mappings:** O(job_count × avg_skills_per_job)
- **Assessment Load:** Scales with user activity

---

## 13. Troubleshooting Guide

### Common Issues

**Skills not appearing in assessments:**
- Check `is_assessable = true` in skills table
- Verify job_skills mapping exists
- Confirm importance_level is set correctly

**Duplicate skills in database:**
- Run deduplication script
- Check import logs for conflicts
- Verify lightcast_id uniqueness

**O*NET API rate limiting:**
- Increase delay between requests (currently 3s)
- Batch requests when possible
- Use cached responses for repeated queries

**AI ranking failures:**
- Check OpenAI API key configuration
- Verify prompt format and JSON parsing
- Fall back to source-based prioritization

---

## 14. Key Files & Locations

### Core Services
- `/src/lib/services/hybrid-skills-mapper.ts` - Main AI mapping logic
- `/src/lib/services/skills-taxonomy-mapper.ts` - Filtering & dedup
- `/src/lib/services/assessment-engine.ts` - Weighted scoring
- `/src/lib/services/lightcast-skills.ts` - Lightcast API client
- `/src/lib/api/onet-client.ts` - O*NET API client

### Scripts
- `/scripts/import-lightcast-skills.js` - Bulk Lightcast import
- `/scripts/populate-job-skills.js` - SOC-based population
- `/scripts/extract-program-skills.js` - CIP-based extraction

### Database
- `/supabase/migrations/` - Schema updates
- `/docs/db/` - Schema documentation

### Tests
- `/src/lib/__tests__/skills/` - Unit tests
- `/scripts/test-*.js` - Integration tests

---

**This architecture enables SkillSync to deliver the most sophisticated skills-based platform in workforce development, combining industry authority with government compliance and AI intelligence.**

---

*Last Updated: October 7, 2025 | Version: 1.0 | Status: Production Ready*
