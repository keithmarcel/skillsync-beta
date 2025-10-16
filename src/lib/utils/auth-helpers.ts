/**
 * Authorization Helpers with ViewAs Support
 * 
 * These helpers check user authorization while respecting ViewAs mode for super admins.
 */

import { supabase } from '@/lib/supabase/client'

interface AuthCheckResult {
  authorized: boolean
  company_id?: string
  role?: string
  error?: string
}

/**
 * Check if user is authorized as employer admin (with ViewAs support)
 * Super admins viewing as employer_admin are automatically authorized
 */
export async function checkEmployerAdminAuth(): Promise<AuthCheckResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { authorized: false, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { authorized: false, error: 'Profile not found' }
  }

  // Check ViewAs mode from localStorage (client-side only)
  const viewAsMode = typeof window !== 'undefined' 
    ? localStorage.getItem('viewAsMode') 
    : null

  // Super admin viewing as employer_admin
  if (profile.role === 'super_admin' && viewAsMode === 'employer_admin') {
    // Get a default company for testing (Power Design)
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('name', 'Power Design')
      .single()

    return {
      authorized: true,
      company_id: company?.id,
      role: 'employer_admin' // Effective role
    }
  }

  // Regular employer admin check
  if (!profile.company_id || profile.role !== 'employer_admin') {
    return { 
      authorized: false, 
      error: 'Not authorized as employer admin',
      role: profile.role
    }
  }

  return {
    authorized: true,
    company_id: profile.company_id,
    role: profile.role
  }
}

/**
 * Check if user is authorized as provider admin (with ViewAs support)
 */
export async function checkProviderAdminAuth(): Promise<AuthCheckResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { authorized: false, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { authorized: false, error: 'Profile not found' }
  }

  // Check ViewAs mode
  const viewAsMode = typeof window !== 'undefined' 
    ? localStorage.getItem('viewAsMode') 
    : null

  // Super admin viewing as provider_admin
  if (profile.role === 'super_admin' && viewAsMode === 'provider_admin') {
    return {
      authorized: true,
      role: 'provider_admin'
    }
  }

  // Regular provider admin check
  if (profile.role !== 'provider_admin') {
    return { 
      authorized: false, 
      error: 'Not authorized as provider admin',
      role: profile.role
    }
  }

  return {
    authorized: true,
    role: profile.role
  }
}

/**
 * Check if user is super admin
 */
export async function checkSuperAdminAuth(): Promise<AuthCheckResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { authorized: false, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    return { 
      authorized: false, 
      error: 'Not authorized as super admin',
      role: profile?.role
    }
  }

  return {
    authorized: true,
    role: profile.role
  }
}
