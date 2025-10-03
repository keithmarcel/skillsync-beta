# Account Settings - Manual Test Checklist

**Test Date:** October 2, 2025  
**Tester:** _____________  
**Environment:** Local Development

---

## Pre-Test Setup

- [ ] Database migrations applied (all 7 migrations)
- [ ] Avatars bucket created in Supabase Storage
- [ ] User logged in with valid session
- [ ] Navigate to `/account-settings`

---

## Profile Tab Tests

### Name Fields
- [ ] **Test:** Enter first name "John"
- [ ] **Test:** Enter last name "Doe"
- [ ] **Test:** Click "Update Profile Settings"
- [ ] **Verify:** Toast shows "Profile updated"
- [ ] **Verify DB:** Check `profiles` table - `first_name` = "John", `last_name` = "Doe"

### LinkedIn URL
- [ ] **Test:** Enter `https://www.linkedin.com/in/johndoe`
- [ ] **Test:** Click "Update Profile Settings"
- [ ] **Verify:** Toast shows "Profile updated"
- [ ] **Verify DB:** Check `profiles` table - `linkedin_url` = "https://www.linkedin.com/in/johndoe"

### LinkedIn URL Validation
- [ ] **Test:** Enter invalid URL `www.linkedin.com/johndoe` (missing https://)
- [ ] **Test:** Click "Update Profile Settings"
- [ ] **Verify:** Toast shows "Invalid LinkedIn URL" error
- [ ] **Verify DB:** URL should NOT be saved

### Bio
- [ ] **Test:** Enter bio text (e.g., "I'm a product designer...")
- [ ] **Test:** Click "Update Profile Settings"
- [ ] **Verify:** Toast shows "Profile updated"
- [ ] **Verify DB:** Check `profiles` table - `bio` contains entered text

### Employer Visibility Checkbox
- [ ] **Test:** Check "Allow Employers to Invite You to Apply" (without name/LinkedIn)
- [ ] **Test:** Click "Update Profile Settings"
- [ ] **Verify:** Toast shows "Name required" OR "LinkedIn URL required" error
- [ ] **Verify DB:** `visible_to_employers` should remain `false`

- [ ] **Test:** Fill in name AND LinkedIn URL
- [ ] **Test:** Check "Allow Employers to Invite You to Apply"
- [ ] **Test:** Click "Update Profile Settings"
- [ ] **Verify:** Toast shows "Profile updated"
- [ ] **Verify DB:** Check `profiles` table - `visible_to_employers` = `true`

### Avatar Upload
- [ ] **Test:** Click "Choose File" button
- [ ] **Test:** Select a valid image (JPG/PNG/WebP, < 2MB)
- [ ] **Verify:** Upload starts (shows "Uploading...")
- [ ] **Verify:** Toast shows "Avatar updated"
- [ ] **Verify:** Avatar image updates on page
- [ ] **Verify DB:** Check `profiles` table - `avatar_url` contains Supabase Storage URL
- [ ] **Verify Storage:** Check `avatars` bucket - file exists at `{user_id}/avatar.{ext}`

### Avatar Upload - File Size Validation
- [ ] **Test:** Try to upload file > 2MB
- [ ] **Verify:** Toast shows "File too large" error
- [ ] **Verify DB:** `avatar_url` should NOT change

### Avatar Upload - File Type Validation
- [ ] **Test:** Try to upload invalid file type (e.g., .pdf, .txt)
- [ ] **Verify:** Toast shows "Invalid file type" error
- [ ] **Verify DB:** `avatar_url` should NOT change

---

## Account Tab Tests

### Email Display
- [ ] **Verify:** Email field shows current user email (read-only)
- [ ] **Verify:** "Change Email" link is visible

### ZIP Code
- [ ] **Test:** Enter valid ZIP code "33701"
- [ ] **Test:** Click "Update Account Settings"
- [ ] **Verify:** Toast shows "Account updated"
- [ ] **Verify DB:** Check `profiles` table - `zip_code` = "33701"

### ZIP Code Validation
- [ ] **Test:** Try to enter invalid ZIP "123" (only 3 digits)
- [ ] **Verify:** HTML5 validation prevents submission OR shows error
- [ ] **Verify DB:** Invalid ZIP should NOT be saved

---

## Notifications Tab Tests

### In-App Notifications
- [ ] **Test:** Toggle "New application invites from employers" ON
- [ ] **Test:** Toggle "New roles and occupations added to SkillSync" OFF
- [ ] **Test:** Click "Update Notification Preferences"
- [ ] **Verify:** Toast shows "Preferences updated"
- [ ] **Verify DB:** Check `profiles` table:
  - `notif_in_app_invites` = `true`
  - `notif_in_app_new_roles` = `false`

### Email Notifications
- [ ] **Test:** Toggle "New roles and occupations" ON
- [ ] **Test:** Toggle "New application invites" ON
- [ ] **Test:** Toggle "Marketing emails" OFF
- [ ] **Test:** Toggle "Security emails" ON
- [ ] **Test:** Click "Update Notification Preferences"
- [ ] **Verify:** Toast shows "Preferences updated"
- [ ] **Verify DB:** Check `profiles` table:
  - `notif_email_new_roles` = `true`
  - `notif_email_invites` = `true`
  - `notif_email_marketing` = `false`
  - `notif_email_security` = `true`

### Turn Off All Notifications
- [ ] **Test:** Toggle "Turn off all notifications" ON
- [ ] **Verify:** All other notification toggles become disabled
- [ ] **Test:** Click "Update Notification Preferences"
- [ ] **Verify:** Toast shows "Preferences updated"
- [ ] **Verify DB:** Check `profiles` table:
  - `notif_all_disabled` = `true`
  - All other `notif_*` fields = `false`

### Re-enable Notifications
- [ ] **Test:** Toggle "Turn off all notifications" OFF
- [ ] **Verify:** All other notification toggles become enabled again
- [ ] **Test:** Toggle some notifications back ON
- [ ] **Test:** Click "Update Notification Preferences"
- [ ] **Verify DB:** `notif_all_disabled` = `false`, selected notifications = `true`

---

## Tab Navigation Tests

### Tab Switching
- [ ] **Test:** Click "Account" tab
- [ ] **Verify:** URL changes to `/account-settings?tab=account`
- [ ] **Verify:** Account content displays

- [ ] **Test:** Click "Notifications" tab
- [ ] **Verify:** URL changes to `/account-settings?tab=notifications`
- [ ] **Verify:** Notifications content displays

- [ ] **Test:** Click "Profile" tab
- [ ] **Verify:** URL changes to `/account-settings?tab=profile`
- [ ] **Verify:** Profile content displays

### Direct URL Access
- [ ] **Test:** Navigate directly to `/account-settings?tab=notifications`
- [ ] **Verify:** Notifications tab is active on page load

### Browser Navigation
- [ ] **Test:** Switch between tabs, then click browser back button
- [ ] **Verify:** Previous tab becomes active
- [ ] **Test:** Click browser forward button
- [ ] **Verify:** Next tab becomes active

---

## Page Header Tests

### Dynamic Subtitle
- [ ] **Verify:** On Profile tab, subtitle shows "Manage your profile information, avatar, and privacy settings."
- [ ] **Verify:** On Account tab, subtitle shows "Update your account details and manage your SkillSync account."
- [ ] **Verify:** On Notifications tab, subtitle shows "Control how and when you receive notifications from SkillSync."

---

## Database Verification Queries

Run these in Supabase SQL Editor to verify data persistence:

```sql
-- Check profile updates
SELECT 
  first_name, 
  last_name, 
  linkedin_url, 
  bio, 
  visible_to_employers,
  avatar_url,
  zip_code
FROM profiles 
WHERE id = '{your_user_id}';

-- Check notification preferences
SELECT 
  notif_in_app_invites,
  notif_in_app_new_roles,
  notif_email_new_roles,
  notif_email_invites,
  notif_email_marketing,
  notif_email_security,
  notif_all_disabled
FROM profiles 
WHERE id = '{your_user_id}';

-- Check avatar in storage
SELECT * FROM storage.objects 
WHERE bucket_id = 'avatars' 
AND name LIKE '{your_user_id}%';
```

---

## Test Results Summary

**Total Tests:** 40+  
**Passed:** _____  
**Failed:** _____  
**Blocked:** _____  

### Issues Found:
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### Notes:
_____________________________________________
_____________________________________________
_____________________________________________

---

**Test Completion Status:** ☐ Complete ☐ Incomplete  
**Ready for Production:** ☐ Yes ☐ No ☐ With Fixes
