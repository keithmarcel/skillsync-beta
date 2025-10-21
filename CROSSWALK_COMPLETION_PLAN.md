# Crosswalk Feature - Completion Plan

## Current State Summary

### ✅ What's Working:
1. **HDO → Featured Roles** (SOC match) ✅
2. **HDO → Programs** (CIP-SOC crosswalk) ✅
3. **Featured Role → Programs** (CIP-SOC crosswalk) ✅
4. **Featured Role → Similar Roles** (SOC match) ✅
5. **Program → Jobs** (Skills overlap via `getRelatedJobsForProgram`) ✅

### ❌ What Needs Work:
1. More CIP-SOC mappings (only 21, need 1,000+)
2. Assessment results page integration
3. Program detail page verification

---

## 1. Getting More Crosswalk Matches

### A. More Open Roles per HDO

**Current Limitation:**
- Only 9 Featured Roles in database
- Only matches if SOC codes align

**Solutions:**

**Short-term:**
- Companies create more Featured Roles via CMS
- Ensure correct SOC codes are assigned
- More roles = more matches automatically

**Long-term:**
- Encourage company signups
- Bulk import tools for companies
- SOC code validation/suggestions

### B. More Programs per HDO

**Current Limitation:**
- Only 21 CIP-SOC mappings loaded
- Full NCES dataset has 1,000+ mappings

**Solution - Add Full NCES Dataset:**

1. **Download NCES CIP-SOC Crosswalk:**
   - URL: https://nces.ed.gov/ipeds/cipcode/resources.aspx?y=56
   - File: CIP-SOC Crosswalk (Excel/CSV)

2. **Convert to JavaScript Array:**
   ```javascript
   // In scripts/populate-cip-soc-crosswalk.js
   const CIP_SOC_MAPPINGS = [
     // Current 21 mappings...
     
     // Add full NCES dataset (~1,000+ mappings)
     { cip_code: '01.0101', cip_title: 'Agricultural Business', soc_code: '11-9013.00', soc_title: 'Farmers, Ranchers', match_strength: 'primary' },
     // ... etc
   ];
   ```

3. **Rerun Population Script:**
   ```bash
   node scripts/populate-cip-soc-crosswalk.js
   ```

4. **Immediate Results:**
   - Programs automatically appear for matching HDOs
   - No code changes needed
   - Fully dynamic

**Estimated Impact:**
- Current: 0-34 programs per HDO
- After full dataset: 10-100+ programs per HDO

---

## 2. Program Card Routing & Match Percentage

### Current Behavior:

**On HDO/Featured Role Detail Pages:**
```
┌─────────────────────────────┐
│ MS Accounting               │
│ Eastern Connecticut State   │
│                             │
│ 64% Match     [See Jobs]    │  ← "See Jobs" opens modal
│                             │
│ [Explore →]                 │  ← Goes to /programs/{id}
└─────────────────────────────┘
```

**What Each Does:**

1. **"64% Match"** = Relevance Score
   - 40% CIP-SOC match strength
   - 30% Skills overlap
   - 20% Program level match
   - 10% Local availability

2. **"See Jobs"** = Opens Modal
   - Shows jobs that share skills with program
   - Uses `getRelatedJobsForProgram()`
   - Based on skills overlap (NOT CIP-SOC)
   - Shows both Featured Roles AND HDOs

3. **"Explore"** = Navigate to Program Detail
   - Goes to `/programs/{id}`
   - Shows full program details
   - Should show related jobs/occupations

### Routing Summary:

| Element | Action | Destination |
|---------|--------|-------------|
| Card click | Navigate | `/programs/{id}` |
| "See Jobs" button | Open modal | Shows related jobs inline |
| "Explore" button | Navigate | `/programs/{id}?from=featured` |

### Is This Correct?

**Yes, mostly!** But consider:

**Option A: Keep Current (Modal)**
- ✅ Quick preview without leaving page
- ✅ Good for browsing multiple programs
- ❌ Limited space for details

**Option B: Navigate to Program Detail**
- ✅ More space for job details
- ✅ Better for deep exploration
- ❌ Requires back navigation

**Recommendation:** Keep modal for now, but ensure program detail page has comprehensive job listings.

---

## 3. Assessment Results Page Integration

### Current State:

**File:** `/src/app/(main)/my-assessments/[id]/results/page.tsx`

**What It Shows:**
- Overall proficiency score
- Skill-by-skill breakdown
- Identified gaps
- **Mock program recommendations** ❌

### What Needs to Happen:

**Replace mock data with real crosswalk:**

```typescript
// Current (mock):
const mockPrograms = [...]

// New (dynamic):
const gapSkills = assessmentResults
  .filter(r => r.proficiency_band === 'needs_development')
  .map(r => r.skill_id)

const programs = await getGapFillingPrograms(gapSkills, 10)
```

**New Function Needed:**
```typescript
// In queries.ts
export async function getGapFillingPrograms(
  gapSkillIds: string[], 
  limit: number = 10
): Promise<ProgramWithRelevance[]> {
  
  // 1. Find programs that teach these gap skills
  const { data } = await supabase
    .from('program_skills')
    .select(`
      program_id,
      programs!inner(
        *,
        school:schools!inner(*),
        program_skills(skill_id)
      )
    `)
    .in('skill_id', gapSkillIds)
  
  // 2. Calculate relevance based on gap coverage
  const programsWithScores = data?.map(p => {
    const program = p.programs
    const programSkills = program.program_skills?.map(ps => ps.skill_id) || []
    
    // How many gap skills does this program address?
    const gapsAddressed = gapSkillIds.filter(gs => programSkills.includes(gs))
    const gapCoverage = gapsAddressed.length / gapSkillIds.length
    
    return {
      ...program,
      relevance_score: Math.round(gapCoverage * 100),
      gaps_addressed: gapsAddressed.length,
      total_gaps: gapSkillIds.length
    }
  })
  
  // 3. Sort by gap coverage and return top N
  return programsWithScores
    ?.sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit) || []
}
```

**UI Update:**
```typescript
// Show gap-focused messaging
<ProgramCard
  {...program}
  skillsCallout={{
    type: 'skills',
    count: program.gaps_addressed,
    label: `Addresses ${program.gaps_addressed} of your ${program.total_gaps} skill gaps`
  }}
/>
```

**Estimated Effort:** 2-3 hours

---

## 4. Program Detail Page Verification

### Current Implementation:

**File:** `/src/app/(main)/programs/[id]/page.tsx`

**What It Should Show:**
1. Program details
2. Related jobs (via `getRelatedJobsForProgram`)
3. Related occupations (via CIP-SOC crosswalk)

### Verification Needed:

**Check if it's using:**
- ✅ `getRelatedJobsForProgram()` - Skills overlap (should work)
- ❓ CIP-SOC crosswalk for occupations - Need to verify

**Action Items:**

1. **Test Program Detail Page:**
   - Navigate to `/programs/{id}`
   - Check if "Related Jobs" section shows data
   - Check if "Related Occupations" section exists

2. **If Missing, Add Occupations Section:**
   ```typescript
   // In programs/[id]/page.tsx
   const relatedOccupations = await getOccupationsForProgram(program.cip_code)
   
   // New function in queries.ts
   export async function getOccupationsForProgram(cipCode: string) {
     // 1. Get SOC codes for this CIP
     const { data: socMatches } = await supabase
       .from('cip_soc_crosswalk')
       .select('soc_code')
       .eq('cip_code', cipCode)
     
     const socCodes = socMatches?.map(m => m.soc_code) || []
     
     // 2. Get HDOs with those SOC codes
     const { data: occupations } = await supabase
       .from('jobs')
       .select('*')
       .eq('job_kind', 'occupation')
       .in('soc_code', socCodes)
     
     return occupations || []
   }
   ```

**Estimated Effort:** 1-2 hours

---

## Featured Programs Tab - Current Status

### What You Mentioned:
> "we have this logic wired in the program cards on the featured program tab. not sure if its working properly"

**File:** `/src/app/(main)/programs/page.tsx`

**Current Implementation:**
```typescript
// Featured programs use skillsCallout
skillsCallout={{
  type: 'jobs',
  count: program.relatedJobsCount || 0,
  label: `This program provides skills for ${program.relatedJobsCount || 0} jobs`,
  href: `/programs/${program.id}/jobs`
}}
```

**Does It Need Refactoring?**

**Check:**
1. Is `relatedJobsCount` being calculated correctly?
2. Is it using `getRelatedJobsForProgram()` or old logic?
3. Does the "See Jobs" modal work?

**Likely Status:** Should work fine with current `getRelatedJobsForProgram()` which uses skills overlap.

**Action:** Test it and verify counts are accurate.

---

## Priority Recommendations

### High Priority (Do First):
1. ✅ **Add Full NCES CIP-SOC Dataset** (30 min)
   - Immediate impact on program matches
   - No code changes needed

2. 🔥 **Assessment Results Integration** (2-3 hrs)
   - High user value
   - Core feature completion

### Medium Priority:
3. **Program Detail Page Verification** (1-2 hrs)
   - Ensure occupations section exists
   - Complete the crosswalk loop

4. **Featured Programs Tab Testing** (30 min)
   - Verify counts are accurate
   - Test "See Jobs" modal

### Low Priority:
5. **UI Refinements** (ongoing)
   - Simplify program cards
   - Improve messaging
   - Based on user feedback

---

## Summary

**To Complete Crosswalk Experience:**

1. **More Matches:**
   - Add full NCES dataset (1,000+ CIP-SOC mappings)
   - Encourage more Featured Role creation

2. **Routing is Correct:**
   - "64% Match" = Relevance score ✅
   - "See Jobs" = Modal with related jobs ✅
   - "Explore" = Navigate to program detail ✅

3. **Complete Integration:**
   - Assessment results page (2-3 hrs)
   - Program detail page verification (1-2 hrs)
   - Featured programs tab testing (30 min)

**Total Effort:** 4-6 hours to complete everything

**Ready to tackle these?** Let me know which one you want to start with!
