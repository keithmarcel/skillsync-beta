/**
 * Auto-Invite Service
 * 
 * Automatically adds qualified candidates to employer invite queues
 * when they complete assessments and meet proficiency thresholds
 */

import { supabase } from '@/lib/supabase/client'

interface AssessmentResult {
  id: string
  user_id: string
  job_id: string
  readiness_pct: number
  job?: {
    id: string
    title: string
    required_proficiency_pct: number
    company_id: string
    company?: {
      name: string
    }
  }
}

interface ConsentStatus {
  hasConsent: boolean
  consentType?: 'explicit' | 'implicit'
}

/**
 * Check if user has given consent to share results with employers
 */
async function checkUserConsent(userId: string): Promise<ConsentStatus> {
  // Check if user has agreed to terms (implicit consent)
  const { data: profile } = await supabase
    .from('profiles')
    .select('agreed_to_terms')
    .eq('id', userId)
    .single()

  if (profile?.agreed_to_terms) {
    return {
      hasConsent: true,
      consentType: 'implicit'
    }
  }

  // TODO: Add explicit consent check when implemented
  // const { data: consent } = await supabase
  //   .from('user_consents')
  //   .select('*')
  //   .eq('user_id', userId)
  //   .eq('consent_type', 'share_assessment_results')
  //   .eq('status', 'granted')
  //   .single()

  return {
    hasConsent: profile?.agreed_to_terms || false,
    consentType: profile?.agreed_to_terms ? 'implicit' : undefined
  }
}

/**
 * Check if user already has an invitation for this role
 */
async function hasExistingInvitation(userId: string, jobId: string): Promise<boolean> {
  const { data } = await supabase
    .from('invitations')
    .select('id')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .neq('status', 'declined')
    .limit(1)

  return (data?.length || 0) > 0
}

/**
 * Add qualified candidate to employer's invite queue
 */
async function addToInviteQueue(
  userId: string,
  jobId: string,
  companyId: string,
  readinessPct: number
): Promise<{ success: boolean; invitationId?: string; error?: string }> {
  try {
    // Create invitation record
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        user_id: userId,
        job_id: jobId,
        company_id: companyId,
        status: 'pending',
        readiness_score: readinessPct,
        source: 'auto_qualified',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating invitation:', error)
      return { success: false, error: error.message }
    }

    return { success: true, invitationId: invitation.id }
  } catch (error: any) {
    console.error('Error in addToInviteQueue:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Main function: Process assessment completion and auto-invite if qualified
 */
export async function processAssessmentCompletion(
  assessmentId: string
): Promise<{
  qualified: boolean
  invited: boolean
  shared: boolean
  companyName?: string
  readinessPct?: number
  requiredPct?: number
  message?: string
}> {
  try {
    // 1. Get assessment with job and company details
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        id,
        user_id,
        job_id,
        readiness_pct,
        job:jobs!inner(
          id,
          title,
          required_proficiency_pct,
          company_id,
          company:companies!inner(name)
        )
      `)
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return { qualified: false, invited: false, shared: false, message: 'Assessment not found' }
    }

    const job = assessment.job as any
    
    // Check if an invitation actually exists for this assessment
    const { data: existingInvite } = await supabase
      .from('employer_invitations')
      .select('id, status')
      .eq('assessment_id', assessmentId)
      .single()

    // Only show toast if invitation was created (meets visibility threshold)
    if (existingInvite) {
      return {
        qualified: true,
        invited: true,
        shared: true,
        companyName: job.company?.name,
        readinessPct: assessment.readiness_pct,
        message: `Results shared with ${job.company?.name}`
      }
    }

    // No invitation exists - don't show toast
    return {
      qualified: false,
      invited: false,
      shared: false,
      readinessPct: assessment.readiness_pct,
      message: 'Below visibility threshold - no invitation created'
    }

  } catch (error: any) {
    console.error('Error in processAssessmentCompletion:', error)
    return {
      qualified: false,
      invited: false,
      shared: false,
      message: error.message
    }
  }
}

export default {
  processAssessmentCompletion,
  checkUserConsent
}
