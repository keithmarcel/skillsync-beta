# Auto-Invite System - Complete Documentation

**Feature:** Automatic Employer Invitation Queue Population + Consent Management  
**Date:** October 21, 2025 (Updated 2:35 PM)  
**Status:** ✅ Production Ready (SYSTEM-INFRA-905 Complete)  
**Branch:** `feature/my-assessments-complete-phase-3k`

---

## Overview

The Auto-Invite System automatically adds qualified candidates to employer invitation queues when they complete assessments and meet proficiency thresholds. It includes comprehensive consent management, allowing users to control when their results are shared and automatically handling invitation withdrawal/backfill when consent changes.

### What It Does
- **Automatically qualifies candidates** based on assessment scores
- **Adds to employer queue** when threshold is met
- **Notifies users** via toast when results are shared
- **Respects consent** - only shares if user agreed to terms
- **Prevents duplicates** - won't add same candidate twice
- **Tracks readiness** - stores actual proficiency score
- **✨ NEW: Consent toggle** - withdraws/backfills invitations when consent changes
- **✨ NEW: Confirmation dialogs** - explains impact before consent changes
- **✨ NEW: Withdrawn status** - tracks revoked consent invitations

---

## How It Works

### The Flow

```
User Completes Assessment
        ↓
Results Page Loads
        ↓
Auto-Invite System Activates
        ↓
┌─────────────────────────────────────┐
│ 1. Check Proficiency Threshold     │
│    readiness_pct >= required_pct?  │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 2. Check User Consent               │
│    agreed_to_terms = true?          │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 3. Check for Duplicate              │
│    Already invited to this role?    │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 4. Add to Invitations Table         │
│    - user_id                        │
│    - job_id                         │
│    - company_id                     │
│    - status: 'pending'              │
│    - source: 'auto_qualified'       │
│    - readiness_score: XX%           │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ 5. Show Toast to User               │
│    "Results shared with [Company]"  │
└─────────────────────────────────────┘
        ↓
Employer Sees Candidate in Queue
```

---

## Implementation

### Core Service

**File:** `src/lib/services/auto-invite.ts`

**Main Function:**
```typescript
processAssessmentCompletion(assessmentId: string): Promise<{
  qualified: boolean,      // Met threshold?
  invited: boolean,        // Added to queue?
  shared: boolean,         // Results shared?
  companyName: string,     // Company name
  readinessPct: number,    // User's score
  requiredPct: number,     // Required score
  message: string          // Status message
}>
```

**Helper Functions:**
- `checkUserConsent(userId)` - Verify user agreed to terms
- `hasExistingInvitation(userId, jobId)` - Check for duplicates
- `addToInviteQueue(...)` - Create invitation record

### Integration

**File:** `src/app/(main)/assessments/[id]/results/page.tsx`

**Called on page load:**
```typescript
const inviteResult = await processAssessmentCompletion(assessmentId)

if (inviteResult.shared && inviteResult.companyName) {
  toast({
    title: "Assessment Results Shared",
    description: `Your assessment results have been shared with ${inviteResult.companyName}.`
  })
}
```

**Toast Behavior:**
- Shows **once** per assessment (tracked in sessionStorage)
- Only on first visit after assessment completion
- Doesn't spam on page refresh
- Clears when browser session ends

---

## Qualification Criteria

### Must Meet ALL Three:

**1. Proficiency Threshold**
```typescript
assessment.readiness_pct >= job.required_proficiency_pct
```
- Example: 95% readiness ≥ 90% required = ✅ Qualified
- Example: 85% readiness < 90% required = ❌ Not qualified

**2. User Consent**
```typescript
profile.agreed_to_terms = true
```
- Implicit consent via terms acceptance
- Future: Explicit consent option per company
- No sharing without consent

**3. No Duplicate**
```typescript
!hasExistingInvitation(userId, jobId)
```
- Checks `invitations` table
- Prevents multiple invites for same role
- User can only be invited once

---

## Database Schema

### Invitations Table

```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  job_id UUID REFERENCES jobs(id),
  company_id UUID REFERENCES companies(id),
  status TEXT,              -- 'pending', 'accepted', 'declined'
  source TEXT,              -- 'auto_qualified', 'manual'
  readiness_score NUMERIC,  -- User's assessment score
  created_at TIMESTAMP
);
```

**Key Fields:**
- `source: 'auto_qualified'` - Identifies auto-generated invites
- `readiness_score` - Stores actual proficiency percentage
- `status: 'pending'` - Initial state, employer can review

---

## User Experience

### For Candidates

**Scenario 1: Qualified (≥ threshold)**
1. Complete assessment
2. See results page
3. Toast appears: "Assessment Results Shared with BayCare"
4. Console log: "✅ Added to BayCare's invite queue (95% readiness)"
5. Wait for employer to send invitation

**Scenario 2: Not Qualified (< threshold)**
1. Complete assessment
2. See results page
3. Toast appears: "Assessment Results Shared with Power Design"
4. Console log: "ℹ️ Results shared with Power Design (63% < 90% threshold)"
5. See gap-filling programs to improve
6. Can retake assessment after training

**Scenario 3: Already Invited**
1. Complete assessment again
2. See results page
3. Toast appears: "Assessment Results Shared with BayCare"
4. Console log: "ℹ️ Qualified but already invited to BayCare"
5. Not added again (prevents duplicates)

### For Employers

**In Invite Queue:**
1. Log into employer dashboard
2. Navigate to Invitations/Candidates
3. See qualified candidates:
   - Name
   - Role applied for
   - Readiness score (e.g., 95%)
   - Assessment date
   - Source: "Auto-qualified"
4. Review candidate details
5. Send invitation to interview

---

## Examples

### Example 1: Qualified Candidate

**Scenario:**
- User: Keith Woods
- Role: Surgical Technologist (BayCare)
- Required: 90%
- Score: 96%
- Consent: Yes

**Result:**
```
✅ Qualified: 96% ≥ 90%
✅ Consent: agreed_to_terms = true
✅ No Duplicate: First time applying
→ Added to BayCare's invite queue
→ Toast: "Assessment Results Shared with BayCare"
→ BayCare sees Keith in their dashboard
```

### Example 2: Not Qualified

**Scenario:**
- User: Jane Smith
- Role: Senior Financial Analyst (TD SYNNEX)
- Required: 85%
- Score: 61%
- Consent: Yes

**Result:**
```
❌ Not Qualified: 61% < 85%
✅ Consent: agreed_to_terms = true
→ NOT added to invite queue
→ Toast: "Assessment Results Shared with TD SYNNEX"
→ Shows gap-filling programs
→ Can retake assessment after training
```

### Example 3: Already Invited

**Scenario:**
- User: Bob Johnson
- Role: Mechanical Project Manager (Power Design)
- Required: 90%
- Score: 94%
- Consent: Yes
- Previous: Already in queue

**Result:**
```
✅ Qualified: 94% ≥ 90%
✅ Consent: agreed_to_terms = true
❌ Duplicate: Already invited
→ NOT added again (prevents duplicates)
→ Toast: "Assessment Results Shared with Power Design"
→ Power Design already sees Bob
```

---

## Business Logic

### Automatic (No Manual Intervention)
- ✅ System automatically qualifies candidates
- ✅ System automatically adds to invite queue
- ✅ System automatically notifies user
- ❌ No manual review needed
- ❌ No admin approval required

### Threshold-Based
- Each role sets `required_proficiency_pct`
- Example: Surgical Tech = 90%
- Example: Financial Analyst = 85%
- Example: Property Manager = 75%
- Flexible per role

### Consent-Based
- Respects user privacy
- Only shares if user agreed to terms
- Future: Granular consent options
- Users control their data

---

## Configuration

### Per-Role Thresholds

**Set in database:**
```sql
UPDATE jobs 
SET required_proficiency_pct = 90 
WHERE id = 'surgical-tech-id';
```

**Common Thresholds:**
- Entry-level roles: 70-75%
- Mid-level roles: 75-85%
- Senior roles: 85-90%
- Specialized roles: 90-95%

### Consent Settings

**Current:** Implicit consent via `agreed_to_terms`

**Future Options:**
- Explicit consent per company
- Granular privacy controls
- Opt-in/opt-out per role
- Consent expiration

---

## Monitoring

### Success Metrics

**Track:**
- Qualification rate (% of assessments that qualify)
- Invitation rate (% of qualified that get invited)
- Duplicate prevention rate
- Employer engagement rate

**Query:**
```sql
-- Qualification rate
SELECT 
  COUNT(*) FILTER (WHERE readiness_pct >= required_proficiency_pct) * 100.0 / COUNT(*) as qualification_rate
FROM assessments a
JOIN jobs j ON j.id = a.job_id;

-- Invitation rate
SELECT 
  COUNT(DISTINCT i.user_id) * 100.0 / COUNT(DISTINCT a.user_id) as invitation_rate
FROM assessments a
LEFT JOIN invitations i ON i.user_id = a.user_id AND i.job_id = a.job_id
WHERE a.readiness_pct >= (SELECT required_proficiency_pct FROM jobs WHERE id = a.job_id);
```

### Error Tracking

**Monitor:**
- Failed consent checks
- Duplicate invitation attempts
- Database insertion errors
- Toast notification failures

**Logs:**
```typescript
console.log(`✅ Added to ${companyName}'s invite queue (${readinessPct}% readiness)`)
console.log(`ℹ️ Qualified but already invited to ${companyName}`)
console.log(`ℹ️ Results shared with ${companyName} (${readinessPct}% < ${requiredPct}% threshold)`)
```

---

## Testing

### Automated Tests

**Test Scenarios:**
1. Qualified candidate → Added to queue
2. Not qualified → Not added
3. Already invited → Not added again
4. No consent → Not shared
5. Missing data → Graceful failure

**Run Tests:**
```bash
# Test auto-invite logic
node -e "
const { processAssessmentCompletion } = require('./src/lib/services/auto-invite');
processAssessmentCompletion('test-assessment-id').then(console.log);
"
```

### Manual Testing

**Test Flow:**
1. Create assessment for a role
2. Set required_proficiency_pct (e.g., 90%)
3. Complete assessment with high score (e.g., 95%)
4. View results page
5. Verify toast appears
6. Check invitations table for new record
7. Verify employer sees candidate

---

## Deployment Checklist

### Pre-Deployment
- [x] Service implemented and tested
- [x] Integration with results page complete
- [x] Toast notifications working
- [x] Consent checking implemented
- [x] Duplicate prevention working
- [x] Documentation complete

### Deployment Steps
1. **Deploy code** to production
2. **Verify** invitations table exists
3. **Test** with sample assessment
4. **Monitor** for 24 hours
5. **Gather feedback** from employers

### Post-Deployment
- [ ] Monitor invitation creation rate
- [ ] Track employer engagement
- [ ] Gather candidate feedback
- [ ] Plan consent enhancements

---

## Future Enhancements

### Planned Features
1. **Explicit Consent**
   - Separate consent for each company
   - Granular privacy controls
   - Opt-in/opt-out per role

2. **Expiration**
   - Invitations expire after 30 days
   - Candidates can retake assessments
   - Fresh scores replace old ones

3. **Notifications**
   - Email to employer when candidate added
   - Email to candidate when invited
   - In-app notification system

4. **Analytics**
   - Track conversion rates
   - Monitor qualification rates
   - Employer engagement metrics

5. **Smart Matching**
   - ML-based candidate ranking
   - Predictive success scoring
   - Cultural fit analysis

---

## Troubleshooting

### Issue: Candidate not added to queue

**Check:**
1. Score meets threshold? `readiness_pct >= required_proficiency_pct`
2. User has consent? `agreed_to_terms = true`
3. Not already invited? Check `invitations` table
4. Job has company? `job.company_id` exists

**Fix:**
- Adjust threshold if too high
- Ensure user agreed to terms
- Check for existing invitation
- Verify job configuration

### Issue: Toast not showing

**Check:**
1. SessionStorage key exists? `assessment-toast-{id}`
2. Component has useToast hook?
3. Toast component mounted?

**Fix:**
- Clear sessionStorage to test again
- Verify toast provider in layout
- Check console for errors

---

## Consent Management System

**Added:** October 21, 2025 (SYSTEM-INFRA-905)

### Overview

Users can toggle consent in Profile Settings to control whether their assessment results are shared with employers. The system automatically handles invitation withdrawal and backfill based on consent changes.

### Consent Toggle OFF (Withdrawal)

**What Happens:**
1. User unchecks "Share assessment results" in settings
2. Confirmation dialog shows impact: "X invitations will be withdrawn"
3. User confirms action
4. All active invitations (`pending`, `sent`) → `withdrawn` status
5. Invitations archived with `archived_by: 'candidate'`
6. Employers no longer see candidate in their queue
7. Toast notification: "X invitations withdrawn"

**Implementation:**
```typescript
// src/lib/services/consent-management.ts
withdrawAllInvitations(userId: string): Promise<{
  success: boolean,
  count: number,
  error?: string
}>
```

### Consent Toggle ON (Backfill)

**What Happens:**
1. User checks "Share assessment results" in settings
2. Confirmation dialog explains: "Past assessments will be shared"
3. User confirms action
4. System finds all completed assessments
5. Filters for those meeting `visibility_threshold_pct`
6. Creates invitations for qualifying assessments (skips duplicates)
7. Toast notification: "X invitations created" or "You'll receive invitations..."

**Implementation:**
```typescript
// src/lib/services/consent-management.ts
backfillQualifyingInvitations(userId: string): Promise<{
  success: boolean,
  count: number,
  error?: string
}>
```

### Invitation Statuses

**Active Statuses:**
- `pending` - Invitation created, not yet sent
- `sent` - Invitation sent to candidate
- `applied` - Candidate applied to role
- `hired` - Candidate was hired

**Inactive Statuses:**
- `declined` - Candidate declined invitation
- `unqualified` - Candidate no longer meets threshold
- `archived` - Manually archived by employer
- `withdrawn` - **NEW** - User revoked consent

### Confirmation Dialogs

**Component:** `src/components/settings/consent-toggle-dialog.tsx`

**Disable Dialog Shows:**
- Count of active invitations that will be withdrawn
- Impact on employer visibility
- Note about existing applications
- Red "Stop Sharing" button

**Enable Dialog Shows:**
- Benefits of sharing results
- Explanation of backfill process
- User control messaging
- Teal "Enable Sharing" button

### Database Changes

**Migration:** `20251021000002_add_withdrawn_status.sql`

```sql
-- Added 'withdrawn' status to employer_invitations
ALTER TABLE employer_invitations 
ADD CONSTRAINT employer_invitations_status_check 
CHECK (status IN ('pending', 'sent', 'applied', 'declined', 
                  'hired', 'unqualified', 'archived', 'withdrawn'));
```

### Files Modified

**New Files:**
- `src/lib/services/consent-management.ts` - Consent toggle logic
- `src/components/settings/consent-toggle-dialog.tsx` - Confirmation UI
- `supabase/migrations/20251021000002_add_withdrawn_status.sql` - DB migration

**Updated Files:**
- `src/components/settings/profile-tab.tsx` - Integrated consent toggle handler

---

## Related Documentation

- `/docs/features/CIP_SOC_CROSSWALK_SYSTEM.md` - Program matching
- `/docs/features/EMPLOYER_INVITATIONS_SPEC.md` - Full invitation system
- `/docs/SKILLS_ARCHITECTURE_CHANGE.md` - Skills system
- `/docs/skill-sync-technical-architecture.md` - System architecture

---

## Changelog

**October 21, 2025 - v2.0 (SYSTEM-INFRA-905 Complete)**
- ✅ Added consent toggle with confirmation dialogs
- ✅ Implemented invitation withdrawal on consent OFF
- ✅ Implemented invitation backfill on consent ON
- ✅ Added `withdrawn` status to database
- ✅ Created consent management service
- ✅ Updated documentation

**October 21, 2025 - v1.0 (Production)**
- ✅ Created auto-invite service
- ✅ Integrated with assessment results
- ✅ Added toast notifications
- ✅ Implemented consent checking
- ✅ Added duplicate prevention
- ✅ Complete documentation

---

**Status: Production Ready** ✅

This system is complete, tested, and ready for production deployment. Qualified candidates are automatically connected to employers, with full user control over consent and data sharing.
