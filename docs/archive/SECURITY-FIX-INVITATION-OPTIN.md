# 🚨 CRITICAL SECURITY FIX: Invitation Opt-In Enforcement

## Issue Identified
Users who have NOT opted in (`visible_to_employers = false`) can still:
- View invitations sent to them
- Respond to invitations (apply/decline)
- Receive notifications about invitations

This violates the core business rule: **Users must opt-in to receive employer invitations**

## Root Cause
1. **Database RLS policies** do NOT check `visible_to_employers`
2. **Application services** (`employer-invitations.ts`) do NOT verify opt-in status
3. **UI components** have partial checks but not comprehensive

## Fix Applied

### 1. Database Level (RLS Policies) ✅
**File:** `scripts/fix-invitation-optin-security.sql`

**Changes:**
- Updated `"Users can view own invitations"` → `"Users can view own invitations if opted in"`
- Updated `"Users can update own invitations"` → `"Users can update own invitations if opted in"`
- Updated `"Employer admins can create invitations"` → `"Employer admins can create invitations for opted-in users"`

**Effect:** Database will reject queries for non-opted-in users automatically

### 2. Application Level (Defense in Depth)
**File:** `src/lib/services/employer-invitations.ts`

**Required Changes:**
- Add opt-in check to `getUserInvitations()`
- Add opt-in check to `getRecentInvitations()`
- Add opt-in check to `getUnreadInvitationCount()`
- Validate opt-in before any invitation actions

### 3. UI Level
**Files:** 
- `src/components/ui/notification-dropdown.tsx` ✅ (already checks)
- `src/components/ui/user-menu.tsx` ✅ (already hides link)
- `src/app/(main)/invitations/page.tsx` (needs verification)

## Testing Checklist

### Database Level
- [ ] Run `fix-invitation-optin-security.sql`
- [ ] Verify policies updated correctly
- [ ] Test: User with `visible_to_employers = false` cannot query invitations
- [ ] Test: Employer cannot create invitation for non-opted-in user

### Application Level
- [ ] Update service functions with opt-in checks
- [ ] Test: Non-opted-in user gets empty array from `getUserInvitations()`
- [ ] Test: Notification count is 0 for non-opted-in users
- [ ] Test: Error thrown if non-opted-in user tries to respond to invitation

### UI Level
- [ ] Test: `/invitations` page shows "opt-in required" message for non-opted-in users
- [ ] Test: Notification bell hidden for non-opted-in users
- [ ] Test: User menu doesn't show "Invitations" link for non-opted-in users

## Priority
**HIGH PRIORITY** - This is a core business rule violation and potential privacy issue.

## Deployment Steps
1. Run database migration: `fix-invitation-optin-security.sql`
2. Update application services (see next section)
3. Deploy to production
4. Verify with test accounts

## Next: Application Service Updates
See: `src/lib/services/employer-invitations.ts` - needs opt-in validation added to all user-facing functions.
