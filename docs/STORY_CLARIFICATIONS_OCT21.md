# Story Clarifications - October 21, 2025

## Summary of Findings & Actions

### 1. ASSESS-320: Consent Prompt After Assessment ❌ **MISSING**

**Question:** Do we have an alert/callout prompting users to consent if they qualified but haven't consented yet?

**Answer:** **NO** - This feature is missing.

**Current Behavior:**
- Auto-invite system silently checks `agreed_to_terms` (implicit consent from signup)
- If user qualified but no consent → nothing happens, no prompt
- Toast only shows "Results shared" if consent already exists
- User has no idea they could get employer invites

**What's Needed:**
Create a consent prompt/callout on assessment results page when:
- User's readiness ≥ visibility threshold (qualified)
- User hasn't enabled `visible_to_employers` in settings
- Show benefit: "Enable sharing to get employer invites!"
- CTA button to settings or inline toggle

**Implementation Plan:**
```typescript
// On assessment results page
if (readiness >= visibilityThreshold && !profile.visible_to_employers) {
  // Show alert/callout:
  // "🎉 You qualified! Enable result sharing to receive employer invitations."
  // [Enable Sharing] button → opens consent dialog or redirects to settings
}
```

**Files to Modify:**
- `/src/app/(main)/assessments/[id]/results/page.tsx` - Add consent prompt
- `/src/components/settings/consent-toggle-dialog.tsx` - Reuse existing dialog
- Check consent status after assessment analysis

**Priority:** HIGH - Users are qualifying but not getting invites because they don't know to enable consent

---

### 2. ASSESS-301 (Resume): Purge Feature ✅ **COMPLETE**

**Request:** Remove all resume upload functionality from codebase.

**Status:** ✅ **PURGED**

**What Was Removed:**
1. **Entire resume upload page:** `/src/app/(main)/assessments/resume/[jobId]/page.tsx`
2. **API function:** `extractResumeSkills()` from `/src/lib/api.ts`
3. **Route:** `resumeAssessment` from `/src/lib/routes.ts`
4. **Permission:** `upload_resume` from RBAC
5. **Type definitions:** 'resume' from `AssessmentMethod` type
6. **Database enum:** 'resume' from `assessment_method` enum
7. **Transform logic:** Resume method checks from transforms
8. **Mock data:** Changed from 'resume' to 'quiz'

**Database Migration Created:**
- `20251021000003_remove_resume_method.sql`
  - Updates existing resume assessments to 'quiz'
  - Recreates enum with only 'quiz' value
  - Adds comment documenting deprecation

**Result:** Clean codebase - only quiz-based assessments remain

**Commit:** `6fd6cda` - "feat: Purge resume upload feature from codebase"

---

### 3. OCC-402 + OCC-403: HDO Details Page Features

**Clarification:** These stories refer to the **High-Demand Occupations (HDO) details page**, not general occupation pages.

**User Request:** 
> "This refers to the option for users to see Local Employers Hiring Now and Relevant Education & Training Programs on any HDO details page."

**Current State:**
- Occupation details page (`/occupations/[id]`) redirects to `/jobs/[id]`
- No dedicated HDO details page exists
- Jobs table unified occupations and roles

**What's Needed:**

#### **OCC-402: Show "Hiring Now" Roles Sharing SOC Code**

**Goal:** On HDO details page, show local employers with open featured roles for that occupation

**Implementation:**
1. Create actual HDO details page (stop redirecting)
2. Query jobs table for roles with matching `soc_code`
3. Filter by:
   - `job_kind = 'featured_role'` (not occupations)
   - `status = 'published'`
   - `is_published = true`
4. Display as "Local Employers Hiring Now" section
5. Show company logo, role title, median wage, "Apply" CTA

**Query:**
```typescript
const { data: hiringNowRoles } = await supabase
  .from('jobs')
  .select(`
    id,
    title,
    median_wage_usd,
    application_url,
    company:companies(name, logo_url)
  `)
  .eq('soc_code', occupation.soc_code)
  .eq('job_kind', 'featured_role')
  .eq('status', 'published')
  .eq('is_published', true)
```

#### **OCC-403: Surface Relevant Programs via CIP-SOC Crosswalk**

**Goal:** On HDO details page, show education/training programs relevant to that occupation

**Implementation:**
1. Use CIP-SOC crosswalk (NOT skill overlap - that's broken)
2. Get occupation's SOC code → find matching CIP codes → get programs
3. Display as "Relevant Education & Training Programs" section
4. Show program name, provider, format, duration, "Learn More" CTA

**Query:**
```typescript
// Step 1: Get CIP codes for this SOC
const { data: cipMatches } = await supabase
  .from('cip_soc_crosswalk')
  .select('cip_code, match_strength')
  .eq('soc_code', occupation.soc_code)

// Step 2: Get programs with those CIP codes
const cipCodes = cipMatches.map(m => m.cip_code)
const { data: programs } = await supabase
  .from('programs')
  .select(`
    id,
    name,
    format,
    duration_text,
    school:schools(name, logo_url)
  `)
  .in('cip_code', cipCodes)
  .eq('status', 'published')
```

**Reuse Existing Functions:**
- `getRelatedPrograms(jobId)` already uses CIP-SOC crosswalk
- Just need to adapt for occupation context

**Page Structure:**
```
HDO Details Page (/occupations/[id])
├── Hero Section (occupation title, SOC, median wage)
├── Overview (description, outlook, education required)
├── Skills Required (from O*NET)
├── 🆕 Local Employers Hiring Now (OCC-402)
│   └── Featured roles with matching SOC code
├── 🆕 Relevant Education & Training (OCC-403)
│   └── Programs via CIP-SOC crosswalk
└── Related Occupations (similar SOC codes)
```

**Files to Create/Modify:**
- `/src/app/(main)/occupations/[id]/page.tsx` - Replace redirect with actual page
- `/src/lib/database/queries.ts` - Add `getHiringNowRoles(socCode)` and `getRelatedProgramsBySoc(socCode)`
- Reuse existing components: `SimpleProgramCard`, `JobCard`

**Priority:** MEDIUM - Enhances discovery flow, connects labor market to education

---

## Next Steps

### Immediate (High Priority):
1. ✅ **ASSESS-301 (Resume)** - COMPLETE
2. 🔨 **ASSESS-320** - Implement consent prompt on results page
3. 📋 **Update Roadmap** - Mark completed stories as done

### Short-term (Medium Priority):
4. 🔨 **OCC-402** - Build HDO details page with "Hiring Now" section
5. 🔨 **OCC-403** - Add "Relevant Programs" section to HDO page
6. 🔨 **EMPLOYER-603-UI** - Build role editor form (backend ready)

### Documentation:
- Update `SPRINT_ROADMAP.md` with corrected statuses
- Document HDO page architecture
- Add consent prompt to assessment workflow docs

---

## Technical Notes

**CIP-SOC Crosswalk:**
- Use this for ALL program-job matching (skill overlap is broken)
- See `docs/investigations/SKILLS_TAXONOMY_AUDIT_PROJECT.md` for details
- Wait for SYSTEM-INFRA-906 before attempting skill-based matching

**HDO vs Featured Roles:**
- HDO (occupations): General job categories, BLS/O*NET data
- Featured Roles: Company-sponsored positions, employer-paid
- Both use SOC codes for crosswalk matching
- Jobs table unified both types (`job_kind` field differentiates)

**Consent System:**
- Implicit consent: `agreed_to_terms` (from signup)
- Explicit consent: `visible_to_employers` (user toggle in settings)
- Auto-invite requires consent to create invitations
- Consent toggle has confirmation dialogs with impact preview
