// API endpoint to populate job skills from O*NET data
import { NextRequest, NextResponse } from 'next/server'
import { onetApi } from '@/lib/services/onet-api'
import { supabase } from '@/lib/supabase/client'

// POST /api/admin/populate-job-skills - Populate skills for jobs with SOC codes
export async function POST(request: NextRequest) {
  try {
    const { socCode, forceRefresh } = await request.json()

    console.log(`Starting job skills population${socCode ? ` for SOC ${socCode}` : ' for all SOC codes'}`)

    // Get jobs that need skills populated
    let query = supabase
      .from('jobs')
      .select('id, soc_code, title')
      .not('soc_code', 'is', null)

    if (socCode) {
      query = query.eq('soc_code', socCode)
    }

    if (!forceRefresh) {
      // Only process jobs that don't already have skills
      query = query.not('id', 'in', `(${supabase.from('job_skills').select('job_id').then(r => r.data?.map(js => js.job_id).join(',') || '')})`)
    }

    const { data: jobs, error: jobsError } = await query

    if (jobsError) throw jobsError
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No jobs found that need skills populated',
        processed: 0
      })
    }

    console.log(`Found ${jobs.length} jobs to process`)

    const results = []
    let totalSkillsAdded = 0

    // Process each job
    for (const job of jobs) {
      try {
        console.log(`Processing job: ${job.title} (${job.soc_code})`)

        // Fetch skills from O*NET
        const onetSkills = await onetApi.getOccupationSkills(job.soc_code)

        if (onetSkills.length === 0) {
          console.warn(`No skills found for SOC ${job.soc_code}`)
          results.push({
            soc_code: job.soc_code,
            job_title: job.title,
            status: 'no_skills_found',
            skills_added: 0
          })
          continue
        }

        // Map to our taxonomy
        const mappedSkills = await onetApi.mapOnetSkillsToTaxonomy(onetSkills)

        // Create job-skill relationships
        const skillInserts = mappedSkills.map(skillData => ({
          job_id: job.id,
          skill_id: skillData.skill.id,
          importance_level: skillData.importance_level,
          proficiency_threshold: skillData.proficiency_threshold,
          weight: skillData.weight,
          onet_data_source: skillData.onet_data_source
        }))

        const { error: insertError } = await supabase
          .from('job_skills')
          .upsert(skillInserts, {
            onConflict: 'job_id,skill_id'
          })

        if (insertError) throw insertError

        console.log(`Added ${skillInserts.length} skills for job: ${job.title}`)
        totalSkillsAdded += skillInserts.length

        results.push({
          soc_code: job.soc_code,
          job_title: job.title,
          status: 'success',
          skills_added: skillInserts.length,
          onet_skills_found: onetSkills.length
        })

      } catch (error) {
        console.error(`Failed to process job ${job.id}:`, error)
        results.push({
          soc_code: job.soc_code,
          job_title: job.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          skills_added: 0
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${jobs.length} jobs, added ${totalSkillsAdded} skill relationships`,
      processed: jobs.length,
      total_skills_added: totalSkillsAdded,
      results
    })

  } catch (error) {
    console.error('Failed to populate job skills:', error)
    return NextResponse.json(
      { error: 'Failed to populate job skills', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
