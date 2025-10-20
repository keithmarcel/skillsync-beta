# Complete Auth System Fix

## Issues Found & Fixed

### 1. ✅ RLS Policy Infinite Recursion (FIXED)
**Problem:** The profiles table had RLS policies that caused infinite recursion when checking admin roles.

**Fix Applied:** Migration `20251004013000_fix_profiles_rls_recursion.sql`
- Removed recursive policies
- Created simple policies: users can only see/update their own profile
- Admin access now uses service_role key (bypasses RLS)

### 2. ✅ useAuth Hook Checking Wrong Field (FIXED)
**Problem:** The `useAuth` hook was checking `profile.role` instead of `profile.admin_role` for admin access.

**Fix Applied:** Updated `/src/hooks/useAuth.ts`
```typescript
// Before:
isAdmin: profile?.role === 'super_admin'

// After:
isAdmin: profile?.admin_role !== null && profile?.admin_role !== undefined
isSuperAdmin: profile?.admin_role === 'super_admin'
```

### 3. ✅ Your Data Status

**Keith Woods Profile:**
- ✅ ID: 72b464ef-1814-4942-b69e-2bdffd390e61
- ✅ Role: super_admin
- ✅ Admin Role: super_admin
- ✅ Name: Keith Woods
- ✅ Avatar: https://rzpywoxtrclvodpiqiqq.supabase.co/storage/v1/object/public/avatars/72b464ef-1814-4942-b69e-2bdffd390e61/avatar.png
- ✅ Invitations: 5 (archived, declined, applied)
- ✅ Assessments: 5 assessments in database

## What Should Work Now

### ✅ User Menu
- Avatar should display in navbar
- Dropdown menu should show:
  - Account Settings
  - My Assessments
  - **Admin Tools** (because you're super_admin)
  - Sign Out

### ✅ Invitations Page
- Should show your 5 invitations
- Statuses: archived, declined, applied

### ✅ My Assessments
- Should show your 5 assessments

### ✅ Admin Access
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/companies` - Company management
- All other admin pages

## How to Apply the Fix

### Step 1: Clear Browser Session
```bash
# In browser console (Cmd+Option+J):
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Step 2: Sign Out and Back In
1. Go to your site
2. Click avatar (if visible) → Sign Out
3. Or go to `/auth/signout`
4. Sign back in at `/auth/signin`

### Step 3: Verify
Go to `/refresh-auth` to see your auth status

## Why This Happened

1. **RLS Recursion:** The old migration tried to check admin_role by querying profiles while already querying profiles
2. **Wrong Field Check:** Code was checking `role` field instead of `admin_role` field
3. **Cached Session:** Browser had old auth state cached

## Technical Details

### RLS Policies (New)
```sql
-- Simple, non-recursive policies
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);
```

### Auth Hook (Fixed)
```typescript
isAdmin: profile?.admin_role !== null
isSuperAdmin: profile?.admin_role === 'super_admin'
isCompanyAdmin: profile?.admin_role === 'company_admin'
```

## Files Modified

1. `/supabase/migrations/20251004013000_fix_profiles_rls_recursion.sql` - Fixed RLS
2. `/src/hooks/useAuth.ts` - Fixed admin detection
3. `/src/app/refresh-auth/page.tsx` - Added diagnostic page
4. `/scripts/comprehensive-auth-check.js` - Added diagnostic script

## Testing Checklist

- [ ] Avatar shows in navbar
- [ ] User menu dropdown works
- [ ] "Admin Tools" appears in menu
- [ ] Can access `/admin`
- [ ] Invitations page shows 5 invitations
- [ ] My Assessments shows 5 assessments
- [ ] Profile data loads correctly

## If Still Not Working

1. **Hard refresh:** Cmd+Shift+R
2. **Incognito mode:** Test in private window
3. **Check console:** Look for errors in browser console
4. **Run diagnostic:** Go to `/refresh-auth`
5. **Check session:** Run `scripts/comprehensive-auth-check.js`
