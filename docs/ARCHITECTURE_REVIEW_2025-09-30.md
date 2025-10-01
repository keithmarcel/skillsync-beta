# SkillSync Architecture Review - Sept 30, 2025

## Critical Finding: Architecture Misalignment

**Vision:** Skills-first, skills as currency
**Current Implementation:** Jobs-first, skills derived from jobs

---

## Current State Analysis

### What We Have:
- ✅ 223 programs with CIP codes
- ✅ 5,903 CIP-SOC crosswalk mappings
- ⚠️ **34 skills** (should be 30,000+)
- ⚠️ 38 jobs with skills
- ⚠️ 113 programs with skills (derived from jobs)
- ⚠️ Skills extraction depends on jobs existing

### The Problem:
**Programs can only get skills if matching jobs exist in our database.**

Example:
- Psychology program → CIP 42.0101 → SOC codes for Psychologists
- No Psychologist jobs in DB → No skills extracted
- Result: Program invisible to users with psychology skill gaps

---

## Vision vs Reality

### Your Vision (Skills as Currency):

```
┌─────────────────────────────────────┐
│   Lightcast 30k+ Skills Taxonomy    │  ← Source of Truth
│         (+ O*NET backup)            │
└─────────────────────────────────────┘
           ↓              ↓
    ┌──────────┐    ┌──────────┐
    │ Programs │    │   Jobs   │
    │          │    │          │
    │ CIP→SOC  │    │ SOC→API  │
    │ →Skills  │    │ →Skills  │
    └──────────┘    └──────────┘
           ↓              ↓
    ┌─────────────────────────┐
    │   Skills Matching       │
    │   User Gaps → Programs  │
    └─────────────────────────┘
```

### Current Reality (Jobs as Foundation):

```
┌──────────────┐
│   38 Jobs    │  ← Source of Truth (WRONG!)
│  (34 skills) │
└──────────────┘
       ↓
┌──────────────┐
│   Programs   │  ← Can only get skills from jobs
│ (113 have    │     that exist in DB
│  skills)     │
└──────────────┘
       ↓
┌──────────────┐
│   Matching   │  ← Limited by job availability
└──────────────┘
```

---

## What Needs to Change

### 1. Import Comprehensive Skills Taxonomy

**Current:** 34 skills from 38 jobs
**Target:** 30,000+ Lightcast Open Skills OR 1,000+ O*NET skills

**Implementation:**
- Use Lightcast Open Skills API (free, current, comprehensive)
- Fallback to O*NET skills API
- Populate `skills` table with full taxonomy
- Tag source: 'LIGHTCAST', 'ONET', 'CUSTOM'

**Why Lightcast over O*NET:**
- More current (O*NET is dated)
- Better granularity
- Less repetition of soft skills
- Stronger pool for matching
- Already recommended and confirmed earlier

### 2. Decouple Program Skills from Jobs

**Current Flow:**
```
Program → CIP → SOC → Jobs in DB → Skills
```

**Correct Flow:**
```
Program → CIP → SOC → O*NET/Lightcast API → Skills
```

**Implementation:**
- Rewrite `extract-program-skills.js`
- For each program's SOC codes, call O*NET API
- Map O*NET skills to our taxonomy
- Insert into `program_skills`
- Result: ALL 223 programs get skills

### 3. Decouple Job Skills from Manual Entry

**Current:** Jobs manually added with skills
**Target:** Jobs pull skills from taxonomy via SOC code

**Implementation:**
- When adding job, provide SOC code
- Auto-populate skills from O*NET/Lightcast
- Admin can curate/adjust
- Consistent with programs approach

---

## Recommended Implementation Plan

### Phase 1: Skills Taxonomy (Priority 1)

**Goal:** Import comprehensive skills vocabulary

**Tasks:**
1. Research Lightcast Open Skills API access
2. Create import script for Lightcast skills
3. Populate `skills` table (target: 10,000-30,000 skills)
4. Add skill categories, descriptions
5. Create skill search/browse in admin

**Outcome:** Foundation for all matching

### Phase 2: Program Skills Extraction (Priority 1)

**Goal:** All programs get skills from taxonomy

**Tasks:**
1. Create O*NET API client
2. Rewrite program skills extraction:
   - Get CIP → SOC mappings
   - Call O*NET for each SOC
   - Map to skills taxonomy
   - Rank by importance
   - Insert top 10-15 skills per program
3. Run on all 223 programs
4. Validate quality

**Outcome:** Every program has skills, independent of jobs

### Phase 3: Job Skills Enhancement (Priority 2)

**Goal:** Jobs auto-populate skills from taxonomy

**Tasks:**
1. Add SOC code field to job creation form
2. Auto-fetch skills from O*NET when SOC provided
3. Allow manual curation
4. Backfill existing 38 jobs

**Outcome:** Consistent skills across jobs and programs

### Phase 4: Enhanced Matching (Priority 2)

**Goal:** Skills-based matching works comprehensively

**Tasks:**
1. User assessment → Skill gaps
2. Match gaps to programs (via program_skills)
3. Match gaps to jobs (via job_skills)
4. Fuzzy matching based on skill similarity
5. Confidence scores

**Outcome:** User-centered matching that works

---

## Data Sources & APIs

### Lightcast Open Skills
- **URL:** https://skills.emsidata.com/
- **Access:** Free tier available
- **Coverage:** 30,000+ skills
- **Format:** JSON API
- **Benefits:** Current, comprehensive, industry-standard

### O*NET Web Services
- **URL:** https://services.onetcenter.org/
- **Access:** Free with registration
- **Coverage:** 1,000+ skills per occupation
- **Format:** XML/JSON
- **Benefits:** Government-maintained, reliable

### CIP-SOC Crosswalk
- **Source:** NCES
- **Status:** ✅ Already imported (5,903 mappings)
- **Use:** Map programs to occupations

---

## Database Schema Changes Needed

### Skills Table Enhancement
```sql
ALTER TABLE skills ADD COLUMN IF NOT EXISTS:
- category VARCHAR (e.g., 'Technical', 'Soft', 'Domain')
- subcategory VARCHAR
- description TEXT
- lightcast_id VARCHAR (external reference)
- onet_element_id VARCHAR (external reference)
- proficiency_levels JSONB (beginner, intermediate, advanced)
```

### Program Skills Enhancement
```sql
-- Already good, but add:
ALTER TABLE program_skills ADD COLUMN:
- importance_score NUMERIC (from O*NET)
- extraction_method VARCHAR ('onet_api', 'lightcast_api', 'manual')
- last_updated TIMESTAMP
```

### Job Skills Enhancement
```sql
-- Already has onet_data_source
-- Add extraction tracking
ALTER TABLE job_skills ADD COLUMN:
- extraction_method VARCHAR
- last_synced TIMESTAMP
```

---

## Migration Strategy

### Step 1: Import Skills (Non-Breaking)
- Add new skills to taxonomy
- Doesn't affect existing functionality
- Can run in background

### Step 2: Re-extract Program Skills (Additive)
- Delete existing program_skills
- Re-extract using new method
- Programs go from 113 → 223 with skills
- Improves user experience

### Step 3: Enhance Job Skills (Optional)
- Backfill existing jobs
- New jobs auto-populate
- Gradual improvement

---

## Success Metrics

### Before (Current):
- Skills in taxonomy: 34
- Programs with skills: 113 (51%)
- Skill coverage: Limited to jobs in DB
- User experience: Gaps in recommendations

### After (Target):
- Skills in taxonomy: 10,000-30,000
- Programs with skills: 223 (100%)
- Skill coverage: Comprehensive
- User experience: Every gap → Relevant programs

---

## Timeline Estimate

### Phase 1: Skills Taxonomy
- Research & API setup: 2 hours
- Import script: 4 hours
- Testing & validation: 2 hours
- **Total: 1 day**

### Phase 2: Program Skills
- O*NET API client: 2 hours
- Rewrite extraction: 4 hours
- Run & validate: 2 hours
- **Total: 1 day**

### Phase 3: Job Skills
- UI updates: 2 hours
- Auto-population: 2 hours
- Backfill: 1 hour
- **Total: 0.5 days**

### Phase 4: Enhanced Matching
- Already mostly built
- Testing & refinement: 2 hours
- **Total: 0.25 days**

**Total Estimated Time: 2.75 days**

---

## Risks & Mitigation

### Risk 1: API Rate Limits
- **Mitigation:** Cache responses, batch requests, use free tiers wisely

### Risk 2: Skill Mapping Complexity
- **Mitigation:** Start with O*NET (simpler), add Lightcast later

### Risk 3: Data Quality
- **Mitigation:** Admin review tools, confidence scores, manual curation

### Risk 4: Breaking Changes
- **Mitigation:** Additive approach, keep existing data, gradual migration

---

## Immediate Next Steps

1. **Review this document** - Confirm approach
2. **Choose skills source** - Lightcast vs O*NET vs both
3. **Start Phase 1** - Import skills taxonomy
4. **Rewrite extraction** - Programs get skills from API
5. **Test & validate** - Ensure quality

---

## Questions to Answer

1. Do we have Lightcast API access? If not, can we get it?
2. Should we start with O*NET (easier) or go straight to Lightcast?
3. What's the priority: Speed to launch vs comprehensive coverage?
4. Should we keep the 34 existing skills or start fresh?

---

## Conclusion

**The architecture needs correction to match the "skills as currency" vision.**

Current implementation is jobs-centric. We need to shift to skills-centric:
- Skills taxonomy as foundation
- Programs and jobs both derive from taxonomy
- Matching based on skills, not job availability

This is fixable and will dramatically improve user experience.

**Ready to implement the correct architecture?**
