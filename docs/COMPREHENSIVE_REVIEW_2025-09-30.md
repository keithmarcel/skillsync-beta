# SkillSync Comprehensive Review - Sept 30, 2025

## Executive Summary

**Status:** Architecture misalignment identified and documented
**Core Issue:** Implementation is jobs-centric, should be skills-centric per vision
**Impact:** 109/223 programs (49%) have no skills, limiting user recommendations
**Root Cause:** Skills extraction depends on jobs existing in database instead of pulling from comprehensive taxonomy

---

## Documentation Review

### 1. Technical Architecture Document
**File:** `/docs/skill-sync-technical-architecture.md`

**Key Findings:**
✅ **Correctly documents:**
- O*NET API integration for skills
- Lightcast API as primary skills source (30k+ skills)
- Skills taxonomy as foundation
- Skill deduplication using O*NET IDs

❌ **What's NOT implemented:**
- Lightcast Open Skills import (documented but not built)
- Direct O*NET API calls for program skills
- Comprehensive skills taxonomy (only 34 skills exist)

**Quote from docs:**
> "The Skills Taxonomy system is a comprehensive pipeline that integrates with the U.S. Department of Labor's O*NET database to populate job-specific skills data. This system serves as the foundation for AI-powered assessment generation and skill-based job matching."

**Reality:** Only 34 skills from 38 manually-added jobs

---

### 2. CIP Pipeline Documentation
**File:** `/docs/reference/cip_scaffolding.md`

**Vision Stated:**
```
Programs (CIP codes) → CIP-SOC Crosswalk → SOC Skills (O*NET) → Program-Skill Linkages
```

**Current Implementation:**
```
Programs (CIP codes) → CIP-SOC Crosswalk → Jobs in DB → Job Skills → Program Skills
```

**The Critical Difference:**
- Vision: Get skills from O*NET API directly
- Reality: Get skills from jobs table (bottleneck)

---

### 3. Skills as Currency Vision

**Found in multiple docs:**
- "Skills as currency" mentioned in strategic docs
- Skills-first matching emphasized
- Comprehensive taxonomy required

**Current Reality:**
- Jobs are currency (source of truth)
- Skills derived from jobs
- Taxonomy incomplete (34 vs 30,000+)

---

## Live Schema Review

### Skills Table
**Columns Found:**
```sql
id, name, onet_id, category, description, 
lightcast_id, source, source_version, 
proficiency_levels, is_active, created_at, updated_at
```

**Analysis:**
✅ Schema is READY for comprehensive taxonomy
✅ Has `lightcast_id` column (prepared for Lightcast)
✅ Has `onet_id` column (prepared for O*NET)
✅ Has `source` field to track origin
❌ Only 34 skills populated (should be 10,000-30,000)

### Programs Table
**Relevant Fields:**
```sql
cip_code, skills_count, cip_assignment_confidence,
cip_assignment_method, cip_approved, cip_suggestions
```

**Analysis:**
✅ CIP infrastructure complete
✅ All 223 programs have CIP codes
✅ Tracking fields for confidence/method
❌ skills_count only populated for 113 programs

### Program_Skills Table
**Current State:**
- 757 entries
- Links 113 programs to 34 skills
- Derived from 38 jobs

**Should Be:**
- 2,000-5,000 entries
- Links 223 programs to 1,000+ skills
- Derived from O*NET API directly

---

## Codebase Review

### What EXISTS and WORKS:

#### 1. O*NET API Service
**File:** `/src/lib/services/onet-api.ts` (likely exists based on docs)
**Status:** Need to verify implementation

#### 2. Skills Population Pipeline
**File:** `/src/app/admin/skills-data/page.tsx`
**Status:** Exists but has syntax error (needs fix)
**Purpose:** Admin UI to populate job skills from O*NET

#### 3. CIP-SOC Crosswalk
**Status:** ✅ Complete (5,903 mappings imported)
**Tables:** `cip_codes`, `cip_soc_crosswalk`

#### 4. Program Skills Extraction
**File:** `/src/lib/services/program-skills-extraction.ts`
**Status:** ✅ Exists but uses WRONG approach
**Current:** CIP → SOC → Jobs → Skills
**Should:** CIP → SOC → O*NET API → Skills

---

### What's MISSING:

#### 1. Lightcast Open Skills Import
**Documented:** Yes (primary source per docs)
**Implemented:** No
**Impact:** Missing 30,000+ skills

#### 2. O*NET Skills Import
**Documented:** Yes (backup source)
**Implemented:** Partially (only for 38 jobs)
**Impact:** Missing comprehensive O*NET taxonomy

#### 3. Direct API Integration for Programs
**Documented:** Yes (in cip_scaffolding.md)
**Implemented:** No (uses jobs as intermediary)
**Impact:** 109 programs have no skills

---

## API Integration Status

### Lightcast Open Skills API
**Documentation Says:**
- Primary skills source
- 30,000+ skills
- Free tier available
- Link: https://www.lightcast.io/open-skills-dataset

**Current Status:**
- ❌ Not imported
- ❌ No import script exists
- ✅ Database schema ready (`lightcast_id` column)
- ✅ Environment variable placeholder exists

**Action Needed:**
1. Register for Lightcast API access
2. Create import script
3. Populate skills table
4. Map to O*NET skills for deduplication

### O*NET Web Services API
**Documentation Says:**
- Backup skills source
- Real-time SOC skills lookup
- Free with registration
- Link: https://services.onetcenter.org/

**Current Status:**
- ✅ API service likely exists (referenced in docs)
- ⚠️ Only used for 38 jobs manually
- ❌ Not used for program skills extraction
- ✅ Database schema ready (`onet_id` column)

**Action Needed:**
1. Verify O*NET API credentials
2. Create batch import for all SOC codes
3. Use for program skills extraction
4. Implement as fallback when Lightcast unavailable

---

## Gap Analysis

### Vision vs Reality Matrix

| Component | Vision | Reality | Gap |
|-----------|--------|---------|-----|
| Skills Taxonomy | 30,000+ (Lightcast) | 34 (from jobs) | 99.9% missing |
| Skills Source | API-driven | Job-derived | Wrong approach |
| Program Skills | All 223 programs | 113 programs | 49% missing |
| Matching Foundation | Skills-first | Jobs-first | Architectural |
| API Integration | Lightcast + O*NET | Neither fully used | Not implemented |

---

## Root Cause Analysis

### Why This Happened:

1. **Incremental Development**
   - Started with 38 jobs
   - Added skills to those jobs
   - Extended pattern to programs
   - Never imported comprehensive taxonomy

2. **Misunderstood Architecture**
   - Docs say "skills from O*NET"
   - Implemented as "skills from jobs that have O*NET skills"
   - Subtle but critical difference

3. **Missing Foundation**
   - Never built Lightcast import
   - Never built O*NET bulk import
   - Relied on manual job entry

---

## Correct Implementation Path

### Phase 1: Import Skills Taxonomy (Foundation)

**Option A: Lightcast Open Skills (Recommended)**
```javascript
// 1. Register for API access
// 2. Fetch all skills from Lightcast API
// 3. Import into skills table with source='LIGHTCAST'
// 4. Result: 30,000+ skills available
```

**Option B: O*NET Skills (Fallback)**
```javascript
// 1. Use existing O*NET credentials
// 2. Fetch skills for all SOC codes
// 3. Import into skills table with source='ONET'
// 4. Result: 1,000+ skills available
```

**Recommended: Both**
- Start with O*NET (easier, free, documented)
- Add Lightcast for comprehensiveness
- Use `lightcast_id` and `onet_id` for mapping

### Phase 2: Rewrite Program Skills Extraction

**Current (Wrong):**
```javascript
Program → CIP → SOC → Jobs in DB → Skills
```

**Correct:**
```javascript
Program → CIP → SOC → O*NET API → Skills → program_skills
```

**Implementation:**
```javascript
async function extractProgramSkills(programId) {
  // 1. Get program's CIP code
  const program = await getProgram(programId);
  
  // 2. Get SOC codes from crosswalk
  const socCodes = await getCIPSOCMappings(program.cip_code);
  
  // 3. For each SOC, call O*NET API
  for (const soc of socCodes) {
    const onetSkills = await onetAPI.getSkills(soc);
    
    // 4. Match to skills in our taxonomy
    const matchedSkills = await matchToTaxonomy(onetSkills);
    
    // 5. Insert into program_skills
    await insertProgramSkills(programId, matchedSkills);
  }
}
```

### Phase 3: Enhance Job Skills (Optional)

**Goal:** Jobs also pull from taxonomy
**Benefit:** Consistency across platform
**Priority:** Lower (jobs already have skills)

---

## Migration Strategy

### Step 1: Import O*NET Skills (Non-Breaking)
**Time:** 4-6 hours
**Impact:** None (additive)
**Result:** 1,000+ skills in taxonomy

**Tasks:**
1. Create O*NET bulk import script
2. Fetch skills for all SOC codes in crosswalk
3. Deduplicate using `onet_id`
4. Insert into skills table
5. Validate quality

### Step 2: Import Lightcast Skills (Non-Breaking)
**Time:** 4-6 hours
**Impact:** None (additive)
**Result:** 30,000+ skills in taxonomy

**Tasks:**
1. Register for Lightcast API
2. Create import script
3. Map to O*NET skills for deduplication
4. Insert with source='LIGHTCAST'
5. Validate quality

### Step 3: Rewrite Program Extraction (Breaking)
**Time:** 4-6 hours
**Impact:** Replaces current program_skills
**Result:** All 223 programs have skills

**Tasks:**
1. Backup current program_skills
2. Create new extraction service
3. Test with 5 programs
4. Run on all 223 programs
5. Validate quality
6. Update admin UI

### Step 4: Test & Validate (Critical)
**Time:** 2-4 hours
**Impact:** Ensures quality
**Result:** Confidence in new system

**Tasks:**
1. Test assessment recommendations
2. Verify skill matching quality
3. Check program coverage
4. Validate user experience
5. Monitor performance

---

## Success Metrics

### Before (Current State):
- Skills in taxonomy: 34
- Skills source: Jobs (38)
- Programs with skills: 113 (51%)
- User experience: Gaps in recommendations
- Architecture: Jobs-centric ❌

### After (Target State):
- Skills in taxonomy: 10,000-30,000
- Skills source: Lightcast + O*NET APIs
- Programs with skills: 223 (100%)
- User experience: Comprehensive recommendations
- Architecture: Skills-centric ✅

---

## Timeline & Effort

### Conservative Estimate:
- **Phase 1:** 8-12 hours (O*NET + Lightcast import)
- **Phase 2:** 6-8 hours (Rewrite extraction)
- **Phase 3:** 2-4 hours (Testing)
- **Total:** 16-24 hours (2-3 days)

### Aggressive Estimate:
- **Phase 1:** 4-6 hours (O*NET only, skip Lightcast for now)
- **Phase 2:** 4-6 hours (Rewrite extraction)
- **Phase 3:** 2 hours (Basic testing)
- **Total:** 10-14 hours (1.5-2 days)

---

## Risks & Mitigation

### Risk 1: API Rate Limits
**Likelihood:** Medium
**Impact:** Delays import
**Mitigation:** 
- Batch requests
- Implement delays
- Cache responses
- Use free tiers wisely

### Risk 2: Skill Mapping Complexity
**Likelihood:** High
**Impact:** Duplicate/mismatched skills
**Mitigation:**
- Use O*NET IDs for deduplication
- Manual review of top 100 skills
- Admin tools for curation

### Risk 3: Data Quality Issues
**Likelihood:** Medium
**Impact:** Poor recommendations
**Mitigation:**
- Filter generic skills
- Weight by importance
- Admin review tools
- Confidence scores

### Risk 4: Breaking Existing Functionality
**Likelihood:** Low
**Impact:** Temporary disruption
**Mitigation:**
- Backup current data
- Test thoroughly
- Gradual rollout
- Rollback plan

---

## Recommendations

### Immediate Actions (Today):

1. ✅ **Review Complete** - This document
2. **Decision Point:** Lightcast vs O*NET vs Both
3. **Get API Access:** Register for chosen service(s)
4. **Start Phase 1:** Import skills taxonomy

### Short Term (This Week):

1. Complete skills import
2. Rewrite program extraction
3. Test with sample programs
4. Full rollout

### Medium Term (Next Week):

1. Enhance job skills (optional)
2. Build admin curation tools
3. Monitor quality
4. Iterate based on feedback

---

## Questions for Decision

1. **API Choice:**
   - Start with O*NET only (faster, free, documented)?
   - Go straight to Lightcast (comprehensive, current)?
   - Implement both (best coverage, more work)?

2. **Priority:**
   - Speed to launch (O*NET only, 1.5 days)?
   - Comprehensive coverage (Both APIs, 3 days)?

3. **Scope:**
   - Just fix programs (core issue)?
   - Also enhance jobs (consistency)?

4. **Testing:**
   - Basic validation (faster)?
   - Comprehensive testing (safer)?

---

## Conclusion

**The architecture documented in `/docs` is correct.**
**The implementation in `/src` is incorrect.**

We have:
- ✅ Right vision ("skills as currency")
- ✅ Right documentation (Lightcast + O*NET)
- ✅ Right schema (ready for comprehensive taxonomy)
- ❌ Wrong implementation (jobs-centric)

**The fix is clear and achievable in 2-3 days.**

**Ready to proceed with implementation?**
