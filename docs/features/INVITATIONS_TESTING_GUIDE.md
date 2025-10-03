# Invitations System - Testing Guide

**Branch:** `feature/employer-invitations-ui`  
**Status:** Ready for Testing  
**Date:** October 2, 2025

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

✅ Passed: 9
❌ Failed: 0
```

---

## 🐛 Known Issues / Limitations

1. **Invitations status:** All seeded invitations are "pending" (not "sent")
   - Need to update status to "sent" to show as unread
   - Run: Update invitations set status='sent' where status='pending'

2. **Company logos:** May not display if logo_url is null
   - Fallback to company name only

3. **Real-time updates:** 30-second polling only
   - Not true real-time (would need WebSockets)

4. **Role Details / Assessment Results:** Menu items not yet implemented
   - Placeholders in dropdown menu

---

## 🚀 Quick Test Script

```bash
# 1. Seed test data (if not already done)
node scripts/seed-invitation-test-data.js

# 2. Update invitations to "sent" status
# (Run in Supabase SQL Editor)
UPDATE employer_invitations 
SET status = 'sent', 
    invited_at = NOW() - INTERVAL '2 days'
WHERE status = 'pending';

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

## 🎬 Next Steps After Testing

1. **Fix any bugs found**
2. **Implement Role Details page** (link from menu)
3. **Implement Assessment Results view** (link from menu)
4. **Add email notifications** (when invitation sent)
5. **Build employer dashboard** (send invitations)
6. **Add real-time updates** (WebSockets/Supabase Realtime)

---

## 📝 Feedback

Please report any issues found during testing:
- UI bugs or inconsistencies
- Performance issues
- Missing features
- Suggestions for improvements
