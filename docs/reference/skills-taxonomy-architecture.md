# Skills Taxonomy Architecture - Central Fabric

## Overview

Skills are the **primary fabric** connecting all entities in SkillSync. This document outlines the centralized taxonomy architecture that ensures programs, occupations, featured roles, quiz questions, and assessments all speak the same language.

---

## Core Principle: Skills as Currency

**Skills are the app currency** - everything flows through the skills taxonomy:

```
┌─────────────────────────────────────────────────────────────┐
│                    SKILLS (Central Hub)                      │
│  - O*NET/Lightcast hybrid taxonomy                          │
│  - 32,000+ specific skills                                   │
│  - Government validation + industry credibility              │
└─────────────────────────────────────────────────────────────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │   Jobs   │   │ Programs │   │  Quizzes │   │Assessments│
    │(Occupations)│ │(Education)│  │(Questions)│  │ (Results) │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

---

## Database Architecture

### 1. Skills Table (Central Hub)

```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  onet_id TEXT,                    -- O*NET skill ID
  lightcast_id TEXT,               -- Lightcast skill ID
  category TEXT,                   -- Skill category
  description TEXT,
  source TEXT DEFAULT 'ONET/LIGHTCAST',
  source_version TEXT
);
```

### 2. Junction Tables (Relationships)

#### Jobs ↔ Skills
```sql
CREATE TABLE job_skills (
  job_id UUID REFERENCES jobs(id),
  skill_id UUID REFERENCES skills(id),
  weight NUMERIC DEFAULT 1.0,      -- Importance/proficiency weight
  PRIMARY KEY (job_id, skill_id)
);
```

#### Programs ↔ Skills
```sql
CREATE TABLE program_skills (
  program_id UUID REFERENCES programs(id),
  skill_id UUID REFERENCES skills(id),
  weight NUMERIC DEFAULT 1.0,      -- Skill emphasis in curriculum
  PRIMARY KEY (program_id, skill_id)
);
```

#### Quiz Sections ↔ Skills
```sql
CREATE TABLE quiz_sections (
  id UUID PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id),
  skill_id UUID REFERENCES skills(id),  -- Each section tests a skill
  order_index INTEGER
);
```

#### Assessment Results ↔ Skills
```sql
CREATE TABLE assessment_skill_results (
  assessment_id UUID REFERENCES assessments(id),
  skill_id UUID REFERENCES skills(id),
  score_pct NUMERIC NOT NULL,      -- User's proficiency in this skill
  band skill_band NOT NULL,        -- developing/proficient/expert
  PRIMARY KEY (assessment_id, skill_id)
);
```

---

## Entity Alignment: Jobs ↔ Programs

### Jobs Table Structure
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  job_kind job_kind NOT NULL,           -- 'featured_role' or 'occupation'
  title TEXT NOT NULL,
  soc_code TEXT,
  company_id UUID,                      -- For featured roles
  category TEXT,
  location_city TEXT,
  location_state TEXT,
  median_wage_usd NUMERIC,
  long_desc TEXT,
  featured_image_url TEXT,
  skills_count INTEGER DEFAULT 0,       -- Cached count
  required_proficiency_pct NUMERIC,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Programs Table Structure (Aligned)
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY,
  school_id UUID,                       -- Education provider
  name TEXT NOT NULL,
  program_id TEXT UNIQUE,               -- External identifier
  program_type TEXT,                    -- Certificate, Bachelor's, etc.
  format TEXT,                          -- Online, Hybrid, On-campus
  duration_text TEXT,
  short_desc TEXT,
  long_desc TEXT,
  discipline TEXT,                      -- Business, Technology, etc.
  catalog_provider TEXT,                -- 'Direct', 'Bisk Amplified'
  program_url TEXT,
  program_guide_url TEXT,
  cip_code TEXT,                        -- CIP classification
  featured_image_url TEXT,              -- ✅ NEW: Hero image
  skills_count INTEGER DEFAULT 0,       -- ✅ NEW: Cached count
  is_featured BOOLEAN DEFAULT false,    -- ✅ NEW: Featured tab flag
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(), -- ✅ NEW: Timestamp
  updated_at TIMESTAMPTZ DEFAULT NOW()  -- ✅ NEW: Auto-updated
);
```

### Key Alignments

| Feature | Jobs Table | Programs Table | Purpose |
|---------|-----------|---------------|---------|
| **Featured Flag** | `is_featured` | `is_featured` | Controls Featured vs All tabs |
| **Hero Image** | `featured_image_url` | `featured_image_url` | Detail page visuals |
| **Skills Count** | `skills_count` | `skills_count` | Performance optimization |
| **Timestamps** | `created_at`, `updated_at` | `created_at`, `updated_at` | Audit trail |
| **Status** | `status` (draft/published/archived) | `status` (draft/published/archived) | Workflow control |
| **Skills Link** | `job_skills` junction | `program_skills` junction | Central taxonomy |

---

## Skills Flow: Upstream & Downstream

### Upstream (Data Ingestion)

1. **Occupations (SOC codes)** → O*NET API → Skills
2. **Featured Roles** → Company requirements + SOC baseline → Skills
3. **Programs (CIP codes)** → CIP-SOC crosswalk → O*NET → Skills
4. **HubSpot Programs** → Curriculum parsing → Skills extraction

### Downstream (User Experience)

1. **Job Seeker takes quiz** → Assessment results by skill
2. **Skills gaps identified** → Recommend programs teaching those skills
3. **Program completion** → Update user skill profile
4. **Job matching** → Compare user skills vs job requirements

---

## Three-Stakeholder Value Creation

### 1. Job Seekers (Learners)
- **Discover**: Browse jobs and see required skills
- **Assess**: Take quizzes to measure skill proficiency
- **Learn**: Find programs that teach missing skills
- **Match**: Get matched to jobs where skills align

### 2. Employers/Chambers (Companies)
- **Define**: Specify skills for featured roles
- **Filter**: Pre-qualify candidates by skill proficiency (90%+ threshold)
- **Analyze**: Regional workforce skill gap diagnostics
- **Partner**: Connect with education providers teaching needed skills

### 3. Education Providers (Schools)
- **Map**: Programs linked to in-demand skills
- **Visibility**: Featured programs teaching high-demand skills
- **Enrollment**: Job seekers discover programs via skill gaps
- **Partnerships**: Employer connections for program development

---

## UI Implementation: Featured vs All Tabs

### Jobs Page
- **Featured Roles Tab**: `WHERE job_kind = 'featured_role' AND is_featured = true`
- **High-Demand Occupations Tab**: `WHERE job_kind = 'occupation'`
- **Favorites Tab**: User's saved jobs

### Programs Page (Updated Logic)
- **Featured Programs Tab**: `WHERE is_featured = true AND status = 'published'`
- **All Programs Tab**: `WHERE status = 'published'` (includes featured + non-featured)
- **Favorites Tab**: User's saved programs

**Key Difference**: 
- Featured programs appear in **both** Featured and All tabs
- Non-featured programs appear **only** in All tab

---

## Skills Weighting System

### Weight Values (0.0 - 1.0)

| Weight | Meaning | Use Case |
|--------|---------|----------|
| **1.0** | Critical/Required | Core competency for role/program |
| **0.8** | Important | Significant but not essential |
| **0.6** | Helpful | Nice-to-have, adds value |
| **0.4** | Supplementary | Peripheral skill |
| **0.2** | Awareness | Basic familiarity sufficient |

### Application

**Jobs**: Weight = importance for role performance
**Programs**: Weight = emphasis in curriculum
**Quizzes**: Weight = question difficulty/importance
**Assessments**: Weight = skill impact on overall readiness

---

## Data Integrity & Automation

### Automatic Skills Count Updates

```sql
-- Trigger on job_skills table
CREATE TRIGGER trigger_update_job_skills_count
AFTER INSERT OR DELETE ON job_skills
FOR EACH ROW EXECUTE FUNCTION update_job_skills_count();

-- Trigger on program_skills table
CREATE TRIGGER trigger_update_program_skills_count
AFTER INSERT OR DELETE ON program_skills
FOR EACH ROW EXECUTE FUNCTION update_program_skills_count();
```

### Automatic Timestamp Updates

```sql
-- Trigger on jobs table
CREATE TRIGGER handle_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Trigger on programs table
CREATE TRIGGER handle_programs_updated_at
BEFORE UPDATE ON programs
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

---

## CIP → SOC → Skills Pipeline

### Flow Diagram
```
Programs (CIP codes) 
    ↓
CIP-SOC Crosswalk (O*NET)
    ↓
Occupations (SOC codes)
    ↓
O*NET Skills API
    ↓
Program Skills (program_skills table)
```

### Implementation
1. Tag programs with CIP codes (from IPEDS or HubSpot)
2. Use O*NET crosswalk to map CIP → SOC
3. Fetch skills for each SOC via O*NET API
4. Insert into `program_skills` with appropriate weights
5. Update `skills_count` automatically via trigger

---

## Query Examples

### Get Programs Teaching Specific Skill
```sql
SELECT p.*, s.name as skill_name, ps.weight
FROM programs p
JOIN program_skills ps ON p.id = ps.program_id
JOIN skills s ON ps.skill_id = s.id
WHERE s.name = 'Data Analysis'
  AND p.status = 'published'
ORDER BY ps.weight DESC;
```

### Get Skills Gap for Job Seeker
```sql
-- Required skills for job
WITH job_required_skills AS (
  SELECT skill_id, weight
  FROM job_skills
  WHERE job_id = 'target-job-uuid'
),
-- User's current skills
user_skills AS (
  SELECT skill_id, score_pct
  FROM assessment_skill_results
  WHERE assessment_id = 'user-assessment-uuid'
)
-- Skills gaps
SELECT 
  s.name,
  jrs.weight as required_weight,
  COALESCE(us.score_pct, 0) as current_proficiency,
  (jrs.weight * 100 - COALESCE(us.score_pct, 0)) as gap
FROM job_required_skills jrs
LEFT JOIN user_skills us ON jrs.skill_id = us.skill_id
JOIN skills s ON jrs.skill_id = s.id
WHERE COALESCE(us.score_pct, 0) < (jrs.weight * 100)
ORDER BY gap DESC;
```

### Recommend Programs for Skills Gaps
```sql
-- Programs teaching the skills user needs
SELECT 
  p.name,
  p.program_type,
  p.duration_text,
  COUNT(DISTINCT ps.skill_id) as matching_skills,
  AVG(ps.weight) as avg_skill_emphasis
FROM programs p
JOIN program_skills ps ON p.id = ps.program_id
WHERE ps.skill_id IN (
  -- Skills user needs to improve
  SELECT skill_id FROM user_skills_gaps
)
  AND p.status = 'published'
GROUP BY p.id
HAVING COUNT(DISTINCT ps.skill_id) >= 3  -- At least 3 matching skills
ORDER BY matching_skills DESC, avg_skill_emphasis DESC
LIMIT 10;
```

---

## Migration Checklist

- [x] Create `program_skills` junction table
- [x] Add `is_featured` to programs table
- [x] Add `featured_image_url` to programs table
- [x] Add `skills_count` to programs table
- [x] Add `created_at`, `updated_at` to programs table
- [x] Create trigger for automatic skills count updates
- [x] Create trigger for automatic timestamp updates
- [x] Create helper functions for featured programs
- [x] Create helper functions for programs with skills
- [ ] Populate program skills from CIP-SOC pipeline
- [ ] Set featured flags for curated programs
- [ ] Add featured images for featured programs

---

## Next Steps

1. **Execute alignment migration** (`20250930000002_align_programs_with_jobs.sql`)
2. **Implement CIP-SOC-Skills pipeline** (use staging data)
3. **Curate featured programs** (set `is_featured = true` for top programs)
4. **Add featured images** (upload hero images for featured programs)
5. **Update UI** (Featured Programs tab shows `is_featured = true`)
6. **Test skills matching** (job-to-program recommendations)

---

## Success Metrics

- ✅ Programs table structure matches jobs table
- ✅ Skills are central connecting fabric
- ✅ Featured/All tabs work consistently across jobs and programs
- ✅ Skills count auto-updates via triggers
- ✅ CIP-SOC-Skills pipeline functional
- ✅ Job-to-program recommendations based on skills
- ✅ Three-stakeholder value creation operational
