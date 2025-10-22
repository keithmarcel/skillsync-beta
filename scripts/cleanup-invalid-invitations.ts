/**
 * Cleanup Invalid Invitations
 * 
 * Removes employer invitations where the assessment score no longer meets
 * the job's visibility_threshold_pct.
 * 
 * Run with: npx tsx scripts/cleanup-invalid-invitations.ts
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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupInvalidInvitations() {
  console.log('🧹 Starting invitation cleanup...\n')

  try {
    // Get all invitations with assessment and job data
    const { data: invitations, error } = await supabase
      .from('employer_invitations')
      .select(`
        id,
        assessment_id,
        proficiency_pct,
        status,
        assessment:assessments!inner(
          id,
          readiness_pct,
          job:jobs!inner(
            id,
            title,
            visibility_threshold_pct,
            company:companies(name)
          )
        )
      `)
      .neq('status', 'archived')

    if (error) {
      console.error('❌ Error fetching invitations:', error)
      return
    }

    if (!invitations || invitations.length === 0) {
      console.log('✅ No active invitations found')
      return
    }

    console.log(`📊 Found ${invitations.length} active invitations\n`)

    const toDelete: string[] = []
    const valid: string[] = []

    for (const invite of invitations) {
      const assessment = invite.assessment as any
      const job = assessment?.job
      const visibilityThreshold = job?.visibility_threshold_pct || 85
      const readiness = assessment?.readiness_pct || 0

      if (readiness < visibilityThreshold) {
        toDelete.push(invite.id)
        console.log(`❌ INVALID: ${job?.title} (${job?.company?.name})`)
        console.log(`   Score: ${readiness}% < Threshold: ${visibilityThreshold}%`)
        console.log(`   Invitation ID: ${invite.id}\n`)
      } else {
        valid.push(invite.id)
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Summary:')
    console.log(`  ✅ Valid invitations: ${valid.length}`)
    console.log(`  ❌ Invalid invitations: ${toDelete.length}`)
    console.log('='.repeat(50))

    if (toDelete.length === 0) {
      console.log('\n✅ All invitations are valid - no cleanup needed!')
      return
    }

    // Delete invalid invitations
    console.log(`\n🗑️  Deleting ${toDelete.length} invalid invitations...`)
    
    const { error: deleteError } = await supabase
      .from('employer_invitations')
      .delete()
      .in('id', toDelete)

    if (deleteError) {
      console.error('❌ Error deleting invitations:', deleteError)
      return
    }

    console.log('✅ Cleanup complete!')

  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

// Run the cleanup
cleanupInvalidInvitations()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
