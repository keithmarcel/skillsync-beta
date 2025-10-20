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
  if (!user && (protectedRoutes.some(r => pathname.startsWith(r)) || adminRoutes.some(r => pathname.startsWith(r)))) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // 4. Redirect authenticated users away from main auth routes (they should use portal routes or be logged in)
  if (user && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 5. Allow portal auth routes for authenticated users (they handle role validation internally)
  if (user && portalAuthRoutes.includes(pathname)) {
    return response;
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
