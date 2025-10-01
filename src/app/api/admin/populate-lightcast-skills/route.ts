// API endpoint to populate job skills from Lightcast Open Skills
import { NextRequest, NextResponse } from 'next/server'
import { getSkillsBySocCode, validateSkillsWithONET } from '@/lib/services/lightcast-skills'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/admin/populate-lightcast-skills
 * Populates job skills using Lightcast Open Skills taxonomy
 * 
 * Body: { socCode?: string, forceRefresh?: boolean, maxSkills?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { socCode, forceRefresh = false, maxSkills = 20 } = await request.json()

    console.log('Populating Lightcast skills:', { socCode, forceRefresh, maxSkills })

    // Get jobs to populate
    let jobsQuery = supabase
      .from('jobs')
      .select('id, soc_code, title')
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
        console.log(`\nProcessing: ${job.title} (${job.soc_code})`)

        // Check if job already has skills
        if (!forceRefresh) {
          const { data: existing } = await supabase
            .from('job_skills')
            .select('id')
            .eq('job_id', job.id)
            .limit(1)

          if (existing && existing.length > 0) {
            console.log('  ⏭️  Skipping - already has skills')
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

        // Step 1: Fetch Lightcast skills for SOC code
        const lightcastSkills = await getSkillsBySocCode(job.soc_code, maxSkills)
        console.log(`  Found ${lightcastSkills.length} Lightcast skills`)

        if (lightcastSkills.length === 0) {
          results.push({
            jobId: job.id,
            title: job.title,
            socCode: job.soc_code,
            success: false,
            error: 'No Lightcast skills found'
          })
          continue
        }

        // Step 2: Validate with O*NET
        const validatedSkills = await validateSkillsWithONET(lightcastSkills, job.soc_code)
        console.log(`  Validated ${validatedSkills.length} skills with O*NET`)

        // Step 3: Create/get skills in database and link to job
        let skillsAdded = 0

        for (const skillData of validatedSkills) {
          // Check if skill exists in our database
          let { data: existingSkill } = await supabase
            .from('skills')
            .select('id')
            .eq('name', skillData.skill.name)
            .eq('source', 'LIGHTCAST')
            .single()

          let skillId: string

          if (existingSkill) {
            skillId = existingSkill.id
          } else {
            // Create new skill
            const { data: newSkill, error: skillError } = await supabase
              .from('skills')
              .insert({
                name: skillData.skill.name,
                description: skillData.skill.description,
                category: skillData.skill.type?.name || 'General',
                source: 'LIGHTCAST',
                lightcast_id: skillData.skill.id
              })
              .select('id')
              .single()

            if (skillError) {
              console.error(`  Error creating skill ${skillData.skill.name}:`, skillError)
              continue
            }

            skillId = newSkill.id
          }

          // Link skill to job
          const { error: linkError } = await supabase
            .from('job_skills')
            .upsert({
              job_id: job.id,
              skill_id: skillId,
              importance_level: skillData.marketDemand === 'critical' ? 'critical' : 
                               skillData.marketDemand === 'high' ? 'important' : 'helpful',
              proficiency_threshold: 70,
              weight: skillData.relevanceScore / 100,
              onet_data_source: {
                category: 'lightcast',
                importance: Math.round(skillData.relevanceScore / 20), // 1-5 scale
                validated: skillData.onetValidation
              }
            }, {
              onConflict: 'job_id,skill_id'
            })

          if (!linkError) {
            skillsAdded++
          }
        }

        console.log(`  ✅ Added ${skillsAdded} skills to job`)

        results.push({
          jobId: job.id,
          title: job.title,
          socCode: job.soc_code,
          success: true,
          skillsAdded
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
      message: `Populated ${totalSkills} skills across ${successCount} jobs`,
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
