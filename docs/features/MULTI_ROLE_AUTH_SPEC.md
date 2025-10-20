# Multi-Role User Management - Detailed Specification

**Branch:** `feature/multi-role-user-auth`  
**Duration:** 3-4 days  
**Priority:** CRITICAL - Blocks all other features  
**Status:** Awaiting mockups

---

## 🎯 Objective

Implement four-tier user role system with invitation-based onboarding for Provider and Employer admins.

---

## User Roles & Permissions

### 1. Basic User (Default)
**Role Value:** `'user'`  
**Access:**
- Browse jobs and programs
- Take assessments
- View results and recommendations
- Manage profile and settings
- Receive employer invitations

**Restrictions:**
- No admin panel access
- Cannot manage company/school data
- Cannot invite other users

### 2. Super Admin
**Role Value:** `'super_admin'`  
**Current:** keith-woods@bisk.com  
**Access:**
- Full admin panel access
- Manage all entities (users, companies, providers, programs, roles)
- Invite Provider/Employer admins
- Set account limits
- View all data across platform

**Special Powers:**
- Can act on behalf of any company/provider
- Can override limits
- Can feature/unfeature content
- Full database access

### 3. Provider Admin
**Role Value:** `'provider_admin'`  
**Access:**
- Provider dashboard (`/provider`)
- Manage programs for their school only
- View RFI submissions for their programs
- Manage school profile (logo, description, etc.)
- View analytics for their programs

**Restrictions:**
- Cannot see other providers' data
- Cannot access super admin tools
- Subject to account limits (max programs, max featured)
- Cannot invite other users

**Account Limits:**
- `max_programs`: 300 (default)
- `max_featured_programs`: 50 (default)
- Configurable by Super Admin

### 4. Employer Admin
**Role Value:** `'employer_admin'`  
**Access:**
- Employer dashboard (`/employer`)
- Manage featured roles for their company only
- View qualified candidates (>= proficiency threshold)
- Send invitations to candidates
- Manage company profile (logo, description, etc.)
- View analytics for their roles

**Restrictions:**
- Cannot see other employers' data
- Cannot access super admin tools
- Subject to account limits (max featured roles)
- Cannot invite other users

**Account Limits:**
- `max_featured_roles`: 10 (default)
- Configurable by Super Admin

---

## Database Schema

### Profiles Table Updates

```sql
-- Add role and association columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user',
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_mock_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_programs INTEGER,
ADD COLUMN IF NOT EXISTS max_featured_programs INTEGER,
ADD COLUMN IF NOT EXISTS max_featured_roles INTEGER;

-- Add role constraint
ALTER TABLE profiles
ADD CONSTRAINT valid_role CHECK (role IN ('user', 'super_admin', 'provider_admin', 'employer_admin'));

-- Add association constraints
ALTER TABLE profiles
ADD CONSTRAINT provider_has_school CHECK (
  role != 'provider_admin' OR school_id IS NOT NULL
);

ALTER TABLE profiles
ADD CONSTRAINT employer_has_company CHECK (
  role != 'employer_admin' OR company_id IS NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
```

### Admin Invitations Table

```sql
CREATE TABLE admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('provider_admin', 'employer_admin')),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token TEXT UNIQUE NOT NULL,
  max_programs INTEGER,
  max_featured_programs INTEGER,
  max_featured_roles INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure role matches association
ALTER TABLE admin_invitations
ADD CONSTRAINT invitation_role_association CHECK (
  (role = 'provider_admin' AND school_id IS NOT NULL AND company_id IS NULL) OR
  (role = 'employer_admin' AND company_id IS NOT NULL AND school_id IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_admin_invitations_token ON admin_invitations(token);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON admin_invitations(email);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_status ON admin_invitations(status);
```

---

## RLS Policies

### Profiles Table

```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Super admins can read all profiles
CREATE POLICY "Super admins can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);
```

### Programs Table (Provider Admin Access)

```sql
-- Provider admins can read their school's programs
CREATE POLICY "Provider admins can read their programs"
ON programs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'provider_admin'
    AND profiles.school_id = programs.school_id
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Provider admins can insert programs for their school
CREATE POLICY "Provider admins can create programs"
ON programs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'provider_admin'
    AND profiles.school_id = programs.school_id
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Provider admins can update their school's programs
CREATE POLICY "Provider admins can update their programs"
ON programs FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'provider_admin'
    AND profiles.school_id = programs.school_id
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Provider admins can delete their school's programs
CREATE POLICY "Provider admins can delete their programs"
ON programs FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'provider_admin'
    AND profiles.school_id = programs.school_id
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);
```

### Jobs Table (Employer Admin Access)

```sql
-- Similar policies for employer admins managing jobs
-- (Replace school_id with company_id, programs with jobs)
```

---

## API Endpoints

### Super Admin - Invite Provider/Employer Admin

**POST** `/api/admin/invitations`

**Request:**
```typescript
{
  email: string;
  role: 'provider_admin' | 'employer_admin';
  company_id?: string; // Required if employer_admin
  school_id?: string; // Required if provider_admin
  max_programs?: number; // For provider_admin
  max_featured_programs?: number; // For provider_admin
  max_featured_roles?: number; // For employer_admin
}
```

**Response:**
```typescript
{
  invitation: {
    id: string;
    email: string;
    role: string;
    token: string;
    expires_at: string;
    invitation_url: string; // Full URL with token
  }
}
```

**Logic:**
1. Verify requester is super_admin
2. Validate email not already registered
3. Validate company_id or school_id exists
4. Generate unique token
5. Set expiration (7 days)
6. Send invitation email
7. Return invitation details

---

### Accept Invitation

**POST** `/api/auth/accept-invitation`

**Request:**
```typescript
{
  token: string;
  password: string;
  first_name: string;
  last_name: string;
}
```

**Response:**
```typescript
{
  user: User;
  profile: Profile;
  session: Session;
}
```

**Logic:**
1. Validate token exists and not expired
2. Check invitation status = 'pending'
3. Create auth.users account with email from invitation
4. Create profile with role, company_id/school_id, limits
5. Mark invitation as 'accepted'
6. Sign in user
7. Redirect to appropriate dashboard

---

### Check Invitation Status

**GET** `/api/auth/invitation/:token`

**Response:**
```typescript
{
  valid: boolean;
  invitation?: {
    email: string;
    role: string;
    company_name?: string;
    school_name?: string;
    expires_at: string;
  }
}
```

---

## Frontend Components

### Super Admin - Invitation Form

**Location:** `/admin/users` or `/admin/invitations`

**Component:** `InviteAdminForm.tsx`

**Fields:**
- Email (required, validated)
- Role (dropdown: Provider Admin, Employer Admin)
- Company (dropdown, shown if Employer Admin selected)
- School (dropdown, shown if Provider Admin selected)
- Max Programs (number input, Provider Admin only)
- Max Featured Programs (number input, Provider Admin only)
- Max Featured Roles (number input, Employer Admin only)

**Validation:**
- Email format
- Email not already registered
- Company/School selected based on role
- Limits > 0

**Actions:**
- Send Invitation button
- Cancel button

**Success:**
- Show invitation URL
- Copy to clipboard button
- Email sent confirmation
- Add to invitations table

---

### Invitation Acceptance Page

**Location:** `/auth/accept-invitation?token=xxx`

**Component:** `AcceptInvitationPage.tsx`

**Flow:**
1. Check token validity on page load
2. If invalid/expired: Show error, link to contact support
3. If valid: Show invitation details and signup form

**Form Fields:**
- Email (pre-filled, disabled)
- First Name (required)
- Last Name (required)
- Password (required, min 8 chars)
- Confirm Password (required, must match)
- Terms acceptance (checkbox, required)

**Display:**
- Invited by: [Super Admin name]
- Role: Provider Admin / Employer Admin
- Company/School: [Name]
- Account Limits: [Display limits]

**Actions:**
- Accept & Create Account button
- Decline Invitation link

---

### Provider Admin Dashboard

**Location:** `/provider` or `/provider/dashboard`

**Layout:**
- Sidebar navigation (Programs, Settings, Analytics)
- Header with school logo and name
- Main content area

**Pages:**

**1. Programs (`/provider/programs`)**
- Table of all programs for their school
- Columns: Name, Type, CIP Code, Featured, Status, Actions
- Actions: Edit, Feature/Unfeature, Delete
- Add Program button (if under limit)
- Shows: "X of Y programs" (current/max)
- Warning when approaching limit

**2. Settings (`/provider/settings`)**
- School profile management
- Logo upload
- Contact information
- Account details (limits, users)

**3. Analytics (`/provider/analytics`)** (Optional/Future)
- Program views
- RFI submissions
- Enrollment tracking

---

### Employer Admin Dashboard

**Location:** `/employer` or `/employer/dashboard`

**Layout:**
- Sidebar navigation (Roles, Candidates, Settings)
- Header with company logo and name
- Main content area

**Pages:**

**1. Roles (`/employer/roles`)**
- Table of all featured roles for their company
- Columns: Title, SOC Code, Proficiency Threshold, Candidates, Status, Actions
- Actions: Edit, Set Threshold, View Candidates, Delete
- Add Role button (if under limit)
- Shows: "X of Y roles" (current/max)

**2. Candidates (`/employer/candidates`)**
- Table of qualified candidates across all roles
- Columns: Name, Role, Score, Assessment Date, Actions
- Filter by role
- Sort by score, date
- Actions: View Profile, Send Invitation
- Shows only candidates >= proficiency threshold

**3. Settings (`/employer/settings`)**
- Company profile management
- Logo upload
- Contact information
- Account details (limits, users)

---

## Implementation Checklist

### Phase 1: Database (Day 1)
- [ ] Create migration file
- [ ] Update profiles table (role, associations, limits)
- [ ] Create admin_invitations table
- [ ] Add constraints and indexes
- [ ] Test migration locally
- [ ] Apply to production

### Phase 2: Backend Services (Day 2)
- [ ] Create invitation service (`/src/lib/services/admin-invitations.ts`)
- [ ] API: Send invitation
- [ ] API: Check invitation status
- [ ] API: Accept invitation
- [ ] Email template for invitations
- [ ] Token generation and validation
- [ ] Test all endpoints

### Phase 3: RLS Policies (Day 2-3)
- [ ] Profiles policies (read own, super admin read all)
- [ ] Programs policies (provider admin scoped)
- [ ] Jobs policies (employer admin scoped)
- [ ] Schools policies (provider admin read own)
- [ ] Companies policies (employer admin read own)
- [ ] Test with multiple user accounts

### Phase 4: Super Admin UI (Day 3)
- [ ] Invitation form component
- [ ] Invitations table/list
- [ ] Cancel invitation action
- [ ] Resend invitation action
- [ ] Test invitation flow end-to-end

### Phase 5: Provider Dashboard (Day 3-4)
- [ ] Dashboard layout
- [ ] Programs page (table, CRUD)
- [ ] Limit enforcement UI
- [ ] Settings page (basic)
- [ ] Test as provider admin

### Phase 6: Employer Dashboard (Day 4)
- [ ] Dashboard layout
- [ ] Roles page (table, CRUD)
- [ ] Candidates page (basic view)
- [ ] Limit enforcement UI
- [ ] Settings page (basic)
- [ ] Test as employer admin

### Phase 7: Invitation Acceptance (Day 4)
- [ ] Acceptance page UI
- [ ] Token validation
- [ ] Signup form
- [ ] Auto-login after acceptance
- [ ] Redirect to appropriate dashboard
- [ ] Test complete flow

---

## Testing Strategy

### Test Accounts Needed

1. **Super Admin:** keith-woods@bisk.com (existing)
2. **Provider Admin:** test-provider@example.com (create)
3. **Employer Admin:** test-employer@example.com (create)
4. **Basic User:** test-user@example.com (create)

### Test Scenarios

**Invitation Flow:**
1. Super admin invites provider admin
2. Provider admin receives email
3. Provider admin accepts invitation
4. Provider admin logs in to dashboard
5. Provider admin can only see their programs
6. Provider admin cannot access super admin tools

**Limit Enforcement:**
1. Provider admin at 299/300 programs
2. Add one more program (success)
3. Try to add another (blocked with error)
4. Super admin increases limit to 350
5. Provider admin can now add more

**RLS Security:**
1. Provider A cannot see Provider B's programs
2. Employer A cannot see Employer B's roles
3. Basic user cannot access admin endpoints
4. Super admin can see everything

---

## Email Template

### Admin Invitation Email

**Subject:** You've been invited to join SkillSync as [Role]

**Body:**
```
Hi there,

[Super Admin Name] has invited you to join SkillSync as a [Provider Admin / Employer Admin] for [Company/School Name].

As a [Role], you'll be able to:
- [List of permissions]
- [Manage X programs / Manage Y roles]
- [View analytics and insights]

Click the link below to accept your invitation and create your account:

[Accept Invitation Button/Link]

This invitation expires in 7 days on [Date].

If you have any questions, please contact [Super Admin Email].

Best regards,
The SkillSync Team
```

---

## Mockup Requirements

**REQUIRED BEFORE BUILDING:**

1. **Super Admin - Invite Form**
   - Form layout and fields
   - Role selection UI
   - Company/School dropdown behavior
   - Limits input fields
   - Success state

2. **Provider Admin Dashboard**
   - Overall layout (sidebar, header, content)
   - Programs table design
   - Add program flow
   - Limit warning UI
   - Mobile responsive

3. **Employer Admin Dashboard**
   - Overall layout (sidebar, header, content)
   - Roles table design
   - Candidates table design (basic)
   - Add role flow
   - Limit warning UI
   - Mobile responsive

4. **Invitation Acceptance Page**
   - Layout and branding
   - Invitation details display
   - Signup form
   - Terms acceptance
   - Success/error states

5. **Email Template**
   - HTML email design
   - Branding (logo, colors)
   - CTA button design
   - Mobile responsive

---

## Success Criteria

- [ ] All 4 user roles working with proper permissions
- [ ] Super Admin can invite Provider/Employer admins
- [ ] Invitation email sent and received
- [ ] Invitation acceptance creates account with correct role
- [ ] Provider Admin can only manage their programs
- [ ] Employer Admin can only manage their roles
- [ ] Limits enforced (max programs, max roles)
- [ ] RLS policies prevent unauthorized access
- [ ] All dashboards functional and scoped correctly
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Comprehensive testing completed

---

## Known Considerations

### From Memory: CMS Admin Tools Requirements

**Alignment with existing specs:**
- ✅ Company Admins = Employer Admins (max 10 featured roles)
- ✅ Provider Admins (max 300 programs)
- ✅ Super Admin (keith-woods@bisk.com, global access)
- ✅ Featured flagging: Super Admin only
- ✅ Draft/publish workflow (already exists for roles)

**Additional requirements to integrate:**
- Draft/publish workflow for roles (already implemented)
- AI pipeline for role skills (manual trigger)
- Skills weighting (already implemented)

---

*This specification provides complete implementation details for the multi-role user management system. Consult this document throughout development.*
