/**
 * Backfill Program Matches Count
 * 
 * This script calculates and stores program matches count for existing assessments
 * that don't have this value set yet.
 * 
 * Run with: npx tsx scripts/backfill-program-matches.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { calculateSkillGaps, findProgramsForGaps } from '../src/lib/services/program-gap-matching'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function backfillProgramMatches() {
  console.log('🎓 Starting program matches backfill...\n')

  // Get all analyzed assessments without program_matches_count
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('id, user_id, job_id')
    .not('analyzed_at', 'is', null)
    .or('program_matches_count.is.null,program_matches_count.eq.0')
    .order('analyzed_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching assessments:', error)
    return
  }

  if (!assessments || assessments.length === 0) {
    console.log('✅ No assessments need backfilling')
    return
  }

  console.log(`📊 Found ${assessments.length} assessments to process\n`)

  let processed = 0
  let succeeded = 0
  let failed = 0

  for (const assessment of assessments) {
    processed++
    console.log(`[${processed}/${assessments.length}] Processing assessment ${assessment.id}...`)

    try {
      // Calculate skill gaps
      const gaps = await calculateSkillGaps(assessment.id)
      
      // Find matching programs (95% threshold)
      const programs = await findProgramsForGaps(gaps, { minMatchThreshold: 95 })
      const count = programs.length

      // Update assessment
      const { error: updateError } = await supabase
        .from('assessments')
        .update({ program_matches_count: count })
        .eq('id', assessment.id)

      if (updateError) {
        console.error(`  ❌ Failed to update: ${updateError.message}`)
        failed++
      } else {
        console.log(`  ✅ Updated with ${count} program matches`)
        succeeded++
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`  ❌ Error processing: ${error instanceof Error ? error.message : 'Unknown error'}`)
      failed++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Backfill Summary:')
  console.log(`  Total processed: ${processed}`)
  console.log(`  ✅ Succeeded: ${succeeded}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log('='.repeat(50))
}

// Run the backfill
backfillProgramMatches()
  .then(() => {
    console.log('\n✅ Backfill complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error)
    process.exit(1)
  })
