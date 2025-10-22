import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Refresh the session cookie on the server (crucial for SSR pattern)
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const { pathname } = request.nextUrl;

  // --- Define Route Groups ---
  const authRoutes = ['/auth/signin', '/auth/signup', '/auth/reset-password', '/auth/forgot-password', '/auth/verify-email'];
  const portalAuthRoutes = ['/employer/auth/signin', '/provider/auth/signin'];
  const protectedRoutes = ['/', '/jobs', '/programs', '/assessments', '/profile', '/employer', '/provider'];
  const adminRoutes = ['/admin'];

  // --- Route Protection Logic ---

  // 1. Allow API routes (they handle their own auth)
  if (pathname.startsWith('/api')) {
    return response;
  }

  // 2. Allow unauthenticated users to access auth pages
  if (!user && (authRoutes.includes(pathname) || portalAuthRoutes.includes(pathname))) {
    return response;
  }

  // 3. Redirect unauthenticated users trying to access protected routes
  if (!user) {
    // Redirect to appropriate portal auth page based on route
    if (pathname.startsWith('/employer')) {
      return NextResponse.redirect(new URL('/employer/auth/signin', request.url));
    }
    if (pathname.startsWith('/provider')) {
      return NextResponse.redirect(new URL('/provider/auth/signin', request.url));
    }
    if (adminRoutes.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    if (protectedRoutes.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  // 4. Redirect authenticated users away from main auth routes (they should use portal routes or be logged in)
  if (user && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 5. Redirect authenticated users from portal auth routes to their dashboard
  if (user && portalAuthRoutes.includes(pathname)) {
    // If they're on employer auth page, send to employer dashboard
    if (pathname === '/employer/auth/signin') {
      return NextResponse.redirect(new URL('/employer', request.url));
    }
    // If they're on provider auth page, send to provider dashboard
    if (pathname === '/provider/auth/signin') {
      return NextResponse.redirect(new URL('/provider', request.url));
    }
  }

  // 6. Protect admin routes - verify admin role
  if (user && adminRoutes.some(r => pathname.startsWith(r))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('admin_role')
      .eq('id', user.id)
      .single();

    if (!profile?.admin_role) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 7. Prevent employers/providers from accessing main app (job seeker routes)
  if (user && !pathname.startsWith('/employer') && !pathname.startsWith('/provider') && !pathname.startsWith('/admin') && !authRoutes.includes(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, admin_role')
      .eq('id', user.id)
      .single();

    const isEmployerAdmin = profile?.role === 'employer_admin' || profile?.admin_role === 'company_admin';
    const isProviderAdmin = profile?.role === 'provider_admin' || profile?.admin_role === 'provider_admin';
    const isSuperAdmin = profile?.admin_role === 'super_admin';

    // Redirect employers to employer dashboard (except super admins)
    if (isEmployerAdmin && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/employer', request.url));
    }

    // Redirect providers to provider dashboard (except super admins)
    if (isProviderAdmin && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/provider', request.url));
    }
  }

  // Allow request to proceed
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
