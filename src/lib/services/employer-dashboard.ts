import { supabase } from '@/lib/supabase/client'

export interface DashboardMetrics {
  activeRoles: number
  draftRoles: number
  totalRoleViews: number
  roleViews30d: number
  totalCandidates: number
  newCandidates30d: number
  pendingToInvite: number
  invitationsSent: number
  applicationsReceived: number
  newApplications30d: number
  candidatesHired: number
  markedUnqualified: number
  newCandidates7d: number
  newApplications7d: number
  unreadResponses: number
}

export interface RolePerformance {
  id: string
  title: string
  category: string | null
  isPublished: boolean
  status: string | null
  candidateCount: number
  pendingCount: number
  invitedCount: number
  appliedCount: number
  hiredCount: number
}

export interface RecentActivity {
  id: string
  status: string
  proficiencyPct: number
  createdAt: string
  invitedAt: string | null
  respondedAt: string | null
  isReadByEmployer: boolean
  candidateFirstName: string
  candidateLastName: string
  candidateAvatar: string | null
  roleTitle: string
  roleId: string
}

/**
 * Get dashboard metrics for a company
 */
export async function getDashboardMetrics(companyId: string): Promise<DashboardMetrics> {
  try {
    // Get all metrics in parallel
    const [
      activeRolesResult,
      draftRolesResult,
      totalCandidatesResult,
      pendingResult,
      sentResult,
      appliedResult,
      hiredResult,
      unqualifiedResult,
      newCandidates7dResult,
      newApplications7dResult,
      unreadResult
    ] = await Promise.all([
      // Active roles
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('job_kind', 'featured_role')
        .eq('is_published', true),
      
      // Draft roles
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('job_kind', 'featured_role')
        .or('is_published.eq.false,status.eq.draft'),
      
      // Total candidates
      supabase
        .from('employer_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId),
      
      // Pending to invite
      supabase
        .from('employer_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'pending'),
      
      // Invitations sent
      supabase
        .from('employer_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'sent'),
      
      // Applications received
      supabase
        .from('employer_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'applied'),
      
      // Candidates hired
      supabase
        .from('employer_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'hired'),
      
      // Marked unqualified
      supabase
        .from('employer_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'unqualified'),
      
      // New candidates (last 7 days)
      supabase
        .from('employer_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // New applications (last 7 days)
      supabase
        .from('employer_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'applied')
        .gte('responded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Unread responses
      supabase
        .from('employer_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_read_by_employer', false)
        .in('status', ['applied', 'declined'])
    ])

    // Get total views for all roles
    const { data: rolesData } = await supabase
      .from('jobs')
      .select('views_count, id')
      .eq('company_id', companyId)
      .eq('job_kind', 'featured_role')

    const totalViews = (rolesData || []).reduce((sum, job) => sum + (job.views_count || 0), 0)

    // Get views from last 30 days
    const roleIds = (rolesData || []).map(r => r.id)
    const { count: views30d } = await supabase
      .from('role_views')
      .select('id', { count: 'exact', head: true })
      .in('job_id', roleIds)
      .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Get new candidates in last 30 days
    const { count: newCandidates30d } = await supabase
      .from('employer_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Get new applications in last 30 days
    const { count: newApplications30d } = await supabase
      .from('employer_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'applied')
      .gte('responded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    return {
      activeRoles: activeRolesResult.count || 0,
      draftRoles: draftRolesResult.count || 0,
      totalRoleViews: totalViews,
      roleViews30d: views30d || 0,
      totalCandidates: totalCandidatesResult.count || 0,
      newCandidates30d: newCandidates30d || 0,
      pendingToInvite: pendingResult.count || 0,
      invitationsSent: sentResult.count || 0,
      applicationsReceived: appliedResult.count || 0,
      newApplications30d: newApplications30d || 0,
      candidatesHired: hiredResult.count || 0,
      markedUnqualified: unqualifiedResult.count || 0,
      newCandidates7d: newCandidates7dResult.count || 0,
      newApplications7d: newApplications7dResult.count || 0,
      unreadResponses: unreadResult.count || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    throw error
  }
}

/**
 * Get recent candidate activity
 */
export async function getRecentActivity(companyId: string, limit: number = 10): Promise<RecentActivity[]> {
  try {
    // Get invitations first - order by created_at to show most recent activity
    const { data: invitations, error: invError } = await supabase
      .from('employer_invitations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (invError) {
      console.error('Error fetching invitations:', invError)
      throw invError
    }

    if (!invitations || invitations.length === 0) {
      return []
    }

    // Get user IDs and job IDs
    const userIds = Array.from(new Set(invitations.map(inv => inv.user_id)))
    const jobIds = Array.from(new Set(invitations.map(inv => inv.job_id)))

    // Fetch profiles and jobs separately
    const [profilesResult, jobsResult] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', userIds),
      supabase.from('jobs').select('id, title').in('id', jobIds)
    ])

    const profilesMap = new Map((profilesResult.data || []).map(p => [p.id, p]))
    const jobsMap = new Map((jobsResult.data || []).map(j => [j.id, j]))

    return invitations.map((item: any) => {
      const profile = profilesMap.get(item.user_id)
      const job = jobsMap.get(item.job_id)
      
      // Log status for debugging
      if (!item.status) {
        console.warn(`Missing status for invitation ${item.id}, user: ${profile?.first_name} ${profile?.last_name}`)
      }
      
      return {
        id: item.id,
        status: item.status || 'sent', // Default to 'sent' if status is null
        proficiencyPct: item.proficiency_pct,
        createdAt: item.created_at,
        invitedAt: item.invited_at,
        respondedAt: item.responded_at,
        isReadByEmployer: item.is_read_by_employer,
        candidateFirstName: profile?.first_name || 'Unknown',
        candidateLastName: profile?.last_name || 'User',
        candidateAvatar: profile?.avatar_url || null,
        roleTitle: job?.title || 'Unknown Role',
        roleId: item.job_id
      }
    })
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    // Return empty array instead of throwing to prevent dashboard from breaking
    return []
  }
}

/**
 * Get role performance breakdown
 */
export async function getRolePerformance(companyId: string): Promise<RolePerformance[]> {
  try {
    // First get all roles
    const { data: roles, error: rolesError } = await supabase
      .from('jobs')
      .select('id, title, category, is_published, status')
      .eq('company_id', companyId)
      .eq('job_kind', 'featured_role')
      .order('title')

    if (rolesError) throw rolesError

    // Then get invitation counts for each role
    const rolePerformance = await Promise.all(
      (roles || []).map(async (role) => {
        const { data: invitations, error: invError } = await supabase
          .from('employer_invitations')
          .select('status')
          .eq('job_id', role.id)

        if (invError) throw invError

        const statusCounts = (invitations || []).reduce((acc: any, inv: any) => {
          acc[inv.status] = (acc[inv.status] || 0) + 1
          return acc
        }, {})

        return {
          id: role.id,
          title: role.title,
          category: role.category,
          isPublished: role.is_published,
          status: role.status,
          candidateCount: invitations?.length || 0,
          pendingCount: statusCounts.pending || 0,
          invitedCount: statusCounts.sent || 0,
          appliedCount: statusCounts.applied || 0,
          hiredCount: statusCounts.hired || 0
        }
      })
    )

    return rolePerformance.sort((a, b) => b.candidateCount - a.candidateCount)
  } catch (error) {
    console.error('Error fetching role performance:', error)
    throw error
  }
}
