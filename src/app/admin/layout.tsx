'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

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

  // Show loading state while checking auth
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar 
        isSuperAdmin={isSuperAdmin} 
        isCompanyAdmin={isCompanyAdmin} 
        isProviderAdmin={isProviderAdmin} 
      />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
