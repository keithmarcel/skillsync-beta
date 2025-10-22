'use client'

import React from 'react'
import { UserRole, UserProfile } from './supabase-auth'

// Permission definitions for each user role
export const PERMISSIONS = {
  // Super Admin - Full system access
  SUPER_ADMIN: [
    'view_all_users',
    'manage_all_users', 
    'view_all_assessments',
    'manage_all_assessments',
    'view_all_favorites',
    'manage_all_favorites',
    'view_admin_dashboard',
    'manage_system_settings',
    'view_advanced_reports',
    'manage_companies',
    'manage_jobs',
    'manage_programs',
    'manage_user_roles',
  ],

  // Partner Admin - Main app + basic reporting
  PARTNER_ADMIN: [
    'view_main_app',
    'view_jobs',
    'view_programs', 
    'view_assessments',
    'manage_own_profile',
    'manage_own_favorites',
    'manage_own_assessments',
    'view_basic_reports',
    'view_basic_user_data',
  ],

  // Org User - Company data management only
  ORG_USER: [
    'manage_own_profile',
    'manage_company_data',
    'manage_company_jobs',
    'manage_company_logo',
    'manage_company_bio',
    'view_company_reports',
    'view_own_job_analytics',
  ],

  // Basic User - Standard app functionality
  BASIC_USER: [
    'view_main_app',
    'view_jobs',
    'view_programs',
    'view_assessments',
    'manage_own_profile',
    'manage_own_favorites',
    'manage_own_assessments',
    'take_skills_assessment',
  ],
} as const

export type Permission = 
  | typeof PERMISSIONS.SUPER_ADMIN[number]
  | typeof PERMISSIONS.PARTNER_ADMIN[number] 
  | typeof PERMISSIONS.ORG_USER[number]
  | typeof PERMISSIONS.BASIC_USER[number]

// Get permissions for a user role
export function getRolePermissions(role: UserRole): readonly Permission[] {
  switch (role) {
    case 'super_admin':
      return PERMISSIONS.SUPER_ADMIN
    case 'partner_admin':
      return PERMISSIONS.PARTNER_ADMIN
    case 'org_user':
      return PERMISSIONS.ORG_USER
    case 'basic_user':
      return PERMISSIONS.BASIC_USER
    default:
      return []
  }
}

// Check if user has specific permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = getRolePermissions(userRole)
  return rolePermissions.includes(permission as any)
}

// Check if user has any of the specified permissions
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

// Check if user has all of the specified permissions
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// Route access control
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  // Main app routes - require main app access
  '/': ['view_main_app'],
  '/jobs': ['view_jobs'],
  '/programs': ['view_programs'],
  '/assessments': ['view_assessments'],
  
  // User profile routes
  '/profile': ['manage_own_profile'],
  '/favorites': ['manage_own_favorites'],
  
  // Admin routes
  '/admin': ['view_admin_dashboard'],
  '/admin/users': ['manage_all_users'],
  '/admin/reports': ['view_advanced_reports'],
  '/admin/settings': ['manage_system_settings'],
  
  // Company management routes (for org users)
  '/company': ['manage_company_data'],
  '/company/jobs': ['manage_company_jobs'],
  '/company/profile': ['manage_company_data'],
  '/company/reports': ['view_company_reports'],
  
  // Partner admin routes
  '/partner': ['view_basic_reports'],
  '/partner/reports': ['view_basic_reports'],
}

// Check if user can access a route
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const requiredPermissions = ROUTE_PERMISSIONS[route]
  if (!requiredPermissions) {
    // If no specific permissions required, allow access
    return true
  }
  
  return hasAnyPermission(userRole, requiredPermissions)
}

// Get accessible routes for a user role
export function getAccessibleRoutes(userRole: UserRole): string[] {
  return Object.keys(ROUTE_PERMISSIONS).filter(route => 
    canAccessRoute(userRole, route)
  )
}

// Navigation items based on user role
export function getNavigationItems(userRole: UserRole) {
  const baseItems = [
    { href: '/', label: 'Home', permission: 'view_main_app' as Permission },
  ]

  const mainAppItems = [
    { href: '/jobs', label: 'Jobs', permission: 'view_jobs' as Permission },
    { href: '/programs', label: 'Programs', permission: 'view_programs' as Permission },
    { href: '/assessments', label: 'My Assessments', permission: 'view_assessments' as Permission },
  ]

  const profileItems = [
    { href: '/profile', label: 'Profile', permission: 'manage_own_profile' as Permission },
    { href: '/favorites', label: 'Favorites', permission: 'manage_own_favorites' as Permission },
  ]

  const adminItems = [
    { href: '/admin', label: 'Admin Dashboard', permission: 'view_admin_dashboard' as Permission },
    { href: '/admin/users', label: 'User Management', permission: 'manage_all_users' as Permission },
    { href: '/admin/reports', label: 'Advanced Reports', permission: 'view_advanced_reports' as Permission },
  ]

  const companyItems = [
    { href: '/company', label: 'Company Dashboard', permission: 'manage_company_data' as Permission },
    { href: '/company/jobs', label: 'Manage Jobs', permission: 'manage_company_jobs' as Permission },
    { href: '/company/reports', label: 'Company Reports', permission: 'view_company_reports' as Permission },
  ]

  const partnerItems = [
    { href: '/partner', label: 'Partner Dashboard', permission: 'view_basic_reports' as Permission },
    { href: '/partner/reports', label: 'Reports', permission: 'view_basic_reports' as Permission },
  ]

  const allItems = [
    ...baseItems,
    ...mainAppItems,
    ...profileItems,
    ...adminItems,
    ...companyItems,
    ...partnerItems,
  ]

  // Filter items based on user permissions
  return allItems.filter(item => hasPermission(userRole, item.permission))
}

// Component access control helper
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermission: Permission,
  fallback?: React.ComponentType<T>
) {
  return function PermissionWrapper(props: T & { userRole?: UserRole }) {
    const { userRole, ...componentProps } = props
    
    if (!userRole || !hasPermission(userRole, requiredPermission)) {
      if (fallback) {
        const FallbackComponent = fallback
        return React.createElement(FallbackComponent, componentProps as T)
      }
      return null
    }
    
    return React.createElement(Component, componentProps as T)
  }
}

// Hook for checking permissions in components
export function usePermissions(userRole?: UserRole) {
  return {
    hasPermission: (permission: Permission) => 
      userRole ? hasPermission(userRole, permission) : false,
    hasAnyPermission: (permissions: Permission[]) => 
      userRole ? hasAnyPermission(userRole, permissions) : false,
    hasAllPermissions: (permissions: Permission[]) => 
      userRole ? hasAllPermissions(userRole, permissions) : false,
    canAccessRoute: (route: string) => 
      userRole ? canAccessRoute(userRole, route) : false,
    getNavigationItems: () => 
      userRole ? getNavigationItems(userRole) : [],
  }
}
