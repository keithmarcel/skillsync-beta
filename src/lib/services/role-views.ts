import { supabase } from '@/lib/supabase/client'

/**
 * Track a role view
 */
export async function trackRoleView(
  jobId: string,
  userId?: string,
  sessionId?: string,
  referrer?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('role_views')
      .insert({
        job_id: jobId,
        user_id: userId || null,
        session_id: sessionId || null,
        referrer: referrer || document.referrer || null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      })

    if (error) {
      console.error('Error tracking role view:', error)
    }
  } catch (error) {
    console.error('Error tracking role view:', error)
  }
}

/**
 * Get total views for a company's roles
 */
export async function getTotalRoleViews(companyId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('views_count')
      .eq('company_id', companyId)
      .eq('job_kind', 'featured_role')

    if (error) throw error

    return (data || []).reduce((sum, job) => sum + (job.views_count || 0), 0)
  } catch (error) {
    console.error('Error fetching total role views:', error)
    return 0
  }
}

/**
 * Get views for a specific role
 */
export async function getRoleViews(jobId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('views_count')
      .eq('id', jobId)
      .single()

    if (error) throw error

    return data?.views_count || 0
  } catch (error) {
    console.error('Error fetching role views:', error)
    return 0
  }
}

/**
 * Get views breakdown by role for a company
 */
export async function getRoleViewsBreakdown(companyId: string) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, views_count')
      .eq('company_id', companyId)
      .eq('job_kind', 'featured_role')
      .order('views_count', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching role views breakdown:', error)
    return []
  }
}
