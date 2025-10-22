/**
 * Backfill Program Matches Count - Direct SQL Update
 * Bypasses the analyze API and directly calculates counts via CIP-SOC crosswalk
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function backfillProgramCounts() {
  console.log('🎓 Starting direct program counts backfill...\n')

  // Get all analyzed assessments with their job data and skill results
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select(`
      id,
      job:jobs(id, soc_code, required_proficiency_pct)
    `)
    .not('analyzed_at', 'is', null)

  if (error) {
    console.error('❌ Error fetching assessments:', error)
    return
  }

  if (!assessments || assessments.length === 0) {
    console.log('✅ No assessments found')
    return
  }

  console.log(`📊 Found ${assessments.length} assessments to process\n`)

  let succeeded = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < assessments.length; i++) {
    const assessment = assessments[i]
    const jobId = assessment.job?.id
    const requiredProficiency = assessment.job?.required_proficiency_pct || 75

    console.log(`[${i + 1}/${assessments.length}] Processing ${assessment.id}...`)

    if (!jobId) {
      console.log(`  ⚠️  No job ID, skipping`)
      skipped++
      continue
    }

    try {
      // Get skill results for this assessment
      const { data: skillResults } = await supabase
        .from('assessment_skill_results')
        .select('skill_id, score_pct')
        .eq('assessment_id', assessment.id)

      if (!skillResults || skillResults.length === 0) {
        console.log(`  ⚠️  No skill results found`)
        const { error: updateError } = await supabase
          .from('assessments')
          .update({ program_matches_count: 0 })
          .eq('id', assessment.id)
        
        if (updateError) {
          console.error(`  ❌ Error updating: ${updateError.message}`)
          failed++
        } else {
          console.log(`  ✅ Set to 0 (no skill results)`)
          succeeded++
        }
        continue
      }

      // Identify gap skills (below required proficiency)
      const gapSkills = skillResults
        .filter(s => s.score_pct < requiredProficiency)
        .map(s => s.skill_id)

      let programCount = 0

      if (gapSkills.length > 0) {
        // User has gaps - count gap-filling programs
        const { data: programSkills } = await supabase
          .from('program_skills')
          .select('program_id')
          .in('skill_id', gapSkills)

        if (programSkills && programSkills.length > 0) {
          // Get unique program IDs
          const uniqueProgramIds = [...new Set(programSkills.map(ps => ps.program_id))]
          
          // Count published programs
          const { count } = await supabase
            .from('programs')
            .select('*', { count: 'exact', head: true })
            .in('id', uniqueProgramIds)
            .eq('status', 'published')

          programCount = count || 0
        }
      } else {
        // User is role-ready - count related programs via CIP-SOC crosswalk
        const { data: job } = await supabase
          .from('jobs')
          .select('soc_code')
          .eq('id', jobId)
          .single()

        if (job?.soc_code) {
          const { data: cipMatches } = await supabase
            .from('cip_soc_crosswalk')
            .select('cip_code')
            .eq('soc_code', job.soc_code)

          if (cipMatches && cipMatches.length > 0) {
            const cipCodes = cipMatches.map(m => m.cip_code)
            const { count } = await supabase
              .from('programs')
              .select('*', { count: 'exact', head: true })
              .in('cip_code', cipCodes)
              .eq('status', 'published')

            programCount = count || 0
          }
        }
      }

      // Update assessment
      const { error: updateError } = await supabase
        .from('assessments')
        .update({ program_matches_count: programCount })
        .eq('id', assessment.id)

      if (updateError) {
        console.error(`  ❌ Error updating: ${updateError.message}`)
        failed++
      } else {
        const matchType = gapSkills.length > 0 ? `gap-filling (${gapSkills.length} gaps)` : 'growth (role-ready)'
        console.log(`  ✅ Updated to ${programCount} programs (${matchType})`)
        succeeded++
      }

    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      failed++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Backfill Summary:')
  console.log(`  Total processed: ${assessments.length}`)
  console.log(`  ✅ Succeeded: ${succeeded}`)
  console.log(`  ⚠️  Skipped: ${skipped}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log('='.repeat(50))
}

backfillProgramCounts()
  .then(() => {
    console.log('\n✅ Backfill complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
