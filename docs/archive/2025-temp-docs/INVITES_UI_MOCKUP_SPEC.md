# Invitations UI - Mockup Specifications

**Based on:** User mockups provided October 2, 2025  
**Target:** Job-seeker/user-facing invitation management

---

## Page: Manage Your Invites (`/invitations`)

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Manage Your Invites                                      │
├─────────────────────────────────────────────────────────┤
│ [Active] [Archived]                                      │
├─────────────────────────────────────────────────────────┤
│ 🔍 Search    Readiness: All ▼  Status: All ▼  [Bulk Actions] │
├──────┬────────┬─────────────┬───────┬──────────┬────────┤
│ NAME │  ROLE  │ PROFICIENCY │ READY │  STATUS  │ ACTIONS│
├──────┼────────┼─────────────┼───────┼──────────┼────────┤
│ Logo │ Power  │ Mechanical  │  99%  │  Ready   │ View   │ •••│
│      │ Design │ Asst PM     │       │  (green) │ Appl   │    │
├──────┼────────┼─────────────┼───────┼──────────┼────────┤
│ Logo │ Jabil  │ Project Mgmt│  98%  │  Ready   │ Applied│ •••│
│      │        │ Specialists │       │  (green) │ (gray) │    │
└──────┴────────┴─────────────┴───────┴──────────┴────────┘
```

### Tab: Active

**Columns:**
1. **NAME** - Company logo + company name
2. **ROLE** - Job title
3. **PROFICIENCY** - Assessment score percentage
4. **ROLE READINESS** - Badge based on score
   - 90%+: "Ready" (green)
   - 85-89%: "Building Skills" (orange)
5. **STATUS** - Current invitation status
   - "View Application" (teal button)
   - "Applied" (gray badge)
   - "Declined" (red badge)
6. **ACTIONS** - Dropdown menu (•••)

**Actions Menu (Active):**
- View Application
- Mark as Applied
- Mark as Declined
- Role Details
- Assessment Results
- Archive Invite

**Filters:**
- Search by company/role
- Readiness: All | Ready | Building Skills
- Status: All | Pending | Applied | Declined

**Bulk Actions:**
- Mark as Applied
- Mark as Declined
- Archive Selected

### Tab: Archived

**Same columns as Active**

**STATUS shows:** "Archived" (gray badge)

**Actions Menu (Archived):**
- Role Details
- Assessment Results
- Restore Invite

---

## Component: Notification Dropdown

### Trigger
- Bell icon in navbar
- Red badge with unread count
- Position: Between "Give Feedback" and user avatar

### Dropdown Panel

**Header:** "Invite Notifications"

**Notification Item:**
```
New Invite from [Company Name]
You've been invited to apply to the [Role Title] role.
                                    [View Application]
```

**Shows:** Most recent 4-5 invitations

**Footer Actions:**
- "Mark All As Read" (white button, left)
- "View All Invites" (teal button, right)

**Behavior:**
- Click notification → Mark as read + navigate to invite details
- Click "View Application" → Open application URL in new tab
- Click "View All Invites" → Navigate to `/invitations`

---

## Design Specifications

### Colors

**Readiness Badges:**
- Ready (90%+): `bg-green-100 text-green-800`
- Building Skills (85-89%): `bg-orange-100 text-orange-800`

**Status Badges:**
- View Application: `bg-teal-600 text-white` (button)
- Applied: `bg-gray-200 text-gray-700`
- Declined: `bg-red-100 text-red-800`
- Archived: `bg-gray-200 text-gray-600`

**Buttons:**
- Primary (teal): `bg-teal-600 hover:bg-[#114B5F]`
- Outline (teal): `border-teal-600 text-teal-600 hover:bg-teal-50`
- Secondary: `bg-white border-gray-300 hover:bg-gray-50`

### Typography
- Page title: `text-2xl font-bold`
- Tab labels: `text-sm font-medium`
- Table headers: `text-xs font-semibold uppercase text-gray-500`
- Company names: `text-sm font-semibold`
- Role titles: `text-sm text-gray-700`

### Spacing
- Page padding: `px-4 sm:px-6 lg:px-8`
- Table row height: `h-16`
- Badge padding: `px-2 py-1`
- Dropdown width: `w-96`

### Responsive
- Mobile: Stack table into cards
- Tablet: Show abbreviated columns
- Desktop: Full table view

---

## Data Structure

### Invitation Object
```typescript
{
  id: string
  employer_id: string
  employer_name: string
  employer_logo: string
  candidate_id: string
  job_id: string
  job_title: string
  assessment_id: string
  proficiency_pct: number
  role_readiness: 'ready' | 'building_skills'
  application_url: string
  message: string
  status: 'pending' | 'viewed' | 'applied' | 'declined' | 'archived'
  sent_at: string
  viewed_at: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
}
```

### API Endpoints

**GET /api/invitations**
- Query params: `?status=active|archived&readiness=all|ready|building_skills`
- Returns: Array of invitations

**PATCH /api/invitations/[id]**
- Body: `{ status: 'applied' | 'declined' | 'archived' }`
- Returns: Updated invitation

**POST /api/invitations/bulk**
- Body: `{ invitation_ids: string[], action: 'apply' | 'decline' | 'archive' }`
- Returns: Success count

**GET /api/invitations/notifications**
- Returns: Unread invitations (limit 5)

**POST /api/invitations/mark-read**
- Body: `{ invitation_ids: string[] }`
- Returns: Success

---

## Components to Build

### Pages
1. `/src/app/(main)/invitations/page.tsx`

### Components
1. `/src/components/invitations/invitations-table.tsx`
2. `/src/components/invitations/invitation-row.tsx`
3. `/src/components/invitations/invitation-actions-menu.tsx`
4. `/src/components/invitations/invitation-filters.tsx`
5. `/src/components/invitations/bulk-actions-dropdown.tsx`
6. `/src/components/ui/notification-dropdown.tsx`
7. `/src/components/ui/notification-item.tsx`

### Hooks
1. `/src/hooks/useInvitations.ts`
2. `/src/hooks/useNotifications.ts`

---

## Implementation Priority

1. **Phase 1:** Invitations table page (Active tab)
2. **Phase 2:** Archived tab + filters
3. **Phase 3:** Notification dropdown
4. **Phase 4:** Bulk actions
5. **Phase 5:** Real-time updates

---

## Notes

- Use existing StickyTabs component for tab navigation
- Follow Jobs/Programs table patterns
- Ensure mobile responsiveness
- Add loading skeletons
- Include empty states
- Handle error states gracefully
