# Story Status Review - October 21, 2025

**Requested Stories:** OCC-402, OCC-403, ASSESS-301 (x2), ASSESS-321, ASSESS-320, ASSESS-310, EMPLOYER-603

---

## 📊 Summary

| Story | Status | Completion % | Notes |
|-------|--------|--------------|-------|
| **OCC-402** | ❌ Not Started | 0% | Occupation details page redirects to jobs |
| **OCC-403** | ❌ Not Started | 0% | No skill overlap implementation |
| **ASSESS-301 (Timeline)** | ✅ Complete | 100% | "What to Expect" block exists |
| **ASSESS-301 (Resume)** | ⚠️ Exists but Unused | 50% | Resume upload page exists but not in flow |
| **ASSESS-321** | ✅ Complete | 100% | Auto-share working via auto-invite |
| **ASSESS-320** | ✅ Complete | 100% | Consent toggle with dialogs implemented |
| **ASSESS-310** | ✅ Complete | 100% | 24-hour cooldown fully implemented |
| **EMPLOYER-603** | ⚠️ Backend Complete | 75% | Field exists, UI is placeholder |

---

## 🔴 OCC-402: Show "Hiring Now" Roles Sharing SOC Code

**Status:** ❌ Not Started (0%)

**Current State:**
- Occupation details page (`/occupations/[id]/page.tsx`) redirects to `/jobs/[id]`
- No crosswalk implementation for showing related roles
- Jobs table has SOC codes but no query to find matching roles

**What's Needed:**
1. Create actual occupation details page (don't redirect)
2. Query jobs table for roles with matching `soc_code`
3. Filter by `status = 'published'` and `is_published = true`
4. Display as "Hiring Now" section on occupation page

**Blocker:** None - just needs implementation

**Files to Create/Modify:**
- `/src/app/(main)/occupations/[id]/page.tsx` - Replace redirect with actual page
- `/src/lib/database/queries.ts` - Add `getJobsBySocCode(socCode: string)`

---

## 🔴 OCC-403: Surface Relevant Programs via Skill Overlap

**Status:** ❌ Not Started (0%)

**Current State:**
- No implementation on occupation details page
- Skill overlap matching is broken (skill ID mismatch - see SKILLS_TAXONOMY_AUDIT_PROJECT.md)
- CIP-SOC crosswalk exists and works

**What's Needed:**
1. Use CIP-SOC crosswalk instead of skill overlap
2. Get occupation's SOC code → find matching CIP codes → get programs
3. Display programs on occupation details page

**Blocker:** 
- ⚠️ Skill overlap broken due to taxonomy mismatch
- ✅ Can use CIP-SOC crosswalk as workaround

**Recommendation:** 
Use CIP-SOC crosswalk approach (same as program-job matching). Wait for SYSTEM-INFRA-906 for true skill overlap.

**Files to Create/Modify:**
- `/src/app/(main)/occupations/[id]/page.tsx` - Add programs section
- Use existing `getRelatedPrograms()` function (already uses CIP-SOC)

---

## ✅ ASSESS-301: "What to Expect" and Timeline Block

**Status:** ✅ Complete (100%)

**Evidence:**
```typescript
// File: src/app/(main)/assessments/[id]/intro/page.tsx (Line 139-142)
{/* What to Expect */}
<div className="space-y-4 mb-8">
  <h3 className="text-xl font-semibold text-gray-900">What to Expect:</h3>
  <div className="space-y-3">
    <div className="flex items-start gap-3">
      <CheckCircle2 className="h-6 w-6 text-teal-600 flex-shrink-0 mt-0.5" />
```

```typescript
// File: src/app/(main)/assessments/quiz/[quizId]/page.tsx (Line 365-368)
<CardTitle className="text-xl font-bold font-source-sans-pro">What to Expect</CardTitle>
<CardDescription className="text-base">
  This assessment will evaluate your knowledge across {sections.length} key skill areas for {job.title}.
</CardDescription>
```

**Timeline Display:**
```typescript
// File: src/app/(main)/assessments/[id]/intro/page.tsx (Line 136)
<span className="font-medium">This assessment takes ~5 minutes</span>
```

**Location:** Pre-assessment intro page and quiz page sidebar

**Status in Roadmap:** Marked as incomplete but actually exists

**Recommendation:** ✅ Mark as complete in roadmap

---

## ⚠️ ASSESS-301: Eliminate Resume Upload (use LinkedIn URL only)

**Status:** ⚠️ Exists but Not Used (50%)

**Current State:**
- Resume upload page exists at `/assessments/resume/[jobId]/page.tsx`
- Full implementation with file upload, validation, progress tracking
- **BUT:** Not linked in main assessment flow
- Users go directly to quiz, not resume upload

**Evidence:**
```typescript
// File: src/app/(main)/assessments/resume/[jobId]/page.tsx
// Full resume upload implementation with:
- File validation (PDF, DOC, DOCX, 5MB limit)
- Upload progress simulation
- LLM processing simulation
- Error handling
```

**Assessment Flow:**
1. Job details page → "Take Assessment" button
2. Goes to `/assessments/[id]/intro` (intro page)
3. Then to `/assessments/quiz/[quizId]` (quiz)
4. Resume upload page is orphaned

**What's Needed:**
1. **Option A:** Remove resume upload entirely (if LinkedIn-only)
2. **Option B:** Add resume upload as alternative path before quiz
3. **Option C:** Replace resume with LinkedIn URL input

**Recommendation:** 
Clarify requirement - should resume upload be:
- Removed completely?
- Replaced with LinkedIn URL?
- Kept as alternative to quiz?

---

## ✅ ASSESS-321: Auto-Share After Consent Enabled

**Status:** ✅ Complete (100%)

**Evidence:**
```typescript
// File: src/lib/services/auto-invite.ts (Line 117-120)
/**
 * Main function: Process assessment completion and auto-invite if qualified
 */
export async function processAssessmentCompletion(
  assessmentId: string
```

```typescript
// File: src/app/api/assessments/analyze/route.ts (Line 232-235)
const visibilityThreshold = assessment.job?.visibility_threshold_pct || 85;

if (readinessPct >= visibilityThreshold) {
  console.log(`🎯 Proficiency ${readinessPct}% meets threshold ${visibilityThreshold}% - creating auto-invite...`);
```

**Implementation:**
- Auto-invite service checks user consent via `checkUserConsent()`
- Creates employer invitation when proficiency ≥ visibility threshold
- Respects user's `agreed_to_terms` (implicit consent)
- Called from assessment results page after analysis

**Verified:** October 21, 2025 - Working end-to-end

**Status in Roadmap:** Marked as incomplete but fully working

**Recommendation:** ✅ Mark as complete in roadmap

---

## ✅ ASSESS-320: Consent-Aware Prompt on Assessment Completion

**Status:** ✅ Complete (100%)

**Evidence:**
```typescript
// File: src/components/settings/consent-toggle-dialog.tsx
export function ConsentToggleDialog({
  open,
  onOpenChange,
  action,
  invitationCount = 0,
  onConfirm
}: ConsentToggleDialogProps)
```

```typescript
// File: src/components/settings/profile-tab.tsx (Line 67-75)
// Handle consent toggle with confirmation dialog
const handleConsentToggle = async (checked: boolean) => {
  const currentValue = formData.visible_to_employers
  
  // If toggling, show confirmation dialog
  if (checked !== currentValue) {
    setPendingConsentValue(checked)
    setShowConsentDialog(true)
  }
}
```

**Implementation:**
- Consent toggle in user settings (Profile tab)
- Confirmation dialog when enabling/disabling
- Shows count of invitations that will be affected
- Withdraws invitations when consent revoked
- Backfills invitations when consent granted

**Services:**
- `withdrawAllInvitations()` - Sets invitations to 'withdrawn' status
- `backfillQualifyingInvitations()` - Creates invitations for past assessments
- `getActiveInvitationsCount()` - Shows impact before toggle

**Database Migration:**
- `20251021000002_add_withdrawn_status.sql` - Adds 'withdrawn' status

**Status in Roadmap:** Marked as incomplete but fully implemented

**Recommendation:** ✅ Mark as complete in roadmap

---

## ✅ ASSESS-310: Retake Cooldown (24-hour limit)

**Status:** ✅ Complete (100%)

**Evidence:**
```typescript
// File: src/app/(main)/my-assessments/page.tsx (Line 250-256)
// Cooldown logic
const analyzedAt = new Date(assessment.analyzed_at || assessment.created_at)
const now = new Date()
const hoursSinceAnalysis = (now.getTime() - analyzedAt.getTime()) / (1000 * 60 * 60)
const hoursRemaining = Math.max(0, 24 - hoursSinceAnalysis)
const isOnCooldown = hoursRemaining > 0
const isRoleReady = assessment.status_tag === 'role_ready'
```

```typescript
// File: src/app/(main)/my-assessments/page.tsx (Line 308-320)
) : isOnCooldown ? (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="flex-1">
        <Button variant="outline" size="sm" className="w-full" disabled>
          Retake in {Math.ceil(hoursRemaining)}h
        </Button>
      </span>
    </TooltipTrigger>
    <TooltipContent className="max-w-[200px]">
      <p>Assessments can only be taken once every 24 hours. Come back in {Math.ceil(hoursRemaining)} hours.</p>
    </TooltipContent>
  </Tooltip>
```

**Implementation:**
- Calculates time since last assessment completion
- Disables "Retake" button during cooldown
- Shows countdown timer ("Retake in Xh")
- Tooltip explains cooldown policy
- Role-ready users see "View Invites" instead

**Completed:** October 21, 2025 as part of My Assessments Phase 3K

**Status in Roadmap:** Marked as incomplete but fully implemented

**Recommendation:** ✅ Mark as complete in roadmap

---

## ⚠️ EMPLOYER-603: Set Invite Threshold (Auto-Invite Score)

**Status:** ⚠️ Backend Complete, UI Placeholder (75%)

**Backend Evidence:**
```typescript
// File: src/app/api/assessments/analyze/route.ts (Line 232)
const visibilityThreshold = assessment.job?.visibility_threshold_pct || 85;
```

```typescript
// File: src/app/(main)/employer/roles/[id]/page.tsx (Line 17-18)
interface Job {
  required_proficiency_pct: number
  visibility_threshold_pct: number
```

**Database:**
- ✅ `jobs.visibility_threshold_pct` column exists
- ✅ Auto-invite system reads this field
- ✅ Creates invitation when `readiness_pct >= visibility_threshold_pct`

**UI Status:**
```typescript
// File: src/app/(main)/employer/roles/[id]/page.tsx (Line 107-135)
{/* Edit/Manage Form Placeholder */}
<div className="bg-white rounded-lg border border-gray-200 p-12">
  <div className="text-center">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Edit/ Manage Individual Featured Role
    </h3>
    <p className="text-gray-600 mb-4">
      Place all edit options a company can use to edit and manage a selected role
    </p>
    <ul className="text-sm text-gray-500 space-y-1 text-left max-w-md mx-auto">
      <li>• required proficiency</li>
      <li>• proficiency threshold for invites (ex. show ≥84% in invites list)</li>
      <li>• Job Application URL</li>
      ...
    </ul>
  </div>
</div>
```

**What's Complete:**
- ✅ Database field exists
- ✅ Backend reads and uses the field
- ✅ Auto-invite system working
- ✅ Field is in Job interface

**What's Missing:**
- ❌ Actual form UI to edit the field
- ❌ Input validation
- ❌ Save functionality
- ❌ Current value display

**What's Needed:**
1. Replace placeholder with actual form
2. Add number input for `visibility_threshold_pct` (0-100)
3. Add save handler to update database
4. Show current value
5. Add validation (must be ≤ required_proficiency_pct)

**Status in Roadmap:** Marked "VERIFY COMPLETE" but UI is placeholder

**Recommendation:** 
- ⚠️ Mark as "Backend Complete, UI Pending"
- Create new story: **EMPLOYER-603-UI**: Build Role Editor Form

---

## 📋 Recommendations

### Immediate Actions:
1. **Update Roadmap Status:**
   - ✅ Mark ASSESS-301 (Timeline), ASSESS-321, ASSESS-320, ASSESS-310 as complete
   - ⚠️ Clarify ASSESS-301 (Resume) - remove or implement?
   - ⚠️ Update EMPLOYER-603 status to "Backend Complete, UI Pending"

2. **Create New Stories:**
   - **EMPLOYER-603-UI**: Build Role Editor Form UI
   - **OCC-402**: Implement occupation details with related roles
   - **OCC-403**: Implement occupation-program crosswalk

3. **Documentation Updates:**
   - Update SPRINT_ROADMAP.md with corrected statuses
   - Document resume upload decision (keep/remove/replace)

### Priority Order:
1. **High:** EMPLOYER-603-UI (complete the role editor)
2. **High:** OCC-402 (occupation details page)
3. **Medium:** OCC-403 (program crosswalk)
4. **Low:** ASSESS-301 (resume) - pending decision

---

## 📊 Completion Summary

**Stories Reviewed:** 8 (counting ASSESS-301 twice)

**Status Breakdown:**
- ✅ Complete: 4 stories (50%)
- ⚠️ Partial: 2 stories (25%)
- ❌ Not Started: 2 stories (25%)

**Actual Completion vs Roadmap:**
- 4 stories marked incomplete are actually complete
- 1 story marked "verify complete" is only 75% done
- 2 stories correctly marked as not started

**Recommendation:** Update roadmap to reflect actual status for better tracking.
