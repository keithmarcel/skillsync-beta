# Employer Invitations UI - Next Steps

**Branch:** `feature/employer-invitations-ui`  
**Created:** October 2, 2025 - 7:10 PM  
**Status:** Ready to begin  
**Dependencies:** ✅ Account settings complete, ✅ Database schema ready

---

## 🎯 Session Objectives

1. **Review mockups** for invitations UI
2. **Set up mock data** (users, employers, provider)
3. **Implement user-facing invitations UI**
4. **Test complete invitation workflow**

---

## ✅ What's Already Done

### Database Schema (Complete)
- ✅ `employer_invitations` table created
- ✅ Dual threshold system (85% visibility, 90% display)
- ✅ `visible_to_employers` field in profiles
- ✅ RLS policies configured
- ✅ Indexes for performance

**Migration Files:**
- `20251002145100_employer_invitations_system.sql`
- `20251002141922_multi_role_auth_schema.sql`
- `20251002145950_multi_role_schema_extensions.sql`

### API Endpoints (Complete)
- ✅ `GET /api/employer/candidates` - Get qualified candidates
- ✅ `POST /api/invitations` - Send invitation
- ✅ `GET /api/invitations` - Get user's invitations
- ✅ `PATCH /api/invitations/[id]` - Update invitation status
- ✅ `POST /api/invitations/bulk` - Bulk actions

**Files:**
- `/src/app/api/employer/candidates/route.ts`
- `/src/app/api/invitations/route.ts`
- `/src/app/api/invitations/[id]/route.ts`
- `/src/app/api/invitations/bulk/route.ts`
- `/src/lib/services/employer-invitations.ts`

### Account Settings (Complete)
- ✅ Profile management with LinkedIn
- ✅ "Allow employers to invite you to apply" checkbox
- ✅ Avatar upload system
- ✅ All required for invitations workflow

---

## 📋 What Needs to Be Built

### 1. Mock Data Setup (Priority 1)

**Script:** `/scripts/seed-invitation-test-data.js`

**Required Mock Data:**
```javascript
// 1. Mock Users (5-10 users with completed assessments)
{
  email: 'candidate1@test.com',
  first_name: 'Jane',
  last_name: 'Smith',
  linkedin_url: 'https://linkedin.com/in/janesmith',
  visible_to_employers: true,
  avatar_url: '/assets/Avatar-1.png'
}

// 2. Mock Assessments (for each user, 2-3 assessments)
{
  user_id: 'user-uuid',
  job_id: 'job-uuid',
  readiness_pct: 87, // Above 85% threshold
  status_tag: 'role_ready',
  completed_at: '2025-10-01T10:00:00Z'
}

// 3. Mock Employer (1 employer admin)
{
  email: 'employer@company.com',
  first_name: 'John',
  last_name: 'Employer',
  role: 'employer_admin',
  company_id: 'company-uuid'
}

// 4. Mock Provider (1 provider admin)
{
  email: 'provider@school.edu',
  first_name: 'Sarah',
  last_name: 'Provider',
  role: 'provider_admin',
  organization_id: 'school-uuid'
}
```

**Avatars Available:**
- `/public/assets/Avatar-1.png` through `Avatar-8.png`

### 2. User Invitations Page (Priority 2)

**Route:** `/src/app/(main)/invitations/page.tsx`

**Features:**
- Tab navigation: Active | Archived
- Invitation cards with:
  - Company logo
  - Role title
  - Invitation message
  - Application URL button
  - Decline/Archive actions
- Empty state for no invitations
- Unread badge count

**Components Needed:**
- `InvitationCard` - Display single invitation
- `InvitationsHeader` - Page header with tabs
- `EmptyInvitationsState` - No invitations message

### 3. Notification Center (Priority 3)

**Component:** `/src/components/ui/notification-dropdown.tsx`

**Features:**
- Bell icon in navbar with unread badge
- Dropdown shows recent 5 invitations
- "View All" link to `/invitations`
- Mark as read functionality

**Integration:**
- Add to navbar next to "Give Feedback"
- Real-time unread count
- Click to mark as viewed

### 4. Employer Dashboard (Future - Not This Session)

**Route:** `/src/app/admin/employer/candidates/page.tsx`

**Features:**
- Table of qualified candidates
- Filter by role
- Sort by proficiency score
- Send invitation modal
- Track invitation status

---

## 🎨 UI Components to Review

### Mockups Needed
1. **Invitations Page**
   - Tab layout (Active/Archived)
   - Invitation card design
   - Empty state
   
2. **Notification Dropdown**
   - Bell icon with badge
   - Dropdown layout
   - Invitation preview

3. **Invitation Card**
   - Company logo placement
   - Message display
   - Action buttons
   - Status indicators

### Design System
- Use existing StickyTabs for tab navigation
- Follow Jobs/Programs card patterns
- Teal theme (#0694A2)
- Mobile-responsive (px-4 sm:px-6 lg:px-8)

---

## 📊 Test Scenarios

### User Flow
1. ✅ User completes assessment (87% score)
2. ✅ User is visible to employers (>85%)
3. ⏳ Employer views qualified candidates
4. ⏳ Employer sends invitation
5. ⏳ User receives notification
6. ⏳ User views invitation in dropdown
7. ⏳ User clicks "View All Invitations"
8. ⏳ User sees invitation card
9. ⏳ User clicks "View Application"
10. ⏳ User can decline or archive

### Privacy Flow
1. ✅ User can toggle "visible_to_employers" in settings
2. ⏳ When OFF, user not shown to employers
3. ⏳ When ON, user shown if score >= 85%

---

## 🔧 Implementation Order

### Session 1: Foundation (Today)
1. ✅ Review documentation
2. ⏳ Review mockups with user
3. ⏳ Create mock data script
4. ⏳ Seed test data
5. ⏳ Verify data in database

### Session 2: User UI (Next)
1. Create InvitationCard component
2. Build /invitations page with tabs
3. Implement empty states
4. Add notification dropdown to navbar
5. Wire up API endpoints
6. Test complete user flow

### Session 3: Polish (Future)
1. Add real-time notifications
2. Email notifications
3. Invitation analytics
4. Employer dashboard

---

## 📁 File Structure

```
src/
├── app/
│   ├── (main)/
│   │   └── invitations/
│   │       └── page.tsx                    # NEW
│   └── api/
│       ├── invitations/
│       │   ├── route.ts                    # ✅ EXISTS
│       │   ├── [id]/route.ts               # ✅ EXISTS
│       │   ├── bulk/route.ts               # ✅ EXISTS
│       │   └── notifications/route.ts      # ✅ EXISTS
│       └── employer/
│           └── candidates/
│               └── route.ts                # ✅ EXISTS
├── components/
│   ├── invitations/
│   │   ├── invitation-card.tsx             # NEW
│   │   ├── invitations-header.tsx          # NEW
│   │   └── empty-invitations-state.tsx     # NEW
│   └── ui/
│       └── notification-dropdown.tsx       # NEW
└── lib/
    └── services/
        └── employer-invitations.ts         # ✅ EXISTS

scripts/
└── seed-invitation-test-data.js            # NEW

docs/
└── features/
    ├── EMPLOYER_INVITATIONS_SPEC.md        # ✅ EXISTS
    ├── EMPLOYER_INVITATIONS_IMPLEMENTATION.md  # ✅ EXISTS
    └── INVITES_UI_NEXT_STEPS.md           # THIS FILE
```

---

## 🚀 Ready to Start

**Prerequisites Complete:**
- ✅ Account settings with LinkedIn and visibility toggle
- ✅ Database schema with invitations table
- ✅ API endpoints for invitations
- ✅ Avatar system for user profiles
- ✅ Multi-role auth system

**Next Actions:**
1. Review mockups
2. Create seed data script
3. Build user invitations UI
4. Test complete workflow

**Estimated Time:** 4-6 hours for user-facing UI

---

## 📝 Notes

- Focus on user-facing features first (receiving invitations)
- Employer dashboard can be separate sprint
- Use existing patterns from Jobs/Programs pages
- Ensure mobile responsiveness
- Follow tab URL routing pattern
- Add proper loading/error states

**Documentation References:**
- `/docs/features/EMPLOYER_INVITATIONS_SPEC.md`
- `/docs/features/EMPLOYER_INVITATIONS_IMPLEMENTATION.md`
- `/docs/features/PRE_ASSESSMENT_FEATURES.md`
- `/docs/SPRINT_ROADMAP.md`
