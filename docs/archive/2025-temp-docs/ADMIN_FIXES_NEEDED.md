# Admin Tools Issues - October 2, 2025

## ✅ FIXED: Roles & Occupations Pages

**Issue:** "Failed to load jobs" error
**Root Cause:** Hardcoded `.order('name')` but jobs table has `title` column
**Fix:** Dynamic column selection based on table name
**Status:** RESOLVED

## Remaining Issues

### Verified Working (Service Role):
- ✅ Featured roles query returns 5 results
- ✅ Occupations query returns 5 results  
- ✅ Admin audit logs table exists with 5 records
- ✅ Skills table has all 34,863 records

### Still To Check:
- ⚠️ Dashboard recent activity - May need testing
- ⚠️ /admin/skills - Pagination (shows 50 items per page, which is correct)

## Issues Found

### 1. RLS Policies Blocking Admin Access
**Issue:** Admin users can't query jobs, audit logs through client
**Root Cause:** RLS policies on `jobs` and `admin_audit_logs` tables don't allow admin role
**Fix Required:** Update RLS policies to allow admin users

**SQL Needed:**
```sql
-- Allow admins to read all jobs
CREATE POLICY "Admins can read all jobs"
ON jobs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'company_admin', 'provider_admin')
  )
);

-- Allow admins to read audit logs
CREATE POLICY "Admins can read audit logs"
ON admin_audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'company_admin', 'provider_admin')
  )
);

-- Allow admins to read all skills
CREATE POLICY "Admins can read all skills"
ON skills FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'company_admin', 'provider_admin')
  )
);
```

### 2. Skills Pagination Display
**Issue:** Shows "Page 1 of 1" with only 50 items visible
**Root Cause:** RLS blocking full count, or pagination state issue
**Status:** Backend has limit(50000), but client may not be getting all data
**Fix:** After RLS fix, verify pagination works

### 3. Settings Page Placeholder
**Question:** What should go here?
**Options:**
- A) System settings (OpenAI model selection, API configuration)
- B) User profile settings (name, email, password)
- C) Platform configuration (features, limits)
- D) Remove if not needed for MVP

## Recommended Action Plan

### Option 1: Quick Fix (Recommended for Now)
**Skip RLS fixes, focus on next priorities**
- Document these as known issues
- Fix after UI integration phase
- Admin tools work with direct database access for now

### Option 2: Fix RLS Now
**Add proper admin policies**
- Run SQL to add admin RLS policies
- Test all admin pages
- Verify pagination works
- ~30-60 minutes of work

## Decision Needed

Which approach do you prefer?
1. Document and move on (focus on UI integration)
2. Fix RLS policies now (30-60 min detour)
