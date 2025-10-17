# Skills Architecture Change: SOC-Based to Role-Specific

## Problem Statement

**Original Issue:**
When editing skills for a featured role (e.g., "Assistant Mechanical Project Manager"), the changes affected ALL roles sharing the same SOC code, including:
- Other featured roles at different seniority levels (Senior, Mid-level)
- High-demand occupations with the same SOC code

**Example:**
- Assistant Mechanical Project Manager (SOC: 11-9041.00)
- Mechanical Project Manager (SOC: 11-9041.00)  
- Senior Mechanical Project Manager (SOC: 11-9041.00)

All three roles shared the same skills, with no room for seniority-level nuances (leadership skills for Senior, basic skills for Assistant, etc.).

## Solution: Hybrid Approach

### Architecture

**High-Demand Occupations (job_kind = 'occupation'):**
- ✅ Continue using SOC-based skills from `skills` table
- ✅ Read-only baseline representing general occupation requirements
- ✅ Maintains government data integrity (O*NET/Lightcast)
- ✅ Updated when SOC data is refreshed

**Featured Roles (job_kind = 'featured_role'):**
- ✅ Use role-specific skills from `job_skills` junction table
- ✅ Fully customizable per role
- ✅ No cross-contamination between roles
- ✅ Allows seniority-level differentiation

### Database Schema

```sql
-- New junction table
job_skills (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  skill_id UUID REFERENCES skills(id),
  importance_level INTEGER (1-5),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(job_id, skill_id)
)
```

### Data Flow

**Creating a New Featured Role:**
1. User selects SOC code
2. System copies SOC-based skills as starting point
3. Skills are stored in `job_skills` table (role-specific)
4. User can customize without affecting other roles

**Editing Featured Role Skills:**
1. Changes only affect that specific role
2. No impact on other roles with same SOC code
3. No impact on high-demand occupations

**High-Demand Occupations:**
1. Always read from `skills` table filtered by SOC code
2. Cannot be customized (maintains baseline)
3. Updated when SOC data is refreshed

## Benefits

### For Companies
- ✅ Can differentiate Assistant/Mid/Senior roles
- ✅ Add specialized skills for specific positions
- ✅ No accidental overrides across roles
- ✅ More accurate job descriptions and assessments

### For System Integrity
- ✅ High-demand occupations remain accurate
- ✅ SOC-based data preserved as baseline
- ✅ Government data compliance maintained
- ✅ Clear separation of concerns

### For Candidates
- ✅ More accurate skill assessments
- ✅ Better role matching
- ✅ Clear differentiation between seniority levels
- ✅ Realistic skill expectations

## Migration

### Automatic Migration
The migration script automatically:
1. Creates `job_skills` table
2. Copies existing SOC-based skills to role-specific skills for all featured roles
3. Preserves current associations
4. No data loss

### Manual Steps Required
None - migration is fully automated.

## API Changes

### New Query Functions

```typescript
// Get skills for any job (handles both types automatically)
getJobSkills(jobId, jobKind, socCode)

// Add skill to featured role
addJobSkill(jobId, skillId, importanceLevel)

// Update skill importance
updateJobSkillImportance(jobSkillId, importanceLevel)

// Remove skill from featured role
removeJobSkill(jobSkillId)

// Bulk update (replace all skills)
updateJobSkills(jobId, skillIds, importanceLevel)

// Copy SOC skills as starting point
copySOCSkillsToJob(jobId, socCode)

// Get skill count
getJobSkillCount(jobId, jobKind, socCode)
```

### Backward Compatibility
- ✅ Existing queries continue to work
- ✅ High-demand occupations unchanged
- ✅ Featured roles automatically migrated
- ✅ No breaking changes to UI

## UI Changes Required

### Skills Tab (Admin & Employer)
- [x] Update to use `getJobSkills()` instead of direct SOC query
- [ ] Show "Copy from SOC" button for featured roles
- [ ] Add importance level selector (1-5 stars)
- [ ] Update save logic to use `updateJobSkills()`

### SOC Code Change
- [ ] Prompt: "Copy skills from new SOC code?"
- [ ] Option to keep existing skills or refresh from SOC

### Skill Extraction
- [ ] AI-extracted skills go to `job_skills` for featured roles
- [ ] Manual selection goes to `job_skills` for featured roles

## Testing Checklist

- [ ] Create new featured role - skills are role-specific
- [ ] Edit featured role skills - only that role is affected
- [ ] Create multiple roles with same SOC - skills are independent
- [ ] High-demand occupations still use SOC-based skills
- [ ] SOC code change offers to copy new skills
- [ ] Skill count updates correctly
- [ ] Assessments use correct skills per role
- [ ] Migration preserves all existing skills

## Rollback Plan

If issues arise:
1. Drop `job_skills` table
2. Revert to SOC-based queries
3. No data loss (original `skills` table unchanged)

## Future Enhancements

- Importance level weighting in assessments
- Skill recommendations based on seniority level
- Bulk skill management across similar roles
- Skill gap analysis between seniority levels
- Company-wide skill library

## Questions & Answers

**Q: Will AI generate specific SOC codes for Assistant/Senior roles?**
A: No - SOC codes are standardized and intentionally general. The differentiation happens at the skill level, not SOC level.

**Q: What happens to existing roles?**
A: Automatically migrated to role-specific skills. No action required.

**Q: Can we still use SOC-based skills?**
A: Yes - high-demand occupations continue to use SOC-based skills. Featured roles can optionally copy SOC skills as a starting point.

**Q: Does this affect assessments?**
A: Yes - assessments will now use role-specific skills for featured roles, providing more accurate evaluations.

## Implementation Status

- [x] Database migration created
- [x] Query functions created
- [x] Documentation complete
- [ ] Update admin role editor
- [ ] Update employer role editor
- [ ] Update skill extraction components
- [ ] Update assessment generation
- [ ] Testing complete
- [ ] Production deployment
