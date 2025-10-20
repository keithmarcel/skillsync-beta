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
  const portalAuthRoutes = ['/employer/auth/signin', '/provider/auth/signin']; // Portal-specific auth routes
  const protectedRoutes = ['/', '/jobs', '/programs', '/assessments', '/profile']; // Routes for any authenticated user
  const adminRoutes = ['/admin']; // Routes for admin users only
  const apiRoutes = ['/api']; // API routes - allow for now

  // --- Route Protection Logic ---

  // Skip middleware for API routes (for now)
  if (apiRoutes.some(r => pathname.startsWith(r))) {
    return response;
  }

  // Skip middleware for auth routes if user is not authenticated
  if (!user && (authRoutes.includes(pathname) || portalAuthRoutes.includes(pathname))) {
    return response;
  }

  // 1. If user is not logged in and trying to access a protected or admin route
  if (!user && (protectedRoutes.some(r => pathname.startsWith(r)) || adminRoutes.some(r => pathname.startsWith(r)))) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // 2. If user is logged in and trying to access a main auth route (redirect to home)
  if (user && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. Allow portal auth routes even if user is logged in (they handle their own validation)
  if (user && portalAuthRoutes.includes(pathname)) {
    return response;
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
