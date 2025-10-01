// API endpoint to populate job skills
// - Standard occupations (SOC): Use O*NET (broad, universal skills)
// - Featured roles: Use Hybrid (Lightcast + AI + job description)
import { NextRequest, NextResponse } from 'next/server'
import { getHybridSkillsForJob, saveSkillsToJob } from '@/lib/services/hybrid-skills-mapper'
import { getONetSkillsForOccupation, saveONetSkillsToJob } from '@/lib/services/onet-skills-mapper'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/admin/populate-lightcast-skills
 * Populates job skills using hybrid approach:
 * - O*NET (government validated)
 * - Lightcast (industry current)
 * - AI semantic matching (gpt-4o-mini)
 * 
 * Body: { socCode?: string, forceRefresh?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const { socCode, forceRefresh = false } = await request.json()

    console.log('Hybrid skills population:', { socCode, forceRefresh })

    // Get jobs to populate
    let jobsQuery = supabase
      .from('jobs')
      .select('id, soc_code, title, long_desc')
      .not('soc_code', 'is', null)

    if (socCode) {
      jobsQuery = jobsQuery.eq('soc_code', socCode)
    }

    const { data: jobs, error: jobsError } = await jobsQuery

    if (jobsError) throw jobsError
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No jobs found to populate',
        jobsProcessed: 0
      })
    }

    const results = []

    for (const job of jobs) {
      try {
        // Check if job already has skills
        if (!forceRefresh) {
          const { data: existing } = await supabase
            .from('job_skills')
            .select('id')
            .eq('job_id', job.id)
            .limit(1)

          if (existing && existing.length > 0) {
            console.log(`⏭️  Skipping ${job.title} - already has skills`)
            results.push({
              jobId: job.id,
              title: job.title,
              socCode: job.soc_code,
              skipped: true,
              reason: 'Already has skills'
            })
            continue
          }
        }

        // Determine if this is a standard occupation or featured role
        const isStandardOccupation = !job.long_desc || job.long_desc.length < 100
        
        let saveResult

        if (isStandardOccupation) {
          // Use O*NET for standard occupations (broad, universal skills)
          console.log(`  📚 Using O*NET for standard occupation`)
          const onetSkills = await getONetSkillsForOccupation(job.soc_code)
          
          if (onetSkills.length === 0) {
            results.push({
              jobId: job.id,
              title: job.title,
              socCode: job.soc_code,
              success: false,
              error: 'No O*NET skills found'
            })
            continue
          }

          saveResult = await saveONetSkillsToJob(job.id, onetSkills)
        } else {
          // Use hybrid for featured roles (specific to job description)
          console.log(`  🎯 Using Hybrid for featured role`)
          const skillMatches = await getHybridSkillsForJob(job)

          if (skillMatches.length === 0) {
            results.push({
              jobId: job.id,
              title: job.title,
              socCode: job.soc_code,
              success: false,
              error: 'No skills matched'
            })
            continue
          }

          saveResult = await saveSkillsToJob(job.id, skillMatches)
        }

        results.push({
          jobId: job.id,
          title: job.title,
          socCode: job.soc_code,
          success: saveResult.success,
          skillsAdded: saveResult.count,
          method: isStandardOccupation ? 'ONET' : 'Hybrid'
        })

      } catch (error) {
        console.error(`Error processing job ${job.title}:`, error)
        results.push({
          jobId: job.id,
          title: job.title,
          socCode: job.soc_code,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalSkills = results.reduce((sum, r) => sum + (r.skillsAdded || 0), 0)

    return NextResponse.json({
      success: true,
      message: `Populated ${totalSkills} skills across ${successCount} jobs using hybrid O*NET + Lightcast + AI`,
      jobsProcessed: jobs.length,
      successCount,
      totalSkills,
      results
    })

  } catch (error) {
    console.error('Failed to populate Lightcast skills:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to populate skills',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
