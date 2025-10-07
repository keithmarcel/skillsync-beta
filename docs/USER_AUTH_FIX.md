# User Authentication System Fix

## Problem Summary
Keith Woods user was correctly set up in the database but couldn't access admin tools or see assessments due to incorrect authentication logic in the `useAuth` hook.

## Root Cause
The `useAuth` hook was checking `profile.role` instead of `profile.admin_role` to determine admin access. This caused a mismatch where:
- Database had: `role: 'super_admin'` AND `admin_role: 'super_admin'`
- Code was checking: Only `role` field
- Admin pages expected: `admin_role` field

## What Was Fixed

### 1. Updated Profile Interface (`/src/hooks/useAuth.ts`)
**Before:**
```typescript
role: 'super_admin' | 'provider_admin' | 'employer_admin' | 'user'
// Missing admin_role field
```

**After:**
```typescript
role: 'super_admin' | 'provider_admin' | 'employer_admin' | 'partner_admin' | 'org_user' | 'user' | 'basic_user'
admin_role?: 'super_admin' | 'company_admin' | 'provider_admin' | null
```

### 2. Fixed Admin Role Detection
**Before:**
```typescript
isAdmin: profile?.role === 'super_admin' || profile?.role === 'employer_admin' || profile?.role === 'provider_admin',
isSuperAdmin: profile?.role === 'super_admin',
```

**After:**
```typescript
isAdmin: profile?.admin_role !== null && profile?.admin_role !== undefined,
isSuperAdmin: profile?.admin_role === 'super_admin',
isEmployerAdmin: profile?.role === 'employer_admin' || profile?.admin_role === 'company_admin',
isProviderAdmin: profile?.role === 'provider_admin' || profile?.admin_role === 'provider_admin',
isCompanyAdmin: profile?.admin_role === 'company_admin',
```

### 3. Added RLS Policies for Admin Access
Created migration: `20251003190000_fix_admin_profiles_access.sql`

**New Policy:**
```sql
CREATE POLICY "Admin users can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.id = auth.uid()
            AND admin_check.admin_role IS NOT NULL
        )
        OR auth.uid() = id
    );
```

This allows any user with `admin_role` set to view all profiles in the admin dashboard.

## Database Verification

### Keith Woods User Status (Verified ✅)
```
Auth ID: 72b464ef-1814-4942-b69e-2bdffd390e61
Profile ID: 72b464ef-1814-4942-b69e-2bdffd390e61 (MATCHES ✅)
Email: keith-woods@bisk.com
Name: Keith Woods
Role: super_admin
Admin Role: super_admin
Assessments: 7
Favorites: 3
```

### All Users in System (7 Total)
1. **Keith Woods** - Super Admin
2. **John Employer** - Company Admin (Power Design)
3. **Jane Smith** - Basic User
4. **Michael Johnson** - Basic User
5. **Sarah Williams** - Basic User
6. **David Brown** - Basic User
7. **Emily Davis** - Basic User

## What Now Works

✅ **Admin Access**
- Keith Woods can access `/admin` dashboard
- Can view all users in `/admin/users`
- Can manage companies, programs, occupations

✅ **User Dashboard**
- 7 assessments visible on homepage
- 3 favorites showing correctly
- Profile data loads properly

✅ **Role-Based Access**
- Super admins see everything
- Company admins see their company data
- Basic users see only their own data

## Testing Checklist

- [x] Keith Woods can log in
- [x] Keith Woods has super_admin role
- [x] Keith Woods can access /admin
- [x] Keith Woods can see all 7 users in admin dashboard
- [x] Keith Woods can see his 7 assessments
- [x] Keith Woods can see his 3 favorites
- [x] RLS policies allow admin access
- [x] Profile and auth IDs match

## Key Takeaways

### Role vs Admin Role
- **`role`**: User's base role (super_admin, partner_admin, org_user, basic_user)
- **`admin_role`**: Administrative privileges (super_admin, company_admin, provider_admin)
- Admin access should ALWAYS check `admin_role`, not `role`

### Authentication Flow
1. User signs in → Creates session in `auth.users`
2. Session loads profile from `profiles` table
3. `useAuth` hook computes admin flags from `admin_role`
4. RLS policies check `admin_role` for data access
5. UI components use `isAdmin`, `isSuperAdmin`, etc.

### Common Pitfalls
- ❌ Checking `role` instead of `admin_role` for admin access
- ❌ Mismatched IDs between auth.users and profiles
- ❌ RLS policies that don't account for admin_role
- ❌ Missing admin_role in TypeScript interfaces

## Files Modified
- `/src/hooks/useAuth.ts` - Fixed admin role detection
- `/supabase/migrations/20251003190000_fix_admin_profiles_access.sql` - RLS policies
- `/scripts/diagnose-keith-user.js` - Diagnostic tool (created)

## Future Improvements
1. Add better error messages when auth fails
2. Add loading states during profile fetch
3. Consider caching profile data to reduce queries
4. Add admin role audit logging
