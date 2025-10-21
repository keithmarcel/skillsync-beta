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

  // Get all analyzed assessments with their job SOC codes
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('id, job:jobs(soc_code)')
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
    const socCode = assessment.job?.soc_code

    console.log(`[${i + 1}/${assessments.length}] Processing ${assessment.id}...`)

    if (!socCode) {
      console.log(`  ⚠️  No SOC code, skipping`)
      skipped++
      continue
    }

    try {
      // Get CIP codes via crosswalk
      const { data: cipMatches } = await supabase
        .from('cip_soc_crosswalk')
        .select('cip_code')
        .eq('soc_code', socCode)

      if (!cipMatches || cipMatches.length === 0) {
        console.log(`  ⚠️  No crosswalk entries for SOC ${socCode}`)
        const { error: updateError } = await supabase
          .from('assessments')
          .update({ program_matches_count: 0 })
          .eq('id', assessment.id)
        
        if (updateError) {
          console.error(`  ❌ Error updating: ${updateError.message}`)
          failed++
        } else {
          console.log(`  ✅ Set to 0 (no crosswalk)`)
          succeeded++
        }
        continue
      }

      // Count programs with matching CIP codes
      const cipCodes = cipMatches.map(m => m.cip_code)
      const { count } = await supabase
        .from('programs')
        .select('*', { count: 'exact', head: true })
        .in('cip_code', cipCodes)
        .eq('status', 'published')

      const programCount = count || 0

      // Update assessment
      const { error: updateError } = await supabase
        .from('assessments')
        .update({ program_matches_count: programCount })
        .eq('id', assessment.id)

      if (updateError) {
        console.error(`  ❌ Error updating: ${updateError.message}`)
        failed++
      } else {
        console.log(`  ✅ Updated to ${programCount} programs`)
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
