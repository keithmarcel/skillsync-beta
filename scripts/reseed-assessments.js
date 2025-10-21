#!/usr/bin/env node

/**
 * Reseed Assessments with Current Data
 * 
 * This script:
 * 1. Deletes all existing assessments (old seed data)
 * 2. Creates fresh assessments for all featured roles
 * 3. Uses current job data (with required_proficiency_pct)
 * 4. Generates realistic skill scores
 * 5. Ensures assessments work with new crosswalk logic
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Keith's user ID (keith-woods@bisk.com)
const USER_ID = '72b464ef-1814-4942-b69e-2bdffd390e61'

async function reseedAssessments() {
  console.log('🔄 Reseeding Assessments with Current Data...\n')

  try {
    // Step 1: Delete old assessments
    console.log('Step 1: Deleting old assessments...')
    const { error: deleteError } = await supabase
      .from('assessments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.log('  ⚠️  No old assessments to delete or error:', deleteError.message)
    } else {
      console.log('  ✅ Old assessments deleted\n')
    }

    // Step 2: Get all featured roles with current data
    console.log('Step 2: Fetching current featured roles...')
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        soc_code,
        required_proficiency_pct,
        company:companies(name)
      `)
      .eq('job_kind', 'featured_role')
      .eq('status', 'published')

    if (jobsError) throw jobsError
    console.log(`  ✅ Found ${jobs.length} featured roles\n`)

    // Step 3: Get skills for each job
    console.log('Step 3: Creating assessments...')
    let created = 0

    for (const job of jobs) {
      // Get job skills
      const { data: jobSkills } = await supabase
        .from('job_skills')
        .select('skill_id, skills(name)')
        .eq('job_id', job.id)
        .limit(8) // 8 questions per assessment

      if (!jobSkills || jobSkills.length === 0) {
        console.log(`  ⏭️  Skip: ${job.title} (no skills)`)
        continue
      }

      // Generate realistic scores based on required proficiency
      const requiredProf = job.required_proficiency_pct || 75
      const scenarios = [
        { name: 'role-ready', min: requiredProf, max: 100 },
        { name: 'close', min: requiredProf - 15, max: requiredProf - 1 },
        { name: 'needs-development', min: 50, max: requiredProf - 16 }
      ]

      // Create one assessment per scenario
      for (const scenario of scenarios) {
        // Generate skill scores
        const skillScores = jobSkills.map(js => ({
          skill_id: js.skill_id,
          score_pct: Math.floor(Math.random() * (scenario.max - scenario.min + 1)) + scenario.min
        }))

        // Calculate overall readiness
        const avgScore = Math.round(
          skillScores.reduce((sum, s) => sum + s.score_pct, 0) / skillScores.length
        )

        // Create assessment
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .insert({
            user_id: USER_ID,
            job_id: job.id,
            readiness_pct: avgScore,
            method: 'quiz'
          })
          .select('id')
          .single()

        if (assessmentError) {
          console.log(`  ❌ Error creating ${scenario.name} assessment for ${job.title}:`, assessmentError.message)
          continue
        }

        // Create skill results
        const skillResults = skillScores.map(ss => ({
          assessment_id: assessment.id,
          skill_id: ss.skill_id,
          score_pct: ss.score_pct
        }))

        const { error: skillsError } = await supabase
          .from('assessment_skill_results')
          .insert(skillResults)

        if (skillsError) {
          console.log(`  ❌ Error creating skill results:`, skillsError.message)
          continue
        }

        console.log(`  ✅ Created ${scenario.name} assessment for ${job.title} (${avgScore}%)`)
        created++
      }
    }

    console.log(`\n✨ Complete! Created ${created} assessments`)
    console.log(`   ${jobs.length} roles × 3 scenarios = ${jobs.length * 3} expected`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  reseedAssessments()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}

module.exports = { reseedAssessments }
