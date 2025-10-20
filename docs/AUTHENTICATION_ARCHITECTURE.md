# Authentication Architecture: Multi-Portal Sign-In System

**Status:** ✅ Complete  
**Date:** January 20, 2025  
**Version:** 1.0

---

## Overview

SkillSync implements a **multi-portal authentication system** with separate sign-in experiences for different user types:
- **Job Seekers** - Main application portal
- **Employers** - Employer dashboard portal
- **Providers** - Education provider portal
- **Super Admins** - Can access all portals

---

## Architecture

### Portal Structure

```
Authentication Portals:
├── /auth/signin              → Job Seekers
├── /employer/auth/signin     → Employers
└── /provider/auth/signin     → Providers

Dashboards:
├── /                         → Job Seeker Home
├── /employer                 → Employer Dashboard
├── /provider                 → Provider Dashboard
└── /admin                    → Super Admin (super_admin only)
```

### User Roles

```typescript
type UserRole = 
  | 'user'              // Job seeker
  | 'basic_user'        // Job seeker (legacy)
  | 'employer_admin'    // Employer
  | 'provider_admin'    // Provider
  | 'super_admin'       // Super admin

type AdminRole =
  | 'super_admin'       // Full system access
  | 'company_admin'     // Employer admin
  | 'provider_admin'    // Provider admin
  | null                // Not an admin
```

---

## Implementation

### 1. Reusable Sign-In Component

**File:** `/src/components/auth/sign-in-form.tsx`

```typescript
<SignInForm 
  variant="jobseeker" | "employer" | "provider"
  showSignUpLink={boolean}
  onSuccess={(profile) => void}
/>
```

**Features:**
- Portal validation after authentication
- Automatic redirect to correct portal if wrong
- Full page reload to ensure auth state propagation
- Custom branding per portal

### 2. Portal Pages

**Job Seeker:** `/src/app/(main)/auth/signin/page.tsx`
```typescript
<SignInForm variant="jobseeker" />
```

**Employer:** `/src/app/(main)/employer/auth/signin/page.tsx`
```typescript
<SignInForm variant="employer" showSignUpLink={false} />
{alert === 'portal-signin' && <PortalRedirectAlert portalName="Employer" />}
```

**Provider:** `/src/app/(main)/provider/auth/signin/page.tsx`
```typescript
<SignInForm variant="provider" showSignUpLink={false} />
{alert === 'portal-signin' && <PortalRedirectAlert portalName="Provider" />}
```

### 3. Portal Redirect Alert

**File:** `/src/components/auth/portal-redirect-alert.tsx`

Dark-themed alert (#101929) shown when user tries to sign in at wrong portal:
- White text and icon
- Single-line, content-hugging
- Positioned at top of page

### 4. Middleware Protection

**File:** `/src/middleware.ts`

**Route Protection Logic:**
1. Allow API routes (self-authenticated)
2. Allow unauthenticated users on auth pages
3. Redirect unauthenticated users from protected routes to appropriate portal
4. Redirect authenticated users from main auth routes to home
5. Redirect authenticated users from portal auth routes to their dashboard
6. Protect admin routes with role verification

**Portal-Specific Redirects:**
```typescript
// Unauthenticated access
/employer → /employer/auth/signin
/provider → /provider/auth/signin
/         → /auth/signin

// Authenticated on portal auth page
/employer/auth/signin → /employer (if authenticated)
/provider/auth/signin → /provider (if authenticated)
```

### 5. Auth Layout Wrapper

**File:** `/src/components/auth/auth-layout-wrapper.tsx`

**Responsibilities:**
- Hide navbar on ALL auth pages (including portal auth)
- Show navbar on dashboards
- Load company data for employer navbar

```typescript
const isAuthPage = pathname?.startsWith('/auth/') || 
                   pathname === '/employer/auth/signin' || 
                   pathname === '/provider/auth/signin'

const isEmployerPage = pathname?.startsWith('/employer') && 
                       !pathname?.startsWith('/employer/auth')
```

### 6. Sign-Out Logic

**File:** `/src/hooks/useAuth.ts`

**Role-Based Logout:**
```typescript
const signOut = async () => {
  let redirectUrl = '/auth/signin'
  
  if (profile?.role === 'employer_admin' || profile?.admin_role === 'company_admin') {
    redirectUrl = '/employer/auth/signin'
  } else if (profile?.role === 'provider_admin' || profile?.admin_role === 'provider_admin') {
    redirectUrl = '/provider/auth/signin'
  }
  
  await supabase.auth.signOut()
  window.location.href = redirectUrl
}
```

**Also Updated:**
- Employer page header logout → `/employer/auth/signin`
- Deactivate account dialog → `/employer/auth/signin`

---

## User Flows

### Sign-In Flow (Correct Portal)

```
1. User goes to /employer/auth/signin
2. Enters credentials
3. SignInForm validates portal access
4. Role matches portal → Success
5. window.location.href = '/employer'
6. Full page reload with fresh auth state
7. Middleware allows access
8. Employer dashboard loads
```

### Sign-In Flow (Wrong Portal)

```
1. User goes to /auth/signin (job seeker)
2. Enters employer credentials
3. SignInForm validates portal access
4. Role doesn't match portal → Wrong portal detected
5. window.location.href = '/employer/auth/signin?alert=portal-signin'
6. PortalRedirectAlert shows: "Employer Portal Required"
7. User signs in at correct portal
8. Redirects to /employer dashboard
```

### Sign-Out Flow

```
1. User clicks logout
2. useAuth.signOut() checks user role
3. Determines correct portal (/employer/auth/signin)
4. Calls supabase.auth.signOut()
5. window.location.href = '/employer/auth/signin'
6. User sees employer sign-in page
```

### Unauthenticated Access

```
1. User goes to /employer (not signed in)
2. Middleware detects no session
3. Redirects to /employer/auth/signin
4. User signs in
5. Middleware redirects to /employer
6. Dashboard loads
```

---

## Key Design Decisions

### 1. Full Page Reload vs Client-Side Navigation

**Decision:** Use `window.location.href` instead of `router.push()`

**Reason:**
- Ensures auth state is fully propagated
- Prevents "hanging" on loading screens
- Middleware gets fresh session data
- No race conditions with auth state

### 2. Portal-Specific Auth Pages

**Decision:** Separate sign-in pages for each portal

**Reason:**
- Clear user experience (employers know where to go)
- Custom branding per portal
- No confusion about which portal to use
- Scalable for future user types

### 3. Middleware-Based Protection

**Decision:** Handle redirects at middleware level

**Reason:**
- Server-side protection (more secure)
- Consistent across all routes
- No client-side flash of wrong content
- Single source of truth for routing logic

### 4. No Navbar on Auth Pages

**Decision:** Hide navbar on all auth pages

**Reason:**
- Clean, focused sign-in experience
- Matches industry standards
- No distractions during authentication
- Consistent across all portals

---

## Security Considerations

### 1. Portal Validation

After successful authentication, the system validates that the user is signing in at the correct portal:

```typescript
const validatePortalAccess = async (userId: string) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Check role matches portal
  if (variant === 'employer' && !isEmployerAdmin) {
    return { isValid: false, correctPortal: '/employer/auth/signin' }
  }
  
  return { isValid: true, profile }
}
```

### 2. Middleware Protection

All protected routes require authentication:
```typescript
if (!user && pathname.startsWith('/employer')) {
  return NextResponse.redirect('/employer/auth/signin')
}
```

### 3. Session Refresh

Middleware refreshes session on every request:
```typescript
const { data: { session } } = await supabase.auth.getSession()
```

### 4. Super Admin Access

Super admins can access all portals but default to admin dashboard:
```typescript
if (profile.admin_role === 'super_admin') {
  return { isValid: true, profile } // Allow any portal
}
```

---

## Files Modified

### Core Files
1. `/src/components/auth/sign-in-form.tsx` - Reusable sign-in component
2. `/src/components/auth/portal-redirect-alert.tsx` - Wrong portal alert
3. `/src/components/auth/auth-layout-wrapper.tsx` - Layout with navbar logic
4. `/src/hooks/useAuth.ts` - Auth hook with role-based logout
5. `/src/middleware.ts` - Route protection and redirects

### Portal Pages
6. `/src/app/(main)/auth/signin/page.tsx` - Job seeker sign-in
7. `/src/app/(main)/employer/auth/signin/page.tsx` - Employer sign-in
8. `/src/app/(main)/provider/auth/signin/page.tsx` - Provider sign-in

### Dashboard Pages
9. `/src/app/(main)/employer/page.tsx` - Employer dashboard (logout fix)
10. `/src/components/employer/settings/deactivate-account-dialog.tsx` - Deactivate redirect

### Cleanup
11. `/src/app/(main)/page.tsx` - Removed old redirect logic

---

## Testing Checklist

### Sign-In Flows
- ✅ Job seeker at `/auth/signin` → `/`
- ✅ Employer at `/employer/auth/signin` → `/employer`
- ✅ Provider at `/provider/auth/signin` → `/provider`
- ✅ Wrong portal detection with alert redirect

### Sign-Out Flows
- ✅ Employer logout → `/employer/auth/signin`
- ✅ Provider logout → `/provider/auth/signin`
- ✅ Job seeker logout → `/auth/signin`

### Unauthenticated Access
- ✅ `/employer` without auth → `/employer/auth/signin`
- ✅ `/provider` without auth → `/provider/auth/signin`
- ✅ `/` without auth → `/auth/signin`

### UI/UX
- ✅ No navbar on any auth pages
- ✅ Dark alert (#101929) with white text/icon
- ✅ Alert hugs content, single line
- ✅ Full page reload prevents hanging
- ✅ No redundant toast notifications

---

## Future Enhancements

### Potential Improvements
1. **Custom Branding** - Different logos/colors per portal
2. **SSO Integration** - Single sign-on for enterprise employers
3. **2FA** - Two-factor authentication for admin portals
4. **Session Management** - Remember device, auto-logout
5. **Audit Logging** - Track sign-ins per portal
6. **Password Policies** - Different requirements per user type

### Scalability
- Easy to add new portals (e.g., `/partner/auth/signin`)
- Reusable components support new variants
- Middleware logic is extensible
- Role-based system supports new user types

---

## Troubleshooting

### Issue: User stuck on loading screen after sign-in
**Cause:** Using `router.push()` instead of `window.location.href`  
**Fix:** Always use `window.location.href` for post-auth redirects

### Issue: Wrong dashboard shows briefly
**Cause:** Client-side redirect in page component  
**Fix:** Handle redirects in middleware (server-side)

### Issue: Navbar shows on auth pages
**Cause:** `isAuthPage` check doesn't include portal auth routes  
**Fix:** Update `AuthLayoutWrapper` to check all auth routes

### Issue: Logout goes to wrong portal
**Cause:** Hardcoded redirect in logout function  
**Fix:** Use role-based redirect in `useAuth.signOut()`

---

## Related Documentation

- [COMPLETE_SYSTEM_STATUS.md](./COMPLETE_SYSTEM_STATUS.md) - Overall system status
- [skill-sync-technical-architecture.md](./skill-sync-technical-architecture.md) - Technical architecture
- [ROLE_EDITOR_ARCHITECTURE.md](./ROLE_EDITOR_ARCHITECTURE.md) - Role management
- [HDO_PIVOT_IMPLEMENTATION_PLAN.md](./HDO_PIVOT_IMPLEMENTATION_PLAN.md) - High-demand occupations

---

## Maintenance Notes

### When Adding a New User Type
1. Add role to `UserRole` type in `useAuth.ts`
2. Create new portal auth page (e.g., `/partner/auth/signin/page.tsx`)
3. Add variant to `SignInForm` component
4. Update middleware portal routes
5. Update `AuthLayoutWrapper` auth page check
6. Add logout redirect in `useAuth.signOut()`
7. Test all flows

### When Modifying Auth Logic
1. Update middleware first (server-side)
2. Update `SignInForm` validation
3. Update `useAuth` hook
4. Test with all user types
5. Verify no regressions in existing portals
