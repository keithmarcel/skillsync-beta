'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Toaster } from '@/components/ui/toaster';
import { ViewAsBanner } from '@/components/ViewAsBanner';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GeistSans } from 'geist/font/sans';
import { PageLoader } from '@/components/ui/loading-spinner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile, loading, isAdmin, isSuperAdmin, isCompanyAdmin, isProviderAdmin } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated or not an admin
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin?redirectedFrom=admin');
    } else if (!loading && user && !isAdmin && !isSuperAdmin && !isCompanyAdmin && !isProviderAdmin) {
      // User is logged in but doesn't have admin access
      router.push('/unauthorized');
    }
  }, [user, loading, isAdmin, isSuperAdmin, isCompanyAdmin, isProviderAdmin, router]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading state while checking auth or before the component has mounted
  if (!isMounted || loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <PageLoader text="Loading Admin..." />
      </div>
    );
  }

  // Check if user has any admin role
  const hasAdminAccess = isAdmin || isSuperAdmin || isCompanyAdmin || isProviderAdmin;
  
  if (!hasAdminAccess) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden bg-gray-50 ${GeistSans.className}`}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto md:ml-0">
        <div className="p-4 md:p-8 w-full">
          {children}
        </div>
      </main>
      <ViewAsBanner />
      <Toaster />
    </div>
  );
}
