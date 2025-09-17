import React from 'react'
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'super_admin' | 'company_admin' | 'provider_admin' | 'user';

/**
 * Hook to check if the current user has the required permissions
 * @param requiredRoles - Array of roles that have permission
 * @param resourceOwnerId - Optional ID of the resource owner for ownership checks
 */
export function useRBAC(requiredRoles: UserRole[], resourceOwnerId?: string) {
  const { user, isSuperAdmin, isCompanyAdmin, isProviderAdmin, profile } = useAuth();
  
  // If no user is logged in, no access
  if (!user) {
    return {
      hasAccess: false,
      isLoading: true,
      userRole: null,
      isOwner: false,
    };
  }

  // Determine the user's role
  let userRole: UserRole = 'user';
  if (isSuperAdmin) userRole = 'super_admin';
  else if (isCompanyAdmin) userRole = 'company_admin';
  else if (isProviderAdmin) userRole = 'provider_admin';

  // Check if the user has the required role
  const hasRoleAccess = requiredRoles.includes(userRole);
  
  // Check if the user is the owner of the resource (if resourceOwnerId is provided)
  const isOwner = resourceOwnerId ? user.id === resourceOwnerId : false;
  
  // Super admins have access to everything
  // Company/Provider admins have access to their own resources
  const hasAccess = isSuperAdmin || 
                   hasRoleAccess || 
                   (isCompanyAdmin && resourceOwnerId === profile?.company_id) ||
                   (isProviderAdmin && resourceOwnerId === profile?.school_id);

  return {
    hasAccess,
    isLoading: false,
    userRole,
    isOwner,
  };
}

/**
 * Higher-Order Component for protecting routes with RBAC
 */
export function withRBAC(
  WrappedComponent: React.ComponentType<any>,
  requiredRoles: UserRole[] = [],
  options: { resourceOwnerId?: string } = {}
) {
  return function RBACWrapper(props: any) {
    const { hasAccess, isLoading } = useRBAC(requiredRoles, options.resourceOwnerId);
    
    if (isLoading) {
      return React.createElement('div', 
        { className: "flex h-screen w-full items-center justify-center" },
        React.createElement('div', { 
          className: "h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" 
        })
      );
    }
    
    if (!hasAccess) {
      return React.createElement('div', 
        { className: "flex h-screen w-full items-center justify-center" },
        React.createElement('div', 
          { className: "text-center" },
          React.createElement('h1', { className: "text-2xl font-bold" }, "Access Denied"),
          React.createElement('p', { className: "text-muted-foreground" }, 
            "You don't have permission to access this page."
          )
        )
      );
    }
    
    return React.createElement(WrappedComponent, props);
  };
}

/**
 * Server-side RBAC check for API routes or getServerSideProps
 */
export function checkRBAC(
  userRole: UserRole | null,
  requiredRoles: UserRole[],
  options: { 
    resourceOwnerId?: string; 
    currentUserId?: string;
    companyId?: string;
    schoolId?: string;
  } = {}
) {
  // No user role means not authenticated
  if (!userRole) {
    return { hasAccess: false, isOwner: false };
  }
  
  // Super admins have access to everything
  if (userRole === 'super_admin') {
    return { hasAccess: true, isOwner: false };
  }
  
  // Check if user has the required role
  const hasRoleAccess = requiredRoles.includes(userRole);
  
  // Check ownership if resourceOwnerId is provided
  let isOwner = false;
  if (options.resourceOwnerId && options.currentUserId) {
    isOwner = options.resourceOwnerId === options.currentUserId;
  }
  
  // Check company or school ownership for respective admins
  const hasCompanyAccess = userRole === 'company_admin' && options.companyId && 
                         options.currentUserId === options.companyId;
  const hasSchoolAccess = userRole === 'provider_admin' && options.schoolId && 
                         options.currentUserId === options.schoolId;
  
  const hasAccess = hasRoleAccess || isOwner || hasCompanyAccess || hasSchoolAccess;
  
  return { hasAccess, isOwner };
}
