'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui/loading-spinner';
import RoleEditorPage from '@/app/admin/roles/[id]/page';

/**
 * Employer "New Role" Page
 * 
 * This is a thin wrapper around the admin role editor.
 * It automatically populates company_id from the employer's profile
 * and hides fields that employers shouldn't see/edit.
 */
export default function EmployerNewRolePage() {
  const router = useRouter();
  const { profile, loading, isEmployerAdmin, isSuperAdmin } = useAuth();

  // Auth checks
  if (loading) {
    return <PageLoader text="Loading..." />;
  }

  if (!profile || (!isEmployerAdmin && !isSuperAdmin)) {
    router.push('/employer');
    return null;
  }

  if (!profile.company_id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">No company associated with your account.</div>
      </div>
    );
  }

  // Render the admin role editor with employer context
  return (
    <RoleEditorPage 
      params={{ id: 'new' }}
      context="employer"
      companyId={profile.company_id}
    />
  );
}
