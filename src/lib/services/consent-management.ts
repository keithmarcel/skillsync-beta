/**
 * Consent Management Service
 * 
 * Handles user consent toggle for sharing assessment results with employers
 * - Withdraws invitations when consent is revoked
 * - Backfills invitations when consent is granted
 */

import { supabase } from '@/lib/supabase/client'

/**
 * Withdraw all active invitations when user revokes consent
 * Sets status to 'withdrawn' and archives them
 */
export async function withdrawAllInvitations(userId: string): Promise<{
  success: boolean
  count: number
  error?: string
}> {
  try {
    // Update all active invitations to withdrawn status
    const { data, error } = await supabase
      .from('employer_invitations')
      .update({
        status: 'withdrawn',
        archived_at: new Date().toISOString(),
        archived_by: 'candidate',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .in('status', ['pending', 'sent']) // Only withdraw active invitations
      .select('id')

    if (error) {
      console.error('Error withdrawing invitations:', error)
      return { success: false, count: 0, error: error.message }
    }

    const count = data?.length || 0
    console.log(`✅ Withdrew ${count} invitations for user ${userId}`)

    return { success: true, count }
  } catch (error: any) {
    console.error('Error in withdrawAllInvitations:', error)
    return { success: false, count: 0, error: error.message }
  }
}

/**
 * Backfill invitations for qualifying assessments when user grants consent
 * Creates invitations for past assessments that meet visibility threshold
 */
export async function backfillQualifyingInvitations(userId: string): Promise<{
  success: boolean
  count: number
  error?: string
}> {
  try {
    // Get all completed assessments that meet visibility threshold
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        id,
        user_id,
        job_id,
        readiness_pct,
        job:jobs!inner(
          id,
          title,
          visibility_threshold_pct,
          required_proficiency_pct,
          company_id,
          application_url,
          company:companies!inner(name)
        )
      `)
      .eq('user_id', userId)
      .not('analyzed_at', 'is', null)
      .not('job.company_id', 'is', null)
      .not('job.application_url', 'is', null)

    if (assessmentError) {
      console.error('Error fetching assessments:', assessmentError)
      return { success: false, count: 0, error: assessmentError.message }
    }

    if (!assessments || assessments.length === 0) {
      return { success: true, count: 0 }
    }

    // Filter assessments that meet visibility threshold
    const qualifyingAssessments = assessments.filter(a => {
      const job = a.job as any
      const visibilityThreshold = job?.visibility_threshold_pct || 85
      return a.readiness_pct >= visibilityThreshold
    })

    if (qualifyingAssessments.length === 0) {
      return { success: true, count: 0 }
    }

    // Check for existing invitations to avoid duplicates
    const { data: existingInvites } = await supabase
      .from('employer_invitations')
      .select('job_id')
      .eq('user_id', userId)

    const existingJobIds = new Set(existingInvites?.map(i => i.job_id) || [])

    // Create invitations for qualifying assessments without existing invites
    const invitationsToCreate = qualifyingAssessments
      .filter(a => !existingJobIds.has(a.job_id))
      .map(a => {
        const job = a.job as any
        return {
          user_id: userId,
          company_id: job.company_id,
          job_id: a.job_id,
          assessment_id: a.id,
          proficiency_pct: a.readiness_pct,
          application_url: job.application_url,
          status: 'sent',
          invited_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      })

    if (invitationsToCreate.length === 0) {
      return { success: true, count: 0 }
    }

    // Insert invitations
    const { data: created, error: insertError } = await supabase
      .from('employer_invitations')
      .insert(invitationsToCreate)
      .select('id')

    if (insertError) {
      console.error('Error creating invitations:', insertError)
      return { success: false, count: 0, error: insertError.message }
    }

    const count = created?.length || 0
    console.log(`✅ Created ${count} invitations for user ${userId}`)

    return { success: true, count }
  } catch (error: any) {
    console.error('Error in backfillQualifyingInvitations:', error)
    return { success: false, count: 0, error: error.message }
  }
}

/**
 * Get count of active invitations that would be affected by consent toggle
 */
export async function getActiveInvitationsCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('employer_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['pending', 'sent'])

    if (error) {
      console.error('Error counting invitations:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getActiveInvitationsCount:', error)
    return 0
  }
}
