'use client'

import { useAuth } from './useAuth'
import { useViewAs } from '@/contexts/ViewAsContext'

/**
 * Returns the effective role for the current user, taking into account ViewAs mode
 * Admin permissions are always preserved, but the main app view changes
 */
export function useEffectiveRole() {
  const auth = useAuth()
  const { viewAsMode, isViewingAs } = useViewAs()

  // If not viewing as someone else, return normal auth
  if (!isViewingAs) {
    return {
      ...auth,
      effectiveRole: auth.profile?.role,
      isViewingAs: false,
    }
  }

  // When viewing as someone else, override ONLY the role-based checks for main app
  // but preserve admin access
  const effectiveRole = viewAsMode === 'user' ? 'user' : 
                       viewAsMode === 'employer_admin' ? 'employer_admin' :
                       viewAsMode === 'provider_admin' ? 'provider_admin' : 
                       auth.profile?.role

  return {
    ...auth,
    // Override role for main app views
    effectiveRole,
    isViewingAs: true,
    // Keep admin flags unchanged so admin tools remain accessible
    // These are used by admin layout guards
  }
}
