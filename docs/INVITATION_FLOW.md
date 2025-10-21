# Invitation Flow - Definitive Documentation

## Overview

This document describes the **definitive, automated invitation flow** in SkillSync. When users complete assessments, qualified candidates are automatically added to employer invite queues.

## Complete Flow

```
User Takes Assessment
        ↓
Assessment Completed
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

## Qualification Criteria

### Must Meet ALL:
1. **Proficiency Threshold**
   - `assessment.readiness_pct >= job.required_proficiency_pct`
   - Example: 95% readiness ≥ 90% required = ✅ Qualified

2. **User Consent**
   - `profile.agreed_to_terms = true`
   - Implicit consent via terms acceptance
   - Future: Explicit consent option

3. **No Duplicate**
   - Not already in invite queue for this role
   - Checks `invitations` table for existing record

## Database Schema

### Invitations Table
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  job_id UUID REFERENCES jobs(id),
  company_id UUID REFERENCES companies(id),
  status TEXT, -- 'pending', 'accepted', 'declined'
  source TEXT, -- 'auto_qualified', 'manual'
  readiness_score NUMERIC, -- User's assessment score
  created_at TIMESTAMP
)
```

## User Experience

### For Candidates

**Qualified (≥ threshold):**
1. Complete assessment
2. See results page
3. Toast appears: "Assessment Results Shared with BayCare"
4. Console log: "✅ Added to BayCare's invite queue (95% readiness)"
5. Wait for employer to send invitation

**Not Qualified (< threshold):**
1. Complete assessment
2. See results page
3. Toast appears: "Assessment Results Shared with Power Design"
4. Console log: "ℹ️ Results shared with Power Design (63% < 90% threshold)"
5. See gap-filling programs to improve

### For Employers

**In Invite Queue:**
1. Log into employer dashboard
2. Navigate to Invitations
3. See qualified candidates:
   - Name
   - Role applied for
   - Readiness score (e.g., 95%)
   - Assessment date
4. Review candidate details
5. Send invitation to interview

## Code Implementation

### Service: `auto-invite.ts`

**Main Function:**
```typescript
processAssessmentCompletion(assessmentId: string)
```

**Returns:**
```typescript
{
  qualified: boolean,      // Met threshold?
  invited: boolean,        // Added to queue?
  shared: boolean,         // Results shared?
  companyName: string,     // Company name
  readinessPct: number,    // User's score
  requiredPct: number,     // Required score
  message: string          // Status message
}
```

### Integration: `results/page.tsx`

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

## Related Files

- `/src/lib/services/auto-invite.ts` - Auto-invite service
- `/src/app/(main)/assessments/[id]/results/page.tsx` - Results page integration
- `/src/lib/services/employer-invitations.ts` - Employer dashboard
- `/docs/CROSSWALK_IMPLEMENTATION_PLAN.md` - Assessment system

## Summary

This is the **definitive invitation flow**:
1. ✅ Fully automated
2. ✅ Threshold-based qualification
3. ✅ Consent-respecting
4. ✅ Duplicate-preventing
5. ✅ User-notifying
6. ✅ Employer-enabling

**No manual intervention required.** The system automatically connects qualified candidates with employers.
