/**
 * Backfill Program Matches Count - Simple Version
 * 
 * Run with: npx tsx scripts/backfill-program-matches-simple.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function backfillProgramMatches() {
  console.log('🎓 Starting program matches backfill...\n')

  // Get all analyzed assessments
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('id')
    .not('analyzed_at', 'is', null)
    .or('program_matches_count.is.null,program_matches_count.eq.0')
    .order('analyzed_at', { ascending: false })
    .limit(100) // Process in batches

  if (error) {
    console.error('❌ Error fetching assessments:', error)
    return
  }

  if (!assessments || assessments.length === 0) {
    console.log('✅ No assessments need backfilling')
    return
  }

  console.log(`📊 Found ${assessments.length} assessments to process\n`)

  let succeeded = 0
  let failed = 0

  for (let i = 0; i < assessments.length; i++) {
    const assessment = assessments[i]
    console.log(`[${i + 1}/${assessments.length}] Processing ${assessment.id}...`)

    try {
      // Call the analyze API endpoint which will recalculate everything including program matches
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/assessments/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessmentId: assessment.id })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error(`  ❌ Failed: ${error.error || 'Unknown error'}`)
        failed++
      } else {
        const result = await response.json()
        console.log(`  ✅ Success`)
        succeeded++
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      failed++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Backfill Summary:')
  console.log(`  Total processed: ${assessments.length}`)
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
