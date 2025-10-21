# Crosswalk Implementation Plan - Phase 4A

**Status:** ✅ COMPLETE (Core Feature) | 🔄 In Progress (Enhancements)  
**Branch:** `feature/crosswalk-implementation`  
**Created:** October 20, 2025 6:12 PM  
**Last Updated:** October 20, 2025 9:56 PM

---

## Executive Summary

Implement crosswalk queries to connect High-Demand Occupations (HDOs), Featured Roles, and Programs through SOC codes and shared skills. UI structure already exists - need to populate with real data.

**Current State:**
- ✅ UI columns exist (Open Roles, Programs)
- ✅ UI sections exist (empty states)
- ❌ No data queries (shows 0 counts)

**Goal:** Populate crosswalk UI with accurate counts and data.

---

## Database Schema (Source of Truth)

**Verified from Remote Supabase Database:** October 20, 2025 6:12 PM

### Tables & Relationships

#### 1. Jobs Table
```
Total Records: 40
- Occupations (HDOs): 30 (job_kind = 'occupation')
- Featured Roles: 10 (job_kind = 'featured_role')

Key Fields:
- id (UUID)
- job_kind (ENUM: 'occupation' | 'featured_role')
- soc_code (TEXT) - SOC classification code
- title (TEXT)
- company_id (UUID) - For featured roles
- skills_count (INTEGER)
```

#### 2. Programs Table
```
Total Records: 222

Key Fields:
- id (UUID)
- name (TEXT)
- cip_code (TEXT) - CIP classification code
- school_id (UUID)
- program_type (TEXT)
- skills_count (INTEGER)
```

#### 3. Skills Table
```
Total Records: 35,041

Key Fields:
- id (UUID)
- name (TEXT)
- source (TEXT) - 'LIGHTCAST' | 'ONET'
- onet_id (TEXT)
- lightcast_id (TEXT)
- category (TEXT)
```

#### 4. job_skills Junction Table
```
Total Records: 105

Schema:
- id (UUID)
- job_id (UUID) → jobs.id
- skill_id (UUID) → skills.id
- importance_level (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 5. program_skills Junction Table
```
Total Records: 1,843

Schema:
- program_id (UUID) → programs.id
- skill_id (UUID) → skills.id
- weight (NUMERIC)
- coverage_level (TEXT)
- created_at (TIMESTAMP)
```

---

## Crosswalk Logic

### 1. HDO → Featured Roles (SOC Code Match)

**Query Logic:**
```sql
-- Count Featured Roles with matching SOC code
SELECT COUNT(*) 
FROM jobs 
WHERE job_kind = 'featured_role' 
  AND soc_code = [HDO.soc_code]
  AND is_published = true
```

**Current Data:**
- Sample HDO: "Software Developers" (SOC: 15-1252.00)
- Related Featured Roles: 0 (no Featured Roles with matching SOC yet)

**Action Needed:** Ensure Featured Roles have SOC codes assigned

### 2. HDO → Programs (Skill Overlap)

**Query Logic:**
```sql
-- Find programs that teach skills required by HDO
SELECT DISTINCT p.id, p.name, COUNT(DISTINCT ps.skill_id) as shared_skills_count
FROM programs p
INNER JOIN program_skills ps ON p.id = ps.program_id
WHERE ps.skill_id IN (
  SELECT skill_id 
  FROM job_skills 
  WHERE job_id = [HDO.id]
)
GROUP BY p.id, p.name
HAVING COUNT(DISTINCT ps.skill_id) >= [THRESHOLD]
ORDER BY shared_skills_count DESC
```

**Threshold Options:**
- Minimum 1 shared skill (broad matching)
- Minimum 3 shared skills (moderate matching)
- Minimum 5 shared skills (strict matching)

**Current Data:**
- job_skills: 105 relationships
- program_skills: 1,843 relationships
- Potential for crosswalk exists

### 3. Featured Role → HDOs (Reverse SOC Match)

**Query Logic:**
```sql
-- Find HDOs with matching SOC code
SELECT * 
FROM jobs 
WHERE job_kind = 'occupation' 
  AND soc_code = [FeaturedRole.soc_code]
```

### 4. Featured Role → Programs (Skill Overlap)

**Same logic as HDO → Programs** (uses job_skills junction)

### 5. Featured Role → Similar Roles (SOC Match)

**Query Logic:**
```sql
-- Find other Featured Roles with same SOC code
SELECT * 
FROM jobs 
WHERE job_kind = 'featured_role' 
  AND soc_code = [FeaturedRole.soc_code]
  AND id != [FeaturedRole.id]
  AND is_published = true
```

---

## Implementation Tasks

### Phase 0: SOC-Based Skills for HDOs (PREREQUISITE)

**Critical Discovery:** HDOs have 0 skills because SOC-based lookup not implemented

**Database Structure Verified:**
- ✅ `soc_skills` junction table exists (soc_code, skill_id, weight, display_order)
- ✅ `skills` table has O*NET skills with onet_id
- ✅ Featured Roles use `job_skills` junction (role-specific)
- ❌ HDOs need to query `soc_skills` junction by SOC code

**From Technical Architecture Doc (Line 1871-1874):**
> "Occupations use `soc_skills` table but job details expected `job_skills` structure.
> Solution: Updated `getJobById` to handle both featured roles (`job_skills`) and 
> occupations (`soc_skills`) via SOC code lookup."

**From HDO Pivot Plan (Line 244-248):**
> "Skills Inheritance: Query checks `soc_skills` FIRST, then `job_skills`.
> Featured Roles automatically inherit curated SOC skills.
> Employers can add custom skills via `job_skills`."

**✅ STATUS VERIFIED:** `getJobById` ALREADY IMPLEMENTS THIS!

**Code Found in `/src/lib/database/queries.ts` (Lines 430-446):**
```typescript
// Check for curated skills ONLY for high-demand occupations (not featured roles)
// Featured roles use job_skills (role-specific), occupations use soc_skills (SOC-based)
if (data?.soc_code && data?.job_kind === 'occupation') {
  const { data: curatedSkills, error: curatedError } = await supabase
    .from('soc_skills')
    .select(`
      weight,
      skills!soc_skills_skill_id_fkey(*)
    `)
    .eq('soc_code', data.soc_code)
    .order('weight', { ascending: false })

  // Use curated skills if they exist
  if (!curatedError && curatedSkills && curatedSkills.length > 0) {
    data.skills = curatedSkills
  }
}
```

**✅ Architecture Already Correct:**
- ✅ Featured Roles: Query `job_skills` junction (lines 409-412)
- ✅ Occupations: Query `soc_skills` by SOC code (lines 432-446)
- ✅ No cross-contamination between architectures

**✅ PHASE 0 COMPLETE - DATA VERIFIED!**

**soc_skills Table Status (Verified October 20, 2025 6:19 PM):**
- ✅ 460 records in soc_skills table
- ✅ HDOs have skills mapped:
  - General and Operations Managers (11-1021.00): 10 skills
  - Financial Managers (11-3031.00): 15 skills
  - Medical and Health Services Managers (11-9111.00): 9 skills
  - Property Managers (11-9141.00): 11 skills
  - Managers, All Other (11-9199.00): 7 skills

**✅ Architecture Working:**
- Code implements SOC-based lookup for occupations
- Data exists in soc_skills table
- SOC codes match between tables

**Why HDO table shows "0 skills":**
- Table query (`getHighDemandOccupations()`) doesn't include skills
- Only detail page (`getJobById()`) fetches skills
- This is by design - table doesn't need to show skills, just counts

**Conclusion:** Phase 0 is COMPLETE. Ready to implement crosswalk queries!

---

### Phase 1: Count Queries (Day 1)

**File:** `/src/lib/database/queries.ts`

- [ ] Add `getOccupationCrosswalkCounts(soc_code)` function
  - Returns: `{ related_jobs_count, related_programs_count }`
- [ ] Modify `getHighDemandOccupations()` to include counts
  - Add subqueries for counts
  - Test performance with 30 occupations
- [ ] Add `getFeaturedRoleCrosswalkCounts(soc_code, job_id)` function
  - Returns: `{ related_occupations_count, similar_roles_count, related_programs_count }`

### Phase 2: Detail Page Queries (Day 1-2)

**File:** `/src/lib/database/queries.ts`

- [ ] Add `getRelatedFeaturedRoles(soc_code, limit)` function
  - Returns Featured Roles with matching SOC
- [ ] Add `getRelatedPrograms(skill_ids, limit)` function
  - Returns Programs with skill overlap
  - Includes shared_skills_count
- [ ] Add `getRelatedOccupations(soc_code)` function
  - Returns HDOs with matching SOC
- [ ] Add `getSimilarRoles(soc_code, exclude_id, limit)` function
  - Returns other Featured Roles with same SOC

### Phase 3: UI Integration (Day 2)

**Files:**
- `/src/app/(main)/jobs/page.tsx` - HDO table
- `/src/app/(main)/jobs/[id]/page.tsx` - Detail pages

- [ ] Update HDO table data fetching to include counts
- [ ] Update HDO detail page to fetch related data
- [ ] Update Featured Role detail page to fetch related data
- [ ] Remove empty state placeholders
- [ ] Test with real data

### Phase 4: Sample Data Pool (Day 3)

- [ ] Select 3-5 occupations with existing skills
- [ ] Assign SOC codes to Featured Roles (if missing)
- [ ] Verify skill relationships exist
- [ ] Test crosswalk accuracy
- [ ] Document any data quality issues

---

## Data Quality Considerations

### Current State (Verified October 20, 2025 6:18 PM):

**✅ Featured Roles:**
- All 10 Featured Roles have SOC codes assigned
- Average: 10.5 skills per role (good coverage)
- Skills stored in `job_skills` junction table (role-specific)
- Example: "Business Development Manager" has 18 skills

**❌ High-Demand Occupations (HDOs):**
- 30 Occupations have 0 skills assigned
- Should use SOC-based skills from `skills` table
- **BLOCKER:** Need to populate HDO skills before crosswalk works

**✅ Crosswalk Potential Exists:**
- Example: 3 Mechanical Project Manager roles share SOC 11-9021.00
- Can crosswalk between these roles once HDO skills populated

### Critical Gap Identified:

**HDOs use SOC-based skills architecture:**
- HDOs should read skills directly from `skills` table filtered by SOC
- Featured Roles use `job_skills` junction table (customizable)
- HDOs currently have 0 skills because SOC-based lookup not implemented
- Need to implement SOC-based skills query for HDOs

### Skills Architecture (from SKILLS_ARCHITECTURE_CHANGE.md):

**High-Demand Occupations:**
- Read-only baseline from `skills` table
- Filtered by SOC code
- Maintains government data integrity
- Cannot be customized

**Featured Roles:**
- Role-specific from `job_skills` junction
- Fully customizable per role
- Allows seniority differentiation
- No cross-contamination

### Recommendations:

1. **CRITICAL - Before implementing crosswalk queries:**
   - ✅ Featured Roles already have SOC codes and skills (10.5 avg)
   - ❌ HDOs need SOC-based skills implementation
   - ❌ Need to verify `skills` table has SOC code field
   - ❌ Need to implement SOC-based skills lookup for HDOs
   - ❌ Programs have 1,843 skill relationships but 0 overlap with current jobs

2. **Sample Data Pool Strategy:**
   - Select occupations with matching Featured Role SOC codes:
     - SOC 11-9021.00: 3 Mechanical Project Manager roles (Assistant, Mid, Senior)
     - SOC 11-2022.00: Business Development Manager (18 skills)
     - SOC 13-2051.00: Senior Financial Analyst
   - Ensure these HDOs get SOC-based skills populated
   - Test crosswalk between HDO → Featured Roles (SOC match)
   - Test crosswalk between Jobs → Programs (skill overlap)

3. **Implementation Priority:**
   - Phase 0: Implement SOC-based skills for HDOs (prerequisite)
   - Phase 1: SOC-based crosswalk (HDO ↔ Featured Roles)
   - Phase 2: Skill-based crosswalk (Jobs ↔ Programs)
   - Phase 3: UI integration and testing

---

## Testing Strategy

### Sample Data Pool:

**Select 3-5 occupations with:**
1. Known SOC codes
2. Existing skills in job_skills
3. Featured Roles with matching SOC (or create them)
4. Programs with overlapping skills

**Example Candidates:**
- Software Developers (15-1252.00)
- Project Managers (11-9141.00)
- Accountants (13-2011.00)

### Test Cases:

1. **HDO Table:**
   - Verify counts display correctly
   - Verify badges are clickable
   - Verify navigation to detail page

2. **HDO Detail Page:**
   - Verify Featured Roles section populates
   - Verify Programs section populates
   - Verify empty states when no matches

3. **Featured Role Detail Page:**
   - Verify Related Occupations section
   - Verify Similar Roles section
   - Verify Programs section

---

## Performance Considerations

### Query Optimization:

1. **Indexes Needed:**
   - `jobs(soc_code)` - For SOC matching
   - `job_skills(job_id, skill_id)` - For skill lookups
   - `program_skills(skill_id)` - For reverse skill lookups

2. **Caching Strategy:**
   - Cache crosswalk counts (update on data change)
   - Consider materialized views for complex queries
   - Evaluate need for Phase 4B caching sprint

3. **Query Limits:**
   - Limit detail page results (e.g., 6-12 items)
   - Implement "Load More" for large result sets
   - Use pagination for performance

---

## Success Criteria

- [ ] HDO table shows accurate counts (not 0)
- [ ] Counts match actual related records
- [ ] Detail pages show relevant related content
- [ ] Performance: Queries complete in <500ms
- [ ] Empty states handled gracefully
- [ ] Sample data pool validates accuracy

---

---

## ✅ IMPLEMENTATION COMPLETE (October 20, 2025 9:56 PM)

### Core Features Delivered

**Phase 0: SOC-Based Skills** ✅
- HDOs use `soc_skills` table (read-only, government data)
- Featured Roles use `job_skills` table (customizable, role-specific)
- Architecture working correctly

**Phase 1: Count Queries** ✅
- `getHighDemandOccupations()` includes crosswalk counts
- Table displays Open Roles and Programs counts
- Badges clickable, centered, and styled
- Navigation working with anchor links

**Phase 2: Detail Page Queries** ✅
- `getRelatedFeaturedRoles(socCode, limit)` - HDO → Featured Roles
- `getRelatedPrograms(jobId, limit)` - Any job → Programs (top 30)
- `getRelatedOccupations(socCode)` - Featured Role → HDOs
- `getSimilarRoles(socCode, excludeId, limit)` - Featured Role → Similar Roles

**Phase 3: UI Integration** ✅
- HDO detail pages: "Local Employers Hiring Now" + "Relevant Programs"
- Featured Role detail pages: "Related Occupations" + "Similar Roles" + "Relevant Programs"
- Empty states handled gracefully
- Load More functionality for programs
- Responsive 3-column grid layouts

### Commits (11 total)
1. Pass through crosswalk counts in transform
2. Center align columns in table config
3. Add column.align support to DataTable
4. Fix badge links (use job id)
5. Improve column alignment precedence
6. Fix centering with inline textAlign
7. Add crosswalk query functions (HDO)
8. Populate HDO detail page sections
9. Fix FeaturedProgramCard props
10. Complete Featured Role crosswalk implementation
11. Document follow-up tasks

### System Characteristics
- ✅ **Fully Automatic:** No manual updates needed when data changes
- ✅ **Dynamic Counts:** Real-time based on database state
- ✅ **Quality over Quantity:** Top 30 programs (not overwhelming)
- ✅ **Production Ready:** No mock data, all real queries
- ✅ **Backward Compatible:** No breaking changes

---

## 🔄 ENHANCEMENTS IN PROGRESS

### Phase 4: Relevance Scoring (Current)

**Goal:** Sort programs by relevance instead of just limiting to top 30.

**Current Behavior:**
- Programs limited to 30 via `program_jobs` junction
- No sorting by relevance - just database order
- All programs treated equally

**Proposed Enhancement:**

#### Relevance Scoring Algorithm

**Factors to Consider:**
1. **CIP-SOC Crosswalk Strength** (40% weight)
   - Primary CIP-SOC match: 1.0
   - Secondary CIP-SOC match: 0.7
   - Tertiary match: 0.4
   - Source: CIP-SOC crosswalk data (if available in DB)

2. **Program Level Match** (20% weight)
   - Certificate for entry-level roles: 1.0
   - Associate's for mid-level: 0.9
   - Bachelor's for senior roles: 1.0
   - Graduate degree for executive: 1.0
   - Mismatch: 0.5

3. **Skills Overlap** (30% weight)
   - Calculate: (shared_skills / total_job_skills)
   - 80%+ overlap: 1.0
   - 60-79% overlap: 0.8
   - 40-59% overlap: 0.6
   - <40% overlap: 0.4

4. **Local Availability** (10% weight)
   - In-region program: 1.0
   - Online/hybrid: 0.9
   - Out-of-region: 0.7

**Scoring Formula:**
```typescript
relevanceScore = 
  (cipSocStrength * 0.4) +
  (levelMatch * 0.2) +
  (skillsOverlap * 0.3) +
  (localAvailability * 0.1)

// Normalize to 0-100
displayScore = Math.round(relevanceScore * 100)
```

#### Implementation Plan

**Step 1: Update Query Function (30 min)**
```typescript
// File: /src/lib/database/queries.ts
export async function getRelatedPrograms(
  jobId: string, 
  limit: number = 30
): Promise<ProgramWithRelevance[]> {
  
  // 1. Fetch job details to get skills and level
  const job = await getJobById(jobId)
  const jobSkills = job.skills?.map(s => s.skill_id) || []
  
  // 2. Fetch programs via program_jobs
  const { data } = await supabase
    .from('program_jobs')
    .select(`
      programs!inner(
        *,
        school:schools!inner(*),
        program_skills(skill_id)
      )
    `)
    .eq('job_id', jobId)
    .limit(100) // Get more, then filter
  
  // 3. Calculate relevance for each program
  const programsWithScores = data?.map(pj => {
    const program = pj.programs
    const programSkills = program.program_skills?.map(ps => ps.skill_id) || []
    
    // Calculate skill overlap
    const sharedSkills = jobSkills.filter(js => programSkills.includes(js))
    const skillsOverlap = jobSkills.length > 0 
      ? sharedSkills.length / jobSkills.length 
      : 0
    
    // Calculate level match
    const levelMatch = calculateLevelMatch(job, program)
    
    // Calculate relevance score
    const relevanceScore = 
      (0.4 * 1.0) + // CIP-SOC (assume primary for now)
      (0.2 * levelMatch) +
      (0.3 * skillsOverlap) +
      (0.1 * 1.0) // Local (assume available)
    
    return {
      ...program,
      relevance_score: Math.round(relevanceScore * 100),
      shared_skills_count: sharedSkills.length
    }
  })
  
  // 4. Sort by relevance and limit
  return programsWithScores
    ?.sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit) || []
}

function calculateLevelMatch(job: any, program: any): number {
  const programLevel = program.program_type?.toLowerCase() || ''
  const jobLevel = job.category?.toLowerCase() || ''
  
  // Simple matching logic
  if (programLevel.includes('certificate')) {
    return jobLevel.includes('entry') || jobLevel.includes('assistant') ? 1.0 : 0.7
  }
  if (programLevel.includes('bachelor')) {
    return jobLevel.includes('senior') || jobLevel.includes('manager') ? 1.0 : 0.8
  }
  if (programLevel.includes('master') || programLevel.includes('graduate')) {
    return jobLevel.includes('director') || jobLevel.includes('executive') ? 1.0 : 0.7
  }
  
  return 0.8 // Default
}
```

**Step 2: Update UI to Display Score (15 min)**
```typescript
// File: /src/app/(main)/jobs/[id]/page.tsx

// In the programs section, add match percentage badge:
<FeaturedProgramCard
  // ... existing props
  skillsCallout={{
    type: 'match',
    count: program.relevance_score,
    label: `${program.relevance_score}% Match`,
    href: undefined
  }}
/>
```

**Step 3: Add Visual Indicator (15 min)**
```typescript
// File: /src/components/ui/featured-program-card.tsx

// Add match badge at top of card:
{relevanceScore && relevanceScore >= 70 && (
  <Badge className="bg-green-100 text-green-800">
    {relevanceScore}% Match
  </Badge>
)}
```

#### Files to Update
- `/src/lib/database/queries.ts` - Update `getRelatedPrograms()`
- `/src/app/(main)/jobs/[id]/page.tsx` - Pass relevance score to cards
- `/src/components/ui/featured-program-card.tsx` - Display match badge (optional)

#### Estimated Effort
- Query logic: 30 minutes
- UI updates: 15 minutes
- Testing: 15 minutes
- **Total: 1 hour**

#### Success Criteria
- [ ] Programs sorted by relevance score (highest first)
- [ ] Match percentage displayed on cards
- [ ] Top matches are genuinely more relevant
- [ ] Performance remains acceptable (<2s load)

---

### Phase 5: Assessment Results Integration (Future)

**Goal:** Replace mock program recommendations with real crosswalk data.

**Implementation:**
1. Query `program_skills` for programs teaching gap skills
2. Calculate relevance based on skill gap coverage
3. Display "This program addresses 5 of your 8 skill gaps"

**Estimated Effort:** 7-9 hours

**Priority:** High (post-launch)

---

### Phase 6: UI Simplification (Future)

**Goal:** Streamline program cards for better scannability.

**Changes:**
- Reduce visual complexity
- Emphasize key info (name, type, duration)
- Remove redundant elements

**Estimated Effort:** 2-3 hours

**Priority:** Medium (based on user feedback)

---

## References

- **Schema Check Script:** `/scripts/check-crosswalk-schema.js`
- **Skills Documentation:** `/docs/SKILLS_MAPPINGS_AND_RELATIONSHIPS.md`
- **Architecture Doc:** `/docs/SKILLS_ARCHITECTURE_CHANGE.md`
- **Database Queries:** `/src/lib/database/queries.ts`
- **Table Config:** `/src/lib/table-configs.ts` (lines 241-281)
- **Follow-up Tasks:** See Phases 4-6 above (consolidated from separate doc)
