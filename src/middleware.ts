import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // This line is crucial for the SSR pattern. It refreshes the session cookie
  // on the server, preventing the client-side hang.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  const { pathname } = request.nextUrl;

  // --- Define Route Groups ---
  const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/reset-password', '/auth/forgot-password', '/auth/verify-email'];
  const authRoutes = ['/auth/signin', '/auth/signup', '/auth/reset-password', '/auth/forgot-password', '/auth/verify-email']; // Routes for unauthenticated users
  const protectedRoutes = ['/', '/jobs', '/programs', '/assessments', '/profile']; // Routes for any authenticated user
  const adminRoutes = ['/admin']; // Routes for admin users only
  const apiRoutes = ['/api']; // API routes - allow for now

  // --- Route Protection Logic ---

  // Skip middleware for API routes (for now)
  if (apiRoutes.some(r => pathname.startsWith(r))) {
    return response;
  }

  // Skip middleware for auth routes if user is not authenticated
  if (!user && authRoutes.includes(pathname)) {
    return response;
  }

  // 1. If user is not logged in and trying to access a protected or admin route
  if (!user && (protectedRoutes.some(r => pathname.startsWith(r)) || adminRoutes.some(r => pathname.startsWith(r)))) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // 2. If user is logged in and trying to access an auth route (like signin page)
  if (user && authRoutes.includes(pathname)) {
    // Fetch profile to determine correct dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, admin_role')
      .eq('id', user.id)
      .single();

    // Redirect to appropriate dashboard based on role
    if (profile?.role === 'employer_admin' || profile?.admin_role === 'company_admin') {
      return NextResponse.redirect(new URL('/employer', request.url));
    } else if (profile?.role === 'provider_admin' || profile?.admin_role === 'provider_admin') {
      return NextResponse.redirect(new URL('/provider', request.url));
    } else if (profile?.admin_role === 'super_admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // Default to home page for regular users
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2b. If employer/provider admin tries to access home page, redirect to their dashboard
  if (user && pathname === '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, admin_role')
      .eq('id', user.id)
      .single();

    // Redirect admins to their dashboards (unless they're super admin who can see everything)
    if (profile?.admin_role !== 'super_admin') {
      if (profile?.role === 'employer_admin' || profile?.admin_role === 'company_admin') {
        return NextResponse.redirect(new URL('/employer', request.url));
      } else if (profile?.role === 'provider_admin' || profile?.admin_role === 'provider_admin') {
        return NextResponse.redirect(new URL('/provider', request.url));
      }
    }
  }

  // 3. If user is trying to access an admin route, check for admin role
  if (user && adminRoutes.some(r => pathname.startsWith(r))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('admin_role')
      .eq('id', user.id)
      .single();

    if (!profile?.admin_role) {
      // Not an admin, redirect to home page
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // If no redirection is needed, continue to the requested page
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - app/ (public assets)
     * - assets/ (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|app/|assets/).*)',
  ],
};
