# Account Settings Deployment - Blockers & Status

**Date:** October 2, 2025  
**Status:** ⚠️ Blocked by Migration Conflicts

---

## 🚧 Current Blocker

**Issue:** Cannot push migrations to remote database due to existing policy conflicts

**Error:** Multiple migrations have policies that already exist in the remote database, causing `SQLSTATE 42710` errors.

**Affected Migrations:**
- `20250917200000_create_admin_audit_logs.sql` - ✅ Fixed
- `20250928000000_occupation_data_cache.sql` - ✅ Fixed  
- `20250930000002_align_programs_with_jobs.sql` - ✅ Fixed
- `20250930000006_add_program_jobs_junction.sql` - ✅ Fixed
- Additional migrations may have similar issues

---

## ✅ What's Complete (Local)

### **Database Schema:**
- ✅ User settings fields migration created
- ✅ Avatars storage bucket migration created
- ✅ All migrations applied locally
- ✅ Local database fully functional

### **API Endpoints:**
- ✅ `/api/user/avatar` - Avatar upload
- ✅ `/api/user/profile` - Profile updates
- ✅ `/api/user/account` - Account updates
- ✅ `/api/user/notifications` - Notification preferences

### **UI Components:**
- ✅ Account settings page with 3 tabs
- ✅ ProfileTab component
- ✅ AccountTab component
- ✅ NotificationsTab component
- ✅ All validation logic implemented

---

## ⚠️ What's Blocked

### **Remote Database:**
- ❌ Migrations not pushed to production
- ❌ Schema missing new fields:
  - `bio`
  - `visible_to_employers`
  - `notif_in_app_invites`
  - `notif_in_app_new_roles`
  - `notif_email_new_roles`
  - `notif_email_invites`
  - `notif_email_marketing`
  - `notif_email_security`
  - `notif_all_disabled`
- ❌ Avatars bucket not created in remote storage

---

## 🔧 Solutions

### **Option 1: Manual SQL Execution (Recommended)**
Run only the account settings migrations directly in Supabase SQL Editor:

```sql
-- 1. Add user settings fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS visible_to_employers BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notif_in_app_invites BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notif_in_app_new_roles BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notif_email_new_roles BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notif_email_invites BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notif_email_marketing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notif_email_security BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notif_all_disabled BOOLEAN DEFAULT false;

-- 2. Add comments
COMMENT ON COLUMN public.profiles.bio IS 'User bio/about section for career goals';
COMMENT ON COLUMN public.profiles.visible_to_employers IS 'Privacy setting - allow employers to invite user to apply';
-- (add remaining comments from migration file)
```

Then manually create avatars bucket in Supabase Dashboard:
1. Go to Storage
2. Create new bucket named "avatars"
3. Make it public
4. Add RLS policies from migration file

### **Option 2: Fix All Migrations**
Continue adding `DROP POLICY IF EXISTS` to all remaining migrations with conflicts, then push all at once.

### **Option 3: Skip Conflicting Migrations**
Mark conflicting migrations as applied without running them (risky - may cause inconsistencies).

---

## 📊 Testing Status

**Local Testing:** ✅ Ready  
**Remote Testing:** ❌ Blocked (schema missing)

**Test Script:** `/scripts/test-account-settings-db.js`  
**Manual Checklist:** `/docs/testing/ACCOUNT_SETTINGS_TEST_CHECKLIST.md`

---

## 🎯 Immediate Next Steps

1. **Choose deployment strategy** (Option 1 recommended for speed)
2. **Apply schema changes** to remote database
3. **Create avatars bucket** in remote storage
4. **Run test script** against remote database
5. **Manual UI testing** in browser
6. **Fix UI issues** identified during testing

---

## 📝 Notes

- Local development environment is fully functional
- All code is production-ready
- Only blocker is database schema sync
- Estimated time to unblock: 15-30 minutes (Option 1)

---

## 🔗 Related Files

- Migration: `/supabase/migrations/20251002170100_user_settings_fields.sql`
- Migration: `/supabase/migrations/20251002173500_create_avatars_bucket.sql`
- Test Script: `/scripts/test-account-settings-db.js`
- Status Doc: `/docs/ACCOUNT_SETTINGS_STATUS.md`
