# Employer Invitation System - Detailed Specification

**Branch:** `feature/employer-invitations`  
**Duration:** 3-4 days  
**Priority:** HIGH - Core marketplace feature  
**Dependencies:** Multi-role auth, user account settings  
**Status:** Awaiting mockups and decision on flow

---

## 🎯 Objective

Enable employers to discover qualified candidates and invite them to apply for roles, creating a direct pipeline from assessment to employment.

---

## Flow Decision Required

### Option A: User-Initiated Submission
**Flow:**
1. User completes assessment
2. If score >= threshold, "Submit to Employer" button appears
3. User clicks to submit assessment to employer
4. Employer sees submission in dashboard
5. Employer reviews and sends invitation
6. User receives invitation notification

**Pros:**
- User has explicit control
- Clear consent
- User chooses which assessments to share

**Cons:**
- Extra friction (user must take action)
- Fewer candidates visible to employers
- Users might not know to submit

---

### Option B: Auto-Visible with Opt-Out (RECOMMENDED)
**Flow:**
1. User completes assessment
2. If score >= threshold, automatically visible to employer
3. Employer browses qualified candidates
4. Employer sends invitation directly
5. User receives invitation notification

**With Privacy Control:**
- User setting: "Make my assessments visible to employers" (default: ON)
- User can opt-out globally or per-assessment
- Clear privacy messaging during assessment

**Pros:**
- Simpler user experience
- More candidates visible to employers
- Better marketplace liquidity
- User still has control via settings

**Cons:**
- Requires clear privacy messaging
- Need opt-out mechanism

**RECOMMENDATION:** Option B with privacy settings

---

## Proficiency Threshold Decision

### Option 1: Single Threshold (RECOMMENDED)
**Example:** 85%

- User sees "Role Ready" if score >= 85%
- Employer sees candidate if score >= 85%
- Employer sets threshold per role
- Simple, clear, no confusion

### Option 2: Dual Threshold
**Example:** Display 90%, Visibility 85%

- User sees "Role Ready" if score >= 90%
- Employer sees candidate if score >= 85%
- Allows employers to see "close" candidates
- More complex, potentially confusing

**RECOMMENDATION:** Single threshold (85% default, employer configurable)

---

## Database Schema

### Employer Invitations Table

```sql
CREATE TABLE employer_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  application_url TEXT NOT NULL,
  message TEXT,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'applied', 'declined', 'archived')),
  sent_at TIMESTAMP DEFAULT NOW(),
  viewed_at TIMESTAMP,
  responded_at TIMESTAMP,
  response_type VARCHAR CHECK (response_type IN ('applied', 'declined')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employer_invitations_candidate ON employer_invitations(candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_employer_invitations_employer ON employer_invitations(employer_id, job_id);
CREATE INDEX IF NOT EXISTS idx_employer_invitations_status ON employer_invitations(status);

-- Prevent duplicate invitations
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_invitation 
ON employer_invitations(employer_id, candidate_id, job_id, assessment_id)
WHERE status NOT IN ('declined', 'archived');
```

### Jobs Table Updates

```sql
-- Add proficiency threshold to jobs
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS proficiency_threshold INTEGER DEFAULT 85 CHECK (proficiency_threshold BETWEEN 0 AND 100);
```

### Profiles Table Updates

```sql
-- Add privacy setting
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS visible_to_employers BOOLEAN DEFAULT true;
```

### Assessment Submissions (If Using Option A)

```sql
CREATE TABLE assessment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'invited', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_job ON assessment_submissions(job_id, status);
```

---

## API Endpoints

### Get Qualified Candidates (Employer)

**GET** `/api/employer/candidates?job_id=xxx`

**Auth:** Employer Admin only

**Query Params:**
- `job_id` (optional) - Filter by specific role
- `min_score` (optional) - Override threshold
- `sort` (optional) - 'score_desc', 'date_desc'
- `limit` (optional) - Default 50

**Response:**
```typescript
{
  candidates: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    linkedin_url: string;
    avatar_url: string;
    assessment: {
      id: string;
      score: number;
      completed_at: string;
      skill_breakdown: Array<{
        skill_name: string;
        score: number;
        importance: string;
      }>;
    };
    job: {
      id: string;
      title: string;
      proficiency_threshold: number;
    };
    already_invited: boolean;
  }>;
  total: number;
}
```

**Logic:**
1. Verify requester is employer_admin
2. Get employer's company_id
3. Query assessments for company's jobs
4. Filter: score >= proficiency_threshold
5. Filter: user.visible_to_employers = true
6. Join with profiles (name, LinkedIn, avatar)
7. Check if already invited
8. Return sorted results

---

### Send Invitation (Employer)

**POST** `/api/employer/invitations`

**Auth:** Employer Admin only

**Request:**
```typescript
{
  candidate_id: string;
  job_id: string;
  assessment_id: string;
  application_url: string;
  message?: string;
}
```

**Response:**
```typescript
{
  invitation: {
    id: string;
    status: string;
    sent_at: string;
  };
  notification_created: boolean;
}
```

**Logic:**
1. Verify requester is employer_admin
2. Verify job belongs to employer's company
3. Verify candidate meets proficiency threshold
4. Check for duplicate invitation
5. Create invitation record
6. Create notification for candidate
7. Send email to candidate (optional)
8. Return invitation details

---

### Get My Invitations (Candidate)

**GET** `/api/user/invitations?status=active`

**Auth:** Authenticated user

**Query Params:**
- `status` - 'active' (pending, viewed) or 'archived' (applied, declined, archived)

**Response:**
```typescript
{
  invitations: Array<{
    id: string;
    company: {
      name: string;
      logo_url: string;
    };
    job: {
      title: string;
      soc_code: string;
    };
    assessment: {
      score: number;
      completed_at: string;
    };
    application_url: string;
    message: string;
    sent_at: string;
    viewed_at: string;
    status: string;
  }>;
  unread_count: number;
}
```

---

### Update Invitation Status (Candidate)

**PATCH** `/api/user/invitations/:id`

**Auth:** Authenticated user (must be candidate)

**Request:**
```typescript
{
  status: 'viewed' | 'applied' | 'declined' | 'archived';
  response_type?: 'applied' | 'declined'; // If status is applied/declined
}
```

**Response:**
```typescript
{
  invitation: {
    id: string;
    status: string;
    responded_at: string;
  }
}
```

---

## Frontend Components

### Employer Dashboard - Qualified Candidates

**Component:** `QualifiedCandidatesTable.tsx`

**Features:**
- Table with sortable columns
- Filter by role dropdown
- Search by name
- Score badge (color-coded: 85-89% yellow, 90-94% blue, 95%+ green)
- "Already Invited" badge if invitation sent
- Actions dropdown: View Profile, Send Invitation

**Columns:**
- Avatar + Name
- Role Applied For
- Score (with badge)
- Assessment Date
- Skills Breakdown (expandable)
- Status (Available / Invited)
- Actions

**Empty State:**
- "No qualified candidates yet"
- "Candidates will appear here when they complete assessments and meet your proficiency threshold"

---

### Employer - Send Invitation Modal

**Component:** `SendInvitationModal.tsx`

**Trigger:** Click "Send Invitation" on candidate

**Content:**
- Candidate summary (name, score, role)
- Application URL (required, validated)
- Custom message (optional, textarea, 500 char max)
- Preview of email that will be sent

**Actions:**
- Send Invitation (primary)
- Cancel (secondary)

**Validation:**
- Application URL must be valid URL
- Message max 500 characters

**Success:**
- Toast: "Invitation sent to [Name]"
- Close modal
- Update table (show "Invited" badge)

---

### User - Assessment Results CTA

**Component:** Update existing results page

**If score >= threshold:**
- Show badge: "You're qualified for this role!"
- Display: "Employers can see your results and may send you invitations to apply"
- Privacy link: "Manage visibility settings"

**If score < threshold:**
- Show: "Keep building your skills to become visible to employers"
- Display threshold: "Employers look for candidates with 85%+ proficiency"

---

## User Privacy Settings

**Location:** `/settings` (Account Settings page)

**Section:** Privacy & Visibility

**Setting:**
- Toggle: "Make my assessment results visible to employers"
- Default: ON
- Description: "When enabled, employers can see your assessment results if you meet their proficiency threshold. You can change this anytime."

**Impact:**
- If OFF: User never appears in employer candidate lists
- If ON: User appears when score >= threshold

---

## Mockup Requirements

**REQUIRED BEFORE BUILDING:**

1. **Employer Dashboard - Qualified Candidates Table**
   - Table layout and columns
   - Score badges (color coding)
   - Filter and search UI
   - Actions dropdown
   - Empty state
   - Mobile responsive

2. **Employer - Send Invitation Modal**
   - Modal layout
   - Form fields
   - Preview section
   - Success state

3. **User - Assessment Results CTA**
   - Qualified badge design
   - Visibility messaging
   - Privacy link placement

4. **User - Privacy Settings**
   - Toggle design
   - Description text
   - Impact explanation

5. **Invitation Email Template**
   - HTML email design
   - Branding
   - CTA button
   - Mobile responsive

---

## Success Criteria

- [ ] Employer can view qualified candidates (>= threshold)
- [ ] Employer can filter and search candidates
- [ ] Employer can send invitations with application URL
- [ ] Candidate receives invitation (notification + email)
- [ ] Candidate can view invitation details
- [ ] Privacy setting works (opt-out respected)
- [ ] No duplicate invitations
- [ ] Score badges display correctly
- [ ] Mobile responsive
- [ ] All RLS policies secure

---

## Integration Points

### With Assessment Engine
- Query assessments with `overall_score_pct >= proficiency_threshold`
- Join with job_id to get role information
- Filter by company_id for employer scope

### With Notification Center
- Create notification when invitation sent
- Link notification to invitation record
- Update unread count in header

### With User Settings
- Check `visible_to_employers` flag
- Respect privacy setting in candidate queries
- Show privacy controls in settings

---

*This specification provides complete implementation details for the employer invitation system. Consult this document throughout development.*
