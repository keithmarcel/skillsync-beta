# Crosswalk Logic - Complete Explanation

## Your Question

**Scenario:**
- Assessment: Surgical Technologist (Certified) from BayCare
- Score: 96% (role-ready, above 90% threshold)
- Job Details Page: Shows 0 programs
- Assessment Results Page: Shows 8 programs

**Why the difference?**

## The Answer

The two pages use **DIFFERENT logic** to determine which programs to show:

### Job Details Page Logic
```typescript
// ALWAYS uses crosswalk (CIP-SOC matching)
const programs = await getRelatedPrograms(jobId, 30)
```

**How it works:**
1. Gets job's SOC code (`29-2055.00` for Surgical Tech)
2. Looks up CIP codes in `cip_soc_crosswalk` table
3. Finds programs with matching CIP codes
4. Returns programs sorted by relevance

**Crosswalk for Surgical Tech:**
- SOC: `29-2055.00`
- CIP: `51.0904` (Surgical Technology)
- CIP: `51.0909` (Surgical Technology/Technologist)

**Programs Available:**
- 8 programs with CIP `51.0904`
- All published, all have descriptions

**So why 0 programs on job details?** 
→ The `getRelatedPrograms` function should be returning 8 programs!

### Assessment Results Page Logic
```typescript
// Uses DIFFERENT logic based on readiness
if (gapSkills.length > 0) {
  // Has gaps → skill-based matching
  const programs = await getGapFillingPrograms(gapSkills, 10)
} else {
  // No gaps → crosswalk matching  
  const programs = await getRelatedPrograms(jobId, 10)
}
```

**How it works:**
1. Calculates which skills are below threshold
2. **If ANY skills below threshold:** Uses `getGapFillingPrograms`
   - Finds programs that teach those specific gap skills
   - Ignores crosswalk entirely
   - Sorts by how many gaps they address
3. **If NO skills below threshold:** Uses `getRelatedPrograms`
   - Same as job details page
   - Uses crosswalk

**Your Case (96% role-ready):**
- Overall: 96% (above 90% threshold)
- But: You probably have 1-2 skills slightly below 90%
- Therefore: Uses `getGapFillingPrograms` (skill-based)
- Shows: 8 programs that teach those gap skills

## The Key Difference

| Page | Logic | Matching Method |
|------|-------|----------------|
| **Job Details** | Always crosswalk | CIP-SOC codes |
| **Assessment Results (with gaps)** | Skill-based | Direct skill matching |
| **Assessment Results (no gaps)** | Crosswalk | CIP-SOC codes |

## Why This Matters

### Skill-Based Matching (`getGapFillingPrograms`)
**Pros:**
- ✅ Highly targeted to user's specific needs
- ✅ Shows programs that address exact skill gaps
- ✅ More personalized

**Cons:**
- ❌ Ignores crosswalk data
- ❌ Might miss relevant programs
- ❌ Depends on program_skills data quality

### Crosswalk Matching (`getRelatedPrograms`)
**Pros:**
- ✅ Uses official CIP-SOC taxonomy
- ✅ Comprehensive coverage
- ✅ Industry-standard approach

**Cons:**
- ❌ Less personalized
- ❌ Might show irrelevant programs
- ❌ Depends on crosswalk data quality

## The Real Issue

**Job details page should be showing 8 programs but shows 0.**

This means `getRelatedPrograms` is failing for Surgical Tech. Let me trace through the logic:

1. ✅ Job has SOC code: `29-2055.00`
2. ✅ Crosswalk has CIP codes: `51.0904`, `51.0909`
3. ✅ Programs exist with CIP `51.0904`
4. ✅ Programs are published
5. ✅ Programs have descriptions
6. ❓ **Something is filtering them out**

## Debugging Steps

1. **Check if programs are being fetched:**
   ```sql
   SELECT * FROM programs 
   WHERE cip_code IN ('51.0904', '51.0909') 
   AND status = 'published'
   ```

2. **Check if filtering is removing them:**
   - Name doesn't start with 'Skills:' or 'Build:' ✅
   - Has short_desc ✅

3. **Check console logs:**
   - Look for: "Related Programs loaded: X"
   - Should show 8, but probably shows 0

4. **Check the actual query:**
   - `getRelatedPrograms` might be failing silently
   - Check for errors in console

## Recommendation

The job details page should show the same 8 programs. If it's not, there's a bug in `getRelatedPrograms` or the filtering logic.

**Next steps:**
1. Add console logging to `getRelatedPrograms`
2. Check what's being returned
3. Verify filtering isn't too aggressive
4. Ensure crosswalk query is working

## Summary

**Assessment Results (96% role-ready with some gaps):**
- Uses: `getGapFillingPrograms` (skill-based)
- Shows: 8 programs that teach gap skills
- Works: ✅

**Job Details:**
- Uses: `getRelatedPrograms` (crosswalk-based)
- Should show: 8 programs via CIP 51.0904
- Actually shows: 0 programs
- Status: ❌ BUG

The crosswalk is set up correctly. The programs exist. Something in the job details page logic is preventing them from displaying.
