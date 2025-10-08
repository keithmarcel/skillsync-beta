/**
 * Bulk Skills Curation API Route
 * Save approved/rejected LAiSER extracted skills
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/admin/laiser/bulk-curate
 * Bulk approve or reject LAiSER extracted skills
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { skillIds, action, socCode, jobId } = body

    if (!Array.isArray(skillIds) || skillIds.length === 0) {
      return NextResponse.json(
        { error: 'skillIds array is required' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    if (!jobId && !socCode) {
      return NextResponse.json(
        { error: 'Either jobId or socCode is required' },
        { status: 400 }
      )
    }

    // Get current user (admin)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const now = new Date().toISOString()
    const newStatus = action === 'approve' ? 'admin_approved' : 'rejected'

    // Update skills curation status
    const { data: updatedSkills, error: updateError } = await supabase
      .from('skills')
      .update({
        curation_status: newStatus,
        reviewed_by: user.id,
        reviewed_at: now
      })
      .in('id', skillIds)
      .select('id, name, curation_status')

    if (updateError) {
      console.error('Skills update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update skills' },
        { status: 500 }
      )
    }

    // If jobId provided, create job_skill relationships for approved skills
    if (jobId && action === 'approve') {
      const jobSkillInserts = updatedSkills?.map(skill => ({
        job_id: jobId,
        skill_id: skill.id,
        weight: 1.0, // Default weight, can be adjusted later
        importance_level: 'important' // Default, can be refined
      })) || []

      if (jobSkillInserts.length > 0) {
        const { error: relationError } = await supabase
          .from('job_skills')
          .upsert(jobSkillInserts, {
            onConflict: 'job_id,skill_id'
          })

        if (relationError) {
          console.error('Job skills relation error:', relationError)
          // Don't fail the whole operation for relation errors
        }
      }
    }

    return NextResponse.json({
      success: true,
      action,
      skillsUpdated: updatedSkills?.length || 0,
      jobId: jobId || null,
      socCode: socCode || null,
      reviewedBy: user.id,
      reviewedAt: now
    })

  } catch (error) {
    console.error('Bulk curation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
