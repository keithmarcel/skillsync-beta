# Pre-Assessment Feature Roadmap
## Features to Complete Before Assessment Testing

**Created:** October 2, 2025 - 3:53 AM  
**Status:** Planning Phase - Awaiting Mockups  
**Priority:** High - Complete before assessment UI work

---

## 🎯 Overview

This document outlines 7 major features to implement before returning to assessment testing and UI integration. Each feature has detailed requirements, mockup dependencies, and implementation guidelines.

---

## Feature 1: Multi-Role User Management System

**Branch:** `feature/multi-role-user-auth`

### User Types

**1. Basic User (Default)**
- General SkillSync user
- Access to: Browse jobs, take assessments, view programs, manage profile
- No admin access

**2. Super Admin**
- Current: keith-woods@bisk.com
- Access to: All admin tools, full platform control
- Can manage all entities (users, companies, providers, programs, roles)
- Can invite Provider Admins and Employer Admins

**3. Provider Admin**
- Education provider representative
- Access to: Provider dashboard (limited admin view)
- Can manage: Their programs only
- Limits: Max programs (configurable), max featured programs
- Must be invited by Super Admin

**4. Employer Admin**
- Company/employer representative  
- Access to: Employer dashboard (limited admin view)
- Can manage: Their featured roles, view qualified candidates
- Limits: Max featured roles (configurable)
- Must be invited by Super Admin

### Database Schema Requirements

```sql
-- Update profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user',
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id),
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_mock_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_programs INTEGER,
ADD COLUMN IF NOT EXISTS max_featured_programs INTEGER,
ADD COLUMN IF NOT EXISTS max_featured_roles INTEGER;

-- Role enum: 'user', 'super_admin', 'provider_admin', 'employer_admin'

-- Invitations table (for Super Admin to invite Provider/Employer admins)
CREATE TABLE admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role VARCHAR NOT NULL, -- 'provider_admin' or 'employer_admin'
  company_id UUID REFERENCES companies(id),
  school_id UUID REFERENCES schools(id),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP,
  status VARCHAR DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
  token TEXT UNIQUE NOT NULL
);
```

### Implementation Requirements

**Super Admin Invitation Flow:**
1. New page: `/admin/invitations` or section in Users page
2. Form to invite Provider Admin or Employer Admin
3. Fields: Email, Role Type, Associated Company/School, Limits
4. Generates unique invitation token
5. Sends email with signup link
6. Link includes token for automatic role assignment

**Provider Admin Dashboard:**
- URL: `/provider` or `/provider/dashboard`
- Pages: Programs (CRUD), Settings, Analytics (optional)
- Can only see/edit programs for their school_id
- Feature flag toggle for programs
- Limits enforced (max programs, max featured)

**Employer Admin Dashboard:**
- URL: `/employer` or `/employer/dashboard`  
- Pages: Roles (CRUD), Candidates (view qualified), Settings
- Can only see/edit roles for their company_id
- Proficiency threshold setting per role
- Limits enforced (max featured roles)

### Mockup Requirements

**REQUIRED BEFORE BUILDING:**
1. Provider Admin dashboard layout
2. Employer Admin dashboard layout
3. Invitation email template
4. Invitation acceptance flow
5. Limits enforcement UI (when max reached)

### Success Criteria

- [ ] All 4 user types working with proper permissions
- [ ] Super Admin can invite Provider/Employer admins
- [ ] Provider Admin can only manage their programs
- [ ] Employer Admin can only manage their roles
- [ ] Limits enforced on all accounts
- [ ] RLS policies properly scoped

---

## Feature 2: Employer Invitation System

**Branch:** `feature/employer-invitations`

### Overview

Allow employers to invite qualified candidates to apply for roles. Two possible flows to decide:

**Option A: User-Initiated Submission**
1. User completes assessment
2. If score meets threshold, "Submit to Employer" button appears
3. User submits assessment
4. Employer sees submission in dashboard
5. Employer sends invitation to apply
6. User receives invitation notification

**Option B: Employer-Initiated (Recommended)**
1. User completes assessment
2. If score meets proficiency threshold (e.g., 85%+), automatically visible to employer
3. Employer browses qualified candidates
4. Employer sends invitation to apply
5. User receives invitation notification

### Proficiency Threshold

**Question:** Single threshold or dual threshold?

**Option 1: Single Threshold (Simpler)**
- Employer sets one threshold (e.g., 85%)
- User sees "Role Ready" if >= 85%
- User shows in employer dashboard if >= 85%

**Option 2: Dual Threshold (More Nuanced)**
- Display threshold: 90% (user sees "Role Ready")
- Visibility threshold: 85% (employer can see candidate)
- Allows employers to see "close" candidates

**Recommendation Needed:** Which approach?

### Database Schema

```sql
-- Employer invitations to candidates
CREATE TABLE employer_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES profiles(id), -- employer_admin user
  candidate_id UUID REFERENCES profiles(id), -- basic user
  job_id UUID REFERENCES jobs(id), -- featured role
  assessment_id UUID REFERENCES assessments(id),
  application_url TEXT NOT NULL,
  message TEXT,
  status VARCHAR DEFAULT 'pending', -- 'pending', 'viewed', 'applied', 'declined', 'archived'
  sent_at TIMESTAMP DEFAULT NOW(),
  viewed_at TIMESTAMP,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add proficiency threshold to jobs
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS proficiency_threshold INTEGER DEFAULT 90;

-- Track user assessment submissions (if using Option A)
CREATE TABLE assessment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id),
  job_id UUID REFERENCES jobs(id),
  user_id UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR DEFAULT 'pending' -- 'pending', 'reviewed', 'invited'
);
```

### Implementation Requirements

**Employer Dashboard - Qualified Candidates View:**
- Table showing candidates who meet threshold
- Columns: Name, Score, Assessment Date, Skills Breakdown, Actions
- Filter by role
- Sort by score, date
- "Send Invitation" button per candidate

**Invitation Form:**
- Application URL (required)
- Custom message (optional)
- Preview before sending

**User Notification System:**
- Header icon with badge (unread count)
- Dropdown: Recent invitations (last 5)
- Actions: View Application, Mark Read, View All
- Full page: `/invitations` with Active/Archived tabs

**User Invitation Page:**
- Active invitations (pending, viewed)
- Archived invitations (applied, declined)
- Card layout with: Company logo, role title, score, message, actions
- Actions: View Application (external link), Decline, Archive

### Mockup Requirements

**REQUIRED BEFORE BUILDING:**
1. Employer dashboard - Qualified candidates table
2. Employer - Send invitation modal/form
3. User - Notification dropdown in header
4. User - Invitations page (active/archived tabs)
5. User - Invitation card component
6. Assessment results - "Submit to Employer" flow (if Option A)

### Success Criteria

- [ ] Employer can see qualified candidates (>= threshold)
- [ ] Employer can send invitations with application URL
- [ ] User receives notification (header badge)
- [ ] User can view/decline/archive invitations
- [ ] Invitation status tracked properly
- [ ] Email notifications sent (optional)

---

## Feature 3: User Account Settings

**Branch:** `feature/user-account-settings`

### Overview

Comprehensive user settings page accessible from avatar dropdown menu.

### Features

**1. Profile Information**
- First Name (required for employer invitations)
- Last Name (required for employer invitations)
- Email (display only, with "Change Email" link)
- LinkedIn URL (required for employer invitations)

**2. Avatar Management**
- Upload avatar image
- Supported formats: JPG, PNG, WebP
- Max file size: 2MB
- Image preview before upload
- Crop/resize tool (optional)
- Default avatar if none uploaded

**3. Notification Preferences**
- Email notifications toggle
- Types: Employer invitations, Program updates, Assessment reminders
- Frequency: Immediate, Daily digest, Weekly digest
- Unsubscribe from all option

**4. Account Management**
- Change email flow (with verification)
- Change password
- Delete account (with confirmation)
- Download data (GDPR compliance)

### Database Schema

```sql
-- Update profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Notification preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  email_enabled BOOLEAN DEFAULT true,
  employer_invitations BOOLEAN DEFAULT true,
  program_updates BOOLEAN DEFAULT true,
  assessment_reminders BOOLEAN DEFAULT true,
  frequency VARCHAR DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly'
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Implementation Requirements

**Settings Page:** `/settings` or `/account/settings`

**Sections:**
1. Profile (name, LinkedIn, avatar)
2. Email & Password (change flows)
3. Notifications (preferences)
4. Privacy & Data (download, delete)

**Avatar Upload:**
- Use Supabase Storage bucket: `avatars`
- Path: `{user_id}/avatar.{ext}`
- Client-side validation (size, format)
- Server-side processing (resize to 200x200)
- Update `profiles.avatar_url`

**Change Email Flow:**
1. User enters new email
2. Send verification to new email
3. User clicks link to confirm
4. Email updated in auth.users and profiles

### Mockup Requirements

**REQUIRED BEFORE BUILDING:**
1. Settings page layout (sections, navigation)
2. Avatar upload component (dropzone, preview, crop)
3. Notification preferences UI
4. Change email/password modals
5. Mobile responsive design

### Success Criteria

- [ ] User can update profile information
- [ ] Avatar upload works with size/format validation
- [ ] LinkedIn URL required for employer invitations
- [ ] Notification preferences saved and respected
- [ ] Change email flow works with verification
- [ ] Mobile responsive

---

## Feature 4: Mock User Generation System

**Branch:** `feature/mock-user-generation`

### Overview

Generate realistic mock users with avatars for demo purposes, with easy purge capability.

### Requirements

**Mock User Characteristics:**
- Realistic first/last names (diverse)
- Professional email addresses
- Avatar images (use placeholder service or AI-generated)
- Varied assessment scores (60-95%)
- Different roles/occupations assessed
- LinkedIn URLs (mock)
- Created dates spread over time

**Quantity:**
- 20-30 mock users
- Mix of proficiency levels
- Various occupations

### Database Schema

```sql
-- Already planned in profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_mock_user BOOLEAN DEFAULT false;

-- Easy purge query
DELETE FROM profiles WHERE is_mock_user = true;
```

### Implementation Approach

**Script:** `scripts/generate-mock-users.js`

**Data Sources:**
- Names: Use faker.js or similar library
- Avatars: Use https://i.pravatar.cc/ or UI Avatars API
- Emails: firstname.lastname@example.com pattern
- LinkedIn: linkedin.com/in/firstname-lastname (mock)

**Assessment Generation:**
- Create 1-3 assessments per mock user
- Vary scores: 60-95% range
- Different occupations
- Realistic completion dates

**Storage:**
- Avatars stored in Supabase Storage
- Flag: `is_mock_user = true`
- Easy to identify and purge

### Success Criteria

- [ ] 20-30 mock users created
- [ ] All have avatars
- [ ] Varied assessment scores
- [ ] Different occupations
- [ ] Easy to purge with single query
- [ ] Realistic for demos

---

## Feature 5: Homepage Snapshot Refactor

**Branch:** `feature/homepage-snapshot-redesign`

### Overview

Redesign the user homepage snapshot section to be more valuable and engaging with interactive graphs and dark theme elements.

### Current Issues

- Not seeing clear value
- Confusing layout
- Doesn't leverage available data effectively

### Goals

**Bring together all user data points:**
- Assessment history and scores
- Skill proficiency overview
- Recommended programs
- Employer invitations (if any)
- Learning progress
- Role readiness status

**Visual Enhancements:**
- Interactive graphs (Chart.js or Recharts)
- Dark theme sections for contrast
- Modern, engaging design
- Mobile responsive

### Mockup Requirements

**REQUIRED BEFORE BUILDING:**
1. Complete homepage snapshot redesign mockup
2. Graph/chart specifications (what data, what type)
3. Dark theme section designs
4. Mobile responsive layout
5. Data hierarchy and information architecture

### Implementation Considerations

**Data to Surface:**
- Recent assessments (last 3)
- Overall role readiness score
- Top skills (strengths)
- Skill gaps (areas to improve)
- Recommended programs (top 3)
- Pending invitations count
- Progress over time (line chart)

**Interactive Elements:**
- Skill radar chart (proficiency across skills)
- Progress timeline
- Quick actions (retake assessment, browse programs, view invitations)
- Collapsible sections

### Success Criteria

- [ ] Snapshot provides clear value at a glance
- [ ] All relevant user data surfaced
- [ ] Interactive graphs working
- [ ] Dark theme sections implemented
- [ ] Mobile responsive
- [ ] Matches approved mockup

---

## Feature 6: Program Details Page with RFI

**Branch:** `feature/program-details-page`

### Overview

Detailed program page with Request for Information (RFI) form, similar to company details pages.

### Features

**Program Information:**
- Program name, description
- School/provider information
- CIP code, credentials earned
- Duration, format (online/hybrid/in-person)
- Tuition/cost information
- Start dates

**Skills & Occupations:**
- Skills taught in program (from program_skills)
- Related occupations (via CIP→SOC mapping)
- Skill overlap visualization
- "This program prepares you for:" section

**RFI Form:**
- Name, Email, Phone
- Message/Questions
- Submit to provider
- Confirmation message
- Email notification to provider

**Call-to-Actions:**
- Request Information (RFI)
- Visit Program Website (external link)
- Compare Programs (future)
- Save to Favorites

### Database Schema

```sql
-- RFI submissions
CREATE TABLE program_rfi_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR DEFAULT 'new', -- 'new', 'contacted', 'enrolled', 'closed'
  provider_notified BOOLEAN DEFAULT false
);
```

### Implementation Requirements

**URL:** `/programs/[id]` or `/programs/[slug]`

**Sections:**
1. Hero (program name, school, CTA)
2. Overview (description, details)
3. Skills & Occupations (what you'll learn)
4. RFI Form (sticky sidebar or modal)
5. Related Programs (optional)

**Skills Overlap Visualization:**
- Show skills from program_skills table
- Group by category
- Link to related occupations
- "X skills prepare you for Y occupations"

### Mockup Requirements

**REQUIRED BEFORE BUILDING:**
1. Program details page layout
2. RFI form design (sidebar vs modal)
3. Skills/occupations section design
4. Mobile responsive layout

### Success Criteria

- [ ] Program details page displays all information
- [ ] Skills and occupations shown with overlap
- [ ] RFI form functional
- [ ] Email sent to provider on submission
- [ ] User receives confirmation
- [ ] Mobile responsive

---

## Feature 7: Skills Assessment Page UI Update

**Branch:** `feature/assessment-ui-redesign`

### Overview

UI improvements to the skills assessment taking experience.

### Current State

Assessment flow exists but needs UI polish and enhancements.

### Planned Improvements

(Details to be provided with mockup)

**Likely includes:**
- Better question navigation
- Progress indicator
- Time tracking display
- Question flagging/review
- Improved mobile experience
- Accessibility improvements

### Mockup Requirements

**REQUIRED BEFORE BUILDING:**
1. Assessment taking page redesign
2. Question navigation UI
3. Progress indicators
4. Review screen before submit
5. Mobile responsive design

### Success Criteria

- [ ] Matches approved mockup
- [ ] Improved UX over current version
- [ ] Mobile responsive
- [ ] Accessibility compliant

---

## Feature 8: Notification Center

**Branch:** `feature/notification-center`

### Overview

Header notification icon with dropdown and full invitations page.

### Features

**Header Icon:**
- Bell icon in header (next to avatar)
- Badge showing unread count
- Default state (no badge) when no notifications
- Dropdown on click

**Notification Dropdown:**
- Shows last 5 employer invitations
- Each item: Company logo, role title, "View Application" button
- "Mark All as Read" action
- "View All Invitations" link to full page

**Invitations Page:**
- URL: `/invitations`
- Only accessible via header icon
- Two tabs: Active, Archived
- Card layout for each invitation
- Invitation card: Company logo, role, score, message, date, actions
- Actions: View Application (external), Decline, Archive
- Reusable components with employer dashboard

### Database Schema

```sql
-- Notifications table (generic for future expansion)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type VARCHAR NOT NULL, -- 'employer_invitation', 'program_update', etc.
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  archived_at TIMESTAMP
);

-- Link notifications to employer invitations
ALTER TABLE employer_invitations
ADD COLUMN IF NOT EXISTS notification_id UUID REFERENCES notifications(id);
```

### Implementation Requirements

**Header Icon Component:**
- Real-time unread count
- Dropdown with recent invitations
- Mark as read functionality
- Link to full page

**Invitations Page:**
- Tab navigation (Active/Archived)
- Card grid layout
- Filter/sort options
- Bulk actions (mark all read, archive all)

**Reusable Components:**
- InvitationCard (used in dropdown and full page)
- Can be adapted for employer dashboard view
- Consistent styling and behavior

### Mockup Requirements

**REQUIRED BEFORE BUILDING:**
1. Header notification icon (default and with badge)
2. Notification dropdown design
3. Invitations page layout (tabs, cards)
4. Invitation card component
5. Mobile responsive design
6. Empty states (no invitations)

### Success Criteria

- [ ] Header icon shows unread count
- [ ] Dropdown displays recent invitations
- [ ] Full invitations page with tabs
- [ ] Mark as read/archive working
- [ ] View application opens external URL
- [ ] Components reusable for employer dashboard
- [ ] Mobile responsive

---

## Feature 9: Provider/Employer Company Management

**Branch:** `feature/company-profile-management`

### Overview

Allow Provider Admins and Employer Admins to manage their company/school profile information.

### Features for Both

**Company/School Profile:**
- Logo upload (similar to avatar)
- Company/School name
- Description
- Headquarters location
- Company size (for employers)
- Founded year
- Website URL
- Social media links

**Settings Page:**
- Profile information
- Branding (logo, colors)
- Contact information
- Billing (future)

### Database Schema

```sql
-- Update companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS headquarters TEXT,
ADD COLUMN IF NOT EXISTS company_size VARCHAR, -- 'small', 'medium', 'large', 'enterprise'
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT;

-- Update schools table (similar)
ALTER TABLE schools
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS headquarters TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS accreditation TEXT;
```

### Implementation Requirements

**Provider Settings:** `/provider/settings`
**Employer Settings:** `/employer/settings`

**Sections:**
1. Profile (name, description)
2. Branding (logo, colors)
3. Contact (location, website, social)
4. Account (limits, users)

### Mockup Requirements

**REQUIRED BEFORE BUILDING:**
1. Provider settings page
2. Employer settings page
3. Logo upload component
4. Form layouts

### Success Criteria

- [ ] Provider can manage school profile
- [ ] Employer can manage company profile
- [ ] Logo upload working
- [ ] All fields editable
- [ ] Changes reflected in public views

---

## Implementation Priority & Order

### Phase 1: Foundation (Week 1)
1. **Multi-Role User Management** (3-4 days)
   - Most critical - affects all other features
   - Database schema updates
   - Invitation system for admins
   - Provider/Employer dashboards

2. **User Account Settings** (1-2 days)
   - Required for employer invitations (LinkedIn, name)
   - Avatar upload
   - Profile management

### Phase 2: Core Features (Week 2)
3. **Employer Invitation System** (3-4 days)
   - Depends on user management
   - Qualified candidates view
   - Invitation sending/receiving

4. **Notification Center** (2-3 days)
   - Depends on invitation system
   - Header icon and dropdown
   - Full invitations page

### Phase 3: Enhancements (Week 3)
5. **Company Profile Management** (1-2 days)
   - Provider/Employer settings
   - Logo upload
   - Meta information

6. **Program Details Page** (2-3 days)
   - RFI form
   - Skills overlap
   - Related occupations

7. **Homepage Snapshot Redesign** (2-3 days)
   - After all data is available
   - Interactive graphs
   - Comprehensive user view

8. **Assessment UI Update** (1-2 days)
   - Polish existing flow
   - Match mockup

### Phase 4: Polish & Testing
9. **Mock User Generation** (1 day)
   - For demo purposes
   - After all features complete

---

## Critical Path Dependencies

```
Multi-Role User Management (Foundation)
  ↓
User Account Settings (Profile Requirements)
  ↓
Employer Invitation System (Core Feature)
  ↓
Notification Center (User Experience)
  ↓
Company Profile Management (Polish)
  ↓
Program Details + Homepage + Assessment UI (Enhancements)
  ↓
Mock User Generation (Demo Prep)
```

---

## Mockup Checklist

**Before starting ANY feature, request mockups for:**

### Feature 1: Multi-Role User Management
- [ ] Provider Admin dashboard
- [ ] Employer Admin dashboard
- [ ] Admin invitation form
- [ ] Invitation email template

### Feature 2: Employer Invitations
- [ ] Employer qualified candidates table
- [ ] Send invitation modal
- [ ] User notification dropdown
- [ ] User invitations page

### Feature 3: User Settings
- [ ] Settings page layout
- [ ] Avatar upload component
- [ ] Notification preferences

### Feature 4: Mock Users
- [ ] N/A (script-based)

### Feature 5: Homepage Snapshot
- [ ] Complete homepage redesign
- [ ] Graph specifications
- [ ] Dark theme sections

### Feature 6: Program Details
- [ ] Program details page
- [ ] RFI form design
- [ ] Skills overlap section

### Feature 7: Assessment UI
- [ ] Assessment page redesign
- [ ] Navigation and progress

### Feature 8: Notification Center
- [ ] Header icon states
- [ ] Dropdown design
- [ ] Invitations page

### Feature 9: Company Management
- [ ] Provider settings
- [ ] Employer settings
- [ ] Logo upload

---

## Questions for Clarification

### Employer Invitation Flow
**Decision Needed:** Option A (user submits) or Option B (auto-visible)?
- **Option A:** User must submit assessment to employer
- **Option B:** User automatically visible if meets threshold

**Recommendation:** Option B (simpler, better UX)

### Proficiency Threshold
**Decision Needed:** Single or dual threshold?
- **Single:** One threshold (e.g., 85%) for both display and visibility
- **Dual:** Display threshold (90%) and visibility threshold (85%)

**Recommendation:** Single threshold (simpler, less confusing)

### Notification System
**Decision Needed:** Email provider?
- **Option A:** Supabase (built-in, simpler)
- **Option B:** SendGrid (more features, more complex)

**Recommendation:** Start with Supabase, migrate to SendGrid if needed

---

## Branch Naming Convention

**Format:** `feature/{feature-name}`

**Examples:**
- `feature/multi-role-user-auth`
- `feature/employer-invitations`
- `feature/user-account-settings`
- `feature/notification-center`
- `feature/mock-user-generation`
- `feature/homepage-snapshot-redesign`
- `feature/program-details-page`
- `feature/assessment-ui-redesign`
- `feature/company-profile-management`

**Commit Message Format:**
```
feat: [Feature name] - [Specific change]

**Implemented:**
- Bullet points of what was done

**Status:**
- Current state

**Next:**
- What's remaining
```

---

## Development Workflow

### For Each Feature:

1. **Request Mockups** - Get all required mockups before starting
2. **Review Mockups** - Discuss and clarify any questions
3. **Create Branch** - Use naming convention above
4. **Database Schema** - Apply migrations first
5. **Backend Services** - Build APIs and services
6. **Frontend Components** - Build UI components
7. **Integration** - Wire everything together
8. **Testing** - Verify all functionality
9. **Commit & Push** - Regular commits with clear messages
10. **Request Review** - Show progress and get feedback
11. **Merge** - Only after approval

---

## Estimated Timeline

**Total:** 3-4 weeks (60-80 hours)

**Week 1:** Multi-role auth + User settings (5-6 days)
**Week 2:** Employer invitations + Notifications (5-6 days)  
**Week 3:** Company profiles + Program details + Homepage (5-6 days)
**Week 4:** Assessment UI + Mock users + Polish (3-4 days)

**After completion:** Return to assessment testing and final UI integration

---

*This document will be the primary reference for the next development phase. All features require mockup approval before implementation begins.*
