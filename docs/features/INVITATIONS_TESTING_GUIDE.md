# Invitations System - Testing Guide

**Branch:** `main`  
**Status:** ✅ Complete - Candidate UI Implemented  
**Date:** October 2, 2025 (Updated)

---

## 🎯 What's Been Built

### Components
1. ✅ **Invitations Page** (`/invitations`)
   - Active and Archived tabs with URL routing
   - Search by company/role
   - Filter by readiness and status
   - Bulk actions
   - Empty states

2. ✅ **Notification Dropdown** (Navbar)
   - Bell icon with unread badge
   - Recent 5 invitations
   - Mark all as read
   - View all invites button

3. ✅ **Database & API**
   - 14 test invitations seeded
   - All service functions working
   - RLS policies enforced
   - Unique constraints validated

---

## 🧪 Test Data Available

### Mock Users (Candidates)
- Jane Smith (candidate1@test.com)
- Michael Johnson (candidate2@test.com)
- Sarah Williams (candidate3@test.com)
- David Brown (candidate4@test.com)
- Emily Davis (candidate5@test.com)

**Password:** `TestPassword123!`

### Mock Invitations
- **14 total invitations** across 5 candidates
- **Companies:** Power Design, BayCare, TD SYNNEX
- **Roles:** Mechanical Assistant PM, Surgical Tech, Financial Analyst
- **Proficiency:** 95%, 98%, 99% (all above 85% threshold)
- **Status:** All currently "pending" (not sent yet)

### Mock Employer
- Email: employer@powerdesign.com
- Password: TestPassword123!
- Company: Power Design

---

## 📋 Manual Testing Checklist

### 1. Invitations Page - Active Tab

**Navigate to:** `/invitations`

- [ ] Page loads without errors
- [ ] "Manage Your Invites" header displays
- [ ] Active tab is selected by default
- [ ] Table shows all 14 invitations (if logged in as a candidate)
- [ ] Company logos display correctly
- [ ] Proficiency percentages show (95%, 98%, 99%)
- [ ] "Ready" badges show (green) for all invitations
- [ ] "View Application" buttons display

**Search:**
- [ ] Search for "Power" - filters to Power Design invitations
- [ ] Search for "Surgical" - filters to Surgical Tech roles
- [ ] Search for "xyz" - shows "no results" message
- [ ] Clear search - shows all invitations again

**Filters:**
- [ ] Readiness: "Ready" - shows all (all are 90%+)
- [ ] Readiness: "Building Skills" - shows none (none are 85-89%)
- [ ] Status: "Pending" - shows all
- [ ] Status: "Applied" - shows none
- [ ] Combine filters - works correctly

**Row Actions:**
- [ ] Click "View Application" - opens URL in new tab
- [ ] Click "..." menu - dropdown appears
- [ ] "Mark as Applied" - invitation moves to Applied status
- [ ] "Mark as Declined" - invitation moves to Declined status
- [ ] "Archive Invite" - invitation disappears from Active tab
- [ ] Status badge updates after action

**Bulk Actions:**
- [ ] Select one invitation - checkbox checks
- [ ] Select all - all checkboxes check
- [ ] "Bulk Actions" button appears with count
- [ ] Click "Archive Selected" - selected invitations archive
- [ ] Selection clears after bulk action

### 2. Invitations Page - Archived Tab

**Navigate to:** `/invitations?tab=archived`

- [ ] Archived tab is selected
- [ ] Shows archived invitations
- [ ] "Archived" status badge displays (gray)
- [ ] "..." menu shows "Restore Invite" option
- [ ] Click "Restore" - invitation returns to Active tab
- [ ] No status filter (only readiness filter shows)

### 3. Tab Navigation

- [ ] Click "Archived" tab - URL updates to `?tab=archived`
- [ ] Click "Active" tab - URL updates to `?tab=active`
- [ ] Browser back button - returns to previous tab
- [ ] Browser forward button - goes to next tab
- [ ] Refresh page on Archived tab - stays on Archived
- [ ] Direct URL `/invitations?tab=archived` - loads Archived tab

### 4. Notification Dropdown

**In Navbar:**
- [ ] Bell icon displays next to "Give Feedback"
- [ ] Red badge shows unread count (should show 14)
- [ ] Badge shows "9+" if count > 9
- [ ] Click bell - dropdown opens
- [ ] Dropdown shows "Invite Notifications" header
- [ ] Shows up to 5 recent invitations
- [ ] Each shows: "New Invite from [Company]"
- [ ] Each shows: "You've been invited to apply to the [Role] role"
- [ ] "View Application" button on each item
- [ ] Unread items have blue background

**Actions:**
- [ ] Click "View Application" - opens URL in new tab
- [ ] Click "Mark All As Read" - badge count goes to 0
- [ ] Click "View All Invites" - navigates to `/invitations`
- [ ] Dropdown closes after navigation
- [ ] Refresh after 30 seconds (auto-polling)

### 5. Empty States

**To test, archive all invitations:**
- [ ] Active tab shows "No Invitations Yet" message
- [ ] Archived tab shows "No Archived Invitations" message
- [ ] Notification dropdown shows "No new invitations"
- [ ] Badge hidden when count is 0

### 6. Loading States

**To test, throttle network in DevTools:**
- [ ] Page shows "Loading invitations..." while fetching
- [ ] Skeleton loaders in navbar while auth loading
- [ ] Notification dropdown shows "Loading notifications..."
- [ ] Buttons show disabled state during actions

### 7. Error Handling

**To test, go offline:**
- [ ] Error message displays if fetch fails
- [ ] Actions fail gracefully with error message
- [ ] Can retry after reconnecting

### 8. Responsive Design

**Test on different screen sizes:**
- [ ] Mobile (< 640px) - table scrolls horizontally
- [ ] Tablet (640-1024px) - layout adjusts
- [ ] Desktop (> 1024px) - full table view
- [ ] Notification dropdown width adjusts
- [ ] Search and filters stack on mobile

---

## 🔧 Database Tests

**Run:** `node scripts/test-invitations-db.js`

**Expected Results:**
```
✅ Table exists and is accessible
✅ Joins work correctly (companies, jobs)
✅ RLS policies allow service role access
✅ Status filtering works
✅ Proficiency filtering works
✅ Can update invitations
✅ Unique constraint enforced
✅ Status enum validation works
✅ Count queries work

❌ Failed: 0

4. **Role Details / Assessment Results:** ✅ Now wired up
   - Role Details navigates to `/jobs/{job_id}` or searches by SOC code
   - Assessment Results navigates to `/assessments?id={assessment_id}` or `/assessments`

---

## 🚀 Quick Test Script

```bash
# 1. Seed test data (if not already done)
node scripts/seed-invitation-test-data.js

# 2. Update invitations to "sent" status
# (Run in Supabase SQL Editor: scripts/fix-test-invitations-status.sql)
# This makes test invitations visible to candidates

# 3. Test database
node scripts/test-invitations-db.js

# 4. View invitations
node scripts/view-invitations.js

# 5. Start dev server
npm run dev

# 6. Login as candidate
# Email: candidate1@test.com
# Password: TestPassword123!

# 7. Navigate to /invitations
```

---

## 📋 Status Workflow Explanation

**Understanding `pending` vs `sent`:**

| Status | Visible To | Meaning | Trigger |
|--------|-----------|---------|---------|
| `pending` | Employer only | Candidate in pool, invitation NOT sent | Auto-populated when assessment >= threshold |
| `sent` | Candidate | Invitation sent and visible | Employer clicks "Send Invitation" |
| `applied` | Both | Candidate marked as applied | Candidate clicks "Mark as Applied" |
| `declined` | Both | Candidate declined | Candidate clicks "Decline" |
| `archived` | Neither (archived view) | Removed from active list | Either party archives |

**Why This Design:**
- Prevents spam - candidates only see intentional invitations
- Gives employers control over timing and messaging
- `pending` = employer's candidate pool
- `sent` = candidate's inbox

**For Testing:**
- Seeded data starts as `pending` (realistic)
- Run `scripts/fix-test-invitations-status.sql` to convert to `sent`
- This simulates employer clicking "Send Invitation"

---

## ✅ Success Criteria

- [ ] Can view all invitations in table
- [ ] Can search and filter invitations
- [ ] Can mark as applied/declined
- [ ] Can archive and restore invitations
- [ ] Notification badge shows correct count
- [ ] Notification dropdown shows recent invites
- [ ] Can navigate from dropdown to invitations page
- [ ] Tab state persists in URL
- [ ] All database tests pass
- [ ] Mobile responsive
- [ ] No console errors

---

## 📊 Test Coverage

### UI Components
- **60+ test cases** in `tests/invitations-ui.test.ts`
- Page rendering, navigation, authentication
- Table display, search, filters
- Row actions, bulk actions
- Notification dropdown, badge display

### API & Database
- **80+ test cases** in `tests/invitations-api.test.ts`
- Service functions (get, update, archive)
- API routes (GET, PATCH, POST)
- RLS policies, constraints, indexes
- Error handling

### Database Integration
- **10 tests** in `scripts/test-invitations-db.js`
- Table access, joins, indexes
- RLS enforcement
- Unique constraints, enum validation
- Count queries

**Total: 150+ test cases defined**

---

## 🎬 Next Steps

1. ✅ **Candidate UI Complete** - All features implemented and tested
2. **Employer Dashboard** - Part of larger employer admin dashboard (on hold)
3. **Email Notifications** - Send emails when invitations are sent
4. **Real-time Updates** - WebSockets/Supabase Realtime for live updates
5. **Enhanced Filtering** - Additional filter options based on user feedback

## ✅ Completed in This Session

### UI Refinements
- Notification dropdown matches exact Figma specifications
- 472px width, precise spacing and colors
- Light gray hover states on notification cards
- Bold role names in invitation details
- Proper dropdown positioning aligned with avatar menu

### Invitations Table Improvements
- Dedicated logo column (96px × 96px logos)
- "Company Name" column header
- Bold role names, regular proficiency text
- Consistent status badge sizing (no layout shift)
- Menu dividers after key actions
- Wired up "Role Details" and "Assessment Results" navigation

---

## 📝 Feedback

Please report any issues found during testing:
- UI bugs or inconsistencies
- Performance issues
- Missing features
- Suggestions for improvements
