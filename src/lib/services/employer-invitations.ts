import { supabase } from '@/lib/supabase/client'

export interface EmployerInvitation {
  id: string
  user_id: string
  company_id: string
  job_id: string
  assessment_id: string
  proficiency_pct: number
  application_url: string
  message?: string
  status: 'pending' | 'sent' | 'applied' | 'declined' | 'hired' | 'unqualified' | 'archived'
  is_read: boolean
  invited_at?: string
  viewed_at?: string
  responded_at?: string
  archived_at?: string
  archived_by?: 'employer' | 'candidate'
  created_at: string
  updated_at: string
  // Joined data
  user?: {
    first_name: string
    last_name: string
    avatar_url?: string
  }
  company?: {
    name: string
    logo_url?: string
  }
  job?: {
    title: string
    soc_code?: string
    required_proficiency_pct?: number
  }
}

// ============================================================================
// CANDIDATE SIDE - User manages their invitations
// ============================================================================

/**
 * Get all invitations for the current user (candidate)
 */
export async function getUserInvitations(filters?: {
  status?: string
  readiness?: string
  search?: string
}): Promise<EmployerInvitation[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let query = supabase
    .from('employer_invitations')
    .select(`
      *,
      company:companies(name, logo_url),
      job:jobs(title, soc_code, required_proficiency_pct)
    `)
    .eq('user_id', user.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.status && filters.status !== 'All') {
    if (filters.status === 'Pending') {
      query = query.eq('status', 'sent')
    } else {
      query = query.eq('status', filters.status.toLowerCase())
    }
  }

  if (filters?.readiness && filters.readiness !== 'All') {
    if (filters.readiness === 'Ready') {
      query = query.gte('proficiency_pct', 90)
    } else if (filters.readiness === 'Building Skills') {
      query = query.gte('proficiency_pct', 85).lt('proficiency_pct', 90)
    }
  }

  if (filters?.search) {
    // Search in company name or job title
    query = query.or(`company.name.ilike.%${filters.search}%,job.title.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data as EmployerInvitation[]
}

/**
 * Get archived invitations for the current user
 */
export async function getUserArchivedInvitations(): Promise<EmployerInvitation[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('employer_invitations')
    .select(`
      *,
      company:companies(name, logo_url),
      job:jobs(title, soc_code, required_proficiency_pct)
    `)
    .eq('user_id', user.id)
    .eq('status', 'archived')
    .order('archived_at', { ascending: false })

  if (error) throw error
  return data as EmployerInvitation[]
}

/**
 * Get unread invitation count for notification badge
 */
export async function getUnreadInvitationCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('employer_invitations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
    .eq('status', 'sent')

  if (error) throw error
  return count || 0
}

/**
 * Get recent invitations for notification dropdown (max 12)
 */
export async function getRecentInvitations(limit: number = 12): Promise<EmployerInvitation[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('employer_invitations')
    .select(`
      *,
      company:companies(name, logo_url),
      job:jobs(title, soc_code)
    `)
    .eq('user_id', user.id)
    .eq('status', 'sent')
    .order('invited_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as EmployerInvitation[]
}

/**
 * Mark invitation as viewed (when user clicks "View Application")
 */
export async function markInvitationAsViewed(invitationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('employer_invitations')
    .update({
      is_read: true,
      viewed_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .eq('user_id', user.id)

  if (error) throw error
}

/**
 * Mark all invitations as read
 */
export async function markAllInvitationsAsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('employer_invitations')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) throw error
}

/**
 * Mark invitation as applied
 */
export async function markInvitationAsApplied(invitationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('employer_invitations')
    .update({
      status: 'applied',
      responded_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .eq('user_id', user.id)

  if (error) throw error
}

/**
 * Mark invitation as declined
 */
export async function markInvitationAsDeclined(invitationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('employer_invitations')
    .update({
      status: 'declined',
      responded_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .eq('user_id', user.id)

  if (error) throw error
}

/**
 * Archive invitation (candidate side)
 */
export async function archiveInvitation(invitationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('employer_invitations')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      archived_by: 'candidate'
    })
    .eq('id', invitationId)
    .eq('user_id', user.id)

  if (error) throw error
}

/**
 * Reopen archived invitation
 */
export async function reopenInvitation(invitationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('employer_invitations')
    .update({
      status: 'sent',
      archived_at: null,
      archived_by: null
    })
    .eq('id', invitationId)
    .eq('user_id', user.id)

  if (error) throw error
}

/**
 * Bulk archive invitations
 */
export async function bulkArchiveInvitations(invitationIds: string[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('employer_invitations')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      archived_by: 'candidate'
    })
    .in('id', invitationIds)
    .eq('user_id', user.id)

  if (error) throw error
}

// ============================================================================
// EMPLOYER SIDE - Employer admin manages candidates
// ============================================================================

/**
 * Get all candidates for employer's company
 */
export async function getEmployerCandidates(filters?: {
  role?: string
  readiness?: string
  status?: string
  search?: string
}): Promise<EmployerInvitation[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get employer's company_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id || profile.role !== 'employer_admin') {
    throw new Error('Not authorized as employer admin')
  }

  let query = supabase
    .from('employer_invitations')
    .select(`
      *,
      user:profiles!user_id(first_name, last_name, avatar_url),
      job:jobs(title, soc_code, required_proficiency_pct)
    `)
    .eq('company_id', profile.company_id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.role && filters.role !== 'Show All') {
    query = query.eq('job_id', filters.role) // Assuming role filter passes job_id
  }

  if (filters?.readiness && filters.readiness !== 'All') {
    if (filters.readiness === 'Ready') {
      query = query.gte('proficiency_pct', 90)
    } else if (filters.readiness === 'Building Skills') {
      query = query.gte('proficiency_pct', 85).lt('proficiency_pct', 90)
    }
  }

  if (filters?.status && filters.status !== 'All') {
    query = query.eq('status', filters.status.toLowerCase())
  }

  if (filters?.search) {
    // Search in candidate name or job title
    query = query.or(`user.first_name.ilike.%${filters.search}%,user.last_name.ilike.%${filters.search}%,job.title.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data as EmployerInvitation[]
}

/**
 * Get archived candidates for employer
 */
export async function getEmployerArchivedCandidates(): Promise<EmployerInvitation[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id || profile.role !== 'employer_admin') {
    throw new Error('Not authorized as employer admin')
  }

  const { data, error } = await supabase
    .from('employer_invitations')
    .select(`
      *,
      user:profiles!user_id(first_name, last_name, avatar_url),
      job:jobs(title, soc_code, required_proficiency_pct)
    `)
    .eq('company_id', profile.company_id)
    .eq('status', 'archived')
    .order('archived_at', { ascending: false })

  if (error) throw error
  return data as EmployerInvitation[]
}

/**
 * Send invitation to candidate (employer clicks "Invite to Apply")
 */
export async function sendInvitationToCandidate(
  invitationId: string,
  message?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id || profile.role !== 'employer_admin') {
    throw new Error('Not authorized as employer admin')
  }

  const { error } = await supabase
    .from('employer_invitations')
    .update({
      status: 'sent',
      message,
      invited_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .eq('company_id', profile.company_id)

  if (error) throw error
}

/**
 * Mark candidate as hired
 */
export async function markCandidateAsHired(invitationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id || profile.role !== 'employer_admin') {
    throw new Error('Not authorized as employer admin')
  }

  const { error } = await supabase
    .from('employer_invitations')
    .update({ status: 'hired' })
    .eq('id', invitationId)
    .eq('company_id', profile.company_id)

  if (error) throw error
}

/**
 * Mark candidate as unqualified
 */
export async function markCandidateAsUnqualified(invitationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id || profile.role !== 'employer_admin') {
    throw new Error('Not authorized as employer admin')
  }

  const { error } = await supabase
    .from('employer_invitations')
    .update({ status: 'unqualified' })
    .eq('id', invitationId)
    .eq('company_id', profile.company_id)

  if (error) throw error
}

/**
 * Archive candidate (employer side)
 */
export async function archiveCandidate(invitationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id || profile.role !== 'employer_admin') {
    throw new Error('Not authorized as employer admin')
  }

  const { error } = await supabase
    .from('employer_invitations')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      archived_by: 'employer'
    })
    .eq('id', invitationId)
    .eq('company_id', profile.company_id)

  if (error) throw error
}

/**
 * Reopen candidate (employer side)
 */
export async function reopenCandidate(invitationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id || profile.role !== 'employer_admin') {
    throw new Error('Not authorized as employer admin')
  }

  const { error } = await supabase
    .from('employer_invitations')
    .update({
      status: 'pending',
      archived_at: null,
      archived_by: null
    })
    .eq('id', invitationId)
    .eq('company_id', profile.company_id)

  if (error) throw error
}

/**
 * Bulk archive candidates
 */
export async function bulkArchiveCandidates(invitationIds: string[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id || profile.role !== 'employer_admin') {
    throw new Error('Not authorized as employer admin')
  }

  const { error } = await supabase
    .from('employer_invitations')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      archived_by: 'employer'
    })
    .in('id', invitationIds)
    .eq('company_id', profile.company_id)

  if (error) throw error
}
