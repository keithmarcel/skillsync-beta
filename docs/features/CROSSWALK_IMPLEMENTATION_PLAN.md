# Crosswalk Implementation Plan - Phase 4A

**Status:** 🔄 In Progress  
**Branch:** `feature/crosswalk-implementation`  
**Created:** October 20, 2025 6:12 PM  
**Last Updated:** October 20, 2025 6:12 PM

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

**Implementation:**

**File:** `/src/lib/database/queries.ts`

- [ ] Add `getSkillsBySocCode(soc_code)` function
  ```typescript
  // Query soc_skills junction table
  SELECT s.* 
  FROM skills s
  INNER JOIN soc_skills ss ON s.id = ss.skill_id
  WHERE ss.soc_code = [soc_code]
  ORDER BY ss.display_order, ss.weight DESC
  ```

- [ ] Modify `getHighDemandOccupations()` to include SOC-based skills
  - Join with soc_skills table
  - Return skills array for each HDO
  - Update skills_count field

- [ ] Modify `getJobById()` to handle both architectures:
  - If job_kind = 'occupation': Use `getSkillsBySocCode()`
  - If job_kind = 'featured_role': Use `job_skills` junction
  - Ensure detail pages display skills correctly

**Testing:**
- [ ] Verify HDOs now show skills (should be 5-15 per occupation)
- [ ] Verify Featured Roles still show their custom skills
- [ ] Verify skills_count updates correctly

**Success Criteria:**
- HDOs display SOC-based skills from `soc_skills` table
- Featured Roles continue using `job_skills` table
- No cross-contamination between the two architectures

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

## References

- **Schema Check Script:** `/scripts/check-crosswalk-schema.js`
- **Skills Documentation:** `/docs/SKILLS_MAPPINGS_AND_RELATIONSHIPS.md`
- **Architecture Doc:** `/docs/SKILLS_ARCHITECTURE_CHANGE.md`
- **Database Queries:** `/src/lib/database/queries.ts`
- **Table Config:** `/src/lib/table-configs.ts` (lines 241-281)
