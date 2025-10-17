import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/admin/job-skills
 * Update skills for a specific job (featured role)
 */
export async function POST(request: NextRequest) {
  try {
    const { jobId, skillIds, importanceLevel = 3 } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      return NextResponse.json(
        { error: 'Skill IDs array is required' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Delete existing skills for this job
    const { error: deleteError } = await supabase
      .from('job_skills')
      .delete()
      .eq('job_id', jobId)

    if (deleteError) {
      console.error('Error deleting existing skills:', deleteError)
      throw new Error(`Failed to delete existing skills: ${deleteError.message}`)
    }

    // Insert new skills
    if (skillIds.length > 0) {
      const skillsToInsert = skillIds.map(skillId => ({
        job_id: jobId,
        skill_id: skillId,
        importance_level: Number(importanceLevel) // Ensure it's a number
      }))
      
      console.log('Inserting skills:', JSON.stringify(skillsToInsert, null, 2))
      
      const { error: insertError } = await supabase
        .from('job_skills')
        .insert(skillsToInsert)

      if (insertError) {
        console.error('Error inserting skills:', insertError)
        console.error('Skills data:', skillsToInsert)
        throw new Error(`Failed to insert skills: ${insertError.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${skillIds.length} skills for job`
    })
  } catch (error) {
    console.error('Error updating job skills:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update job skills' },
      { status: 500 }
    )
  }
}
