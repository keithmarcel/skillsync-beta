# Curated Skills Integration - TODO

**Status:** Skills Extractor is complete and saving curated skills to `soc_skills` table. Now need to wire them throughout the app.

## Current State
- ✅ Skills Extractor admin tool complete
- ✅ Curated skills saved to `soc_skills` junction table
- ✅ Duplicate prevention working
- ✅ Descriptions updating correctly
- ❌ App still showing O*NET skills instead of curated skills

## Integration Points Needed

### 1. Job/Occupation Detail Pages
**File:** `/src/lib/database/queries.ts` - `getJobById()` function (line 271)

**Current:** Fetches skills from `job_skills` table
```typescript
skills:job_skills(
  weight,
  skill:skills(*)
)
```

**Needed:** 
1. Check if job has `soc_code`
2. If yes, fetch curated skills from `soc_skills` table
3. If no curated skills exist, fall back to `job_skills`
4. Transform data to match expected format

**Implementation:**
```typescript
// After fetching job, check for curated skills
if (data?.soc_code) {
  const { data: curatedSkills } = await supabase
    .from('soc_skills')
    .select('weight, skill:skills(*)')
    .eq('soc_code', data.soc_code)
    .order('weight', { ascending: false })
  
  if (curatedSkills && curatedSkills.length > 0) {
    data.skills = curatedSkills
  }
}
```

### 2. Quiz Generator
**File:** Need to find where quiz questions are generated

**Current:** Likely using O*NET skills or `job_skills`

**Needed:**
1. Check if occupation/role has SOC code
2. Fetch curated skills from `soc_skills` if available
3. Use curated skills for quiz generation
4. Fall back to existing logic if no curated skills

**Search for:** 
- `llm_generate_quiz`
- Quiz generation functions
- Assessment creation logic

### 3. Featured Roles
**File:** `/src/lib/database/queries.ts` - role queries

**Current:** Roles likely fetch skills from `job_skills` or similar

**Needed:**
1. When displaying featured roles, check for curated skills via SOC code
2. Show curated skills if available
3. Fall back to role's own skills if not

### 4. Programs
**File:** `/src/lib/database/queries.ts` - program queries

**Current:** Programs have their own skills in `program_skills` table

**Needed:**
1. If program has CIP code → SOC code mapping, show curated SOC skills
2. Otherwise show program's own skills
3. This is lower priority since programs are more specific

## Database Schema Reference

### soc_skills (Junction Table)
```sql
- id: UUID
- soc_code: TEXT
- skill_id: UUID (references skills.id)
- display_order: INTEGER
- is_primary: BOOLEAN
- weight: DECIMAL
- created_by: UUID
- created_at: TIMESTAMP
```

### Unique Constraint
- `(soc_code, skill_id)` - prevents duplicates

## Priority Order
1. **HIGH:** Job/Occupation detail pages (most visible)
2. **HIGH:** Quiz generator (core functionality)
3. **MEDIUM:** Featured roles on homepage
4. **LOW:** Programs (have their own skills)

## Testing Checklist
After implementation:
- [ ] View job with SOC 15-1252.00 - should show 13 curated skills
- [ ] View job without curated skills - should show original skills
- [ ] Generate quiz for SOC with curated skills - should use them
- [ ] Featured roles with SOC codes should show curated skills
- [ ] No errors in console
- [ ] Skills display with descriptions

## Notes
- Curated skills are sorted by weight (descending) then alphabetically
- Skills have descriptions from OpenAI
- The `is_primary` flag exists but is not currently used in UI
- Skills Extractor allows re-running extraction to update skills
