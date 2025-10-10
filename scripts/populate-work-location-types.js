/**
 * Populate work_location_type for featured roles
 * Randomly assigns Onsite, Remote, or Hybrid to each featured role
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const WORK_LOCATION_TYPES = ['Onsite', 'Remote', 'Hybrid']

async function populateWorkLocationTypes() {
  console.log('🏢 Adding work_location_type column and populating data...\n')

  try {
    // First, ensure the column exists (idempotent)
    console.log('📝 Ensuring work_location_type column exists...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.jobs 
        ADD COLUMN IF NOT EXISTS work_location_type TEXT 
        CHECK (work_location_type IN ('Onsite', 'Remote', 'Hybrid', NULL));
      `
    })
    
    // Note: This might fail if RPC doesn't exist, but that's okay - column might already exist
    if (alterError && !alterError.message.includes('already exists')) {
      console.log('⚠️  Column might already exist, continuing...')
    } else {
      console.log('✅ Column ready\n')
    }

    // Fetch all featured roles
    const { data: roles, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title, company_id, companies(name)')
      .eq('job_kind', 'featured_role')

    if (fetchError) {
      console.error('❌ Error fetching roles:', fetchError)
      return
    }

    if (!roles || roles.length === 0) {
      console.log('⚠️  No featured roles found')
      return
    }

    console.log(`Found ${roles.length} featured role(s)\n`)
    console.log('━'.repeat(80))

    let updated = 0
    let failed = 0

    for (const role of roles) {
      const companyName = role.companies?.name || 'Unknown Company'
      
      // Randomly select a work location type
      const workLocationType = WORK_LOCATION_TYPES[Math.floor(Math.random() * WORK_LOCATION_TYPES.length)]
      
      console.log(`\n📋 ${role.title}`)
      console.log(`   Company: ${companyName}`)
      console.log(`   Assigning: ${workLocationType}`)

      // Update the role
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ work_location_type: workLocationType })
        .eq('id', role.id)

      if (updateError) {
        console.log(`   ❌ Failed: ${updateError.message}`)
        failed++
      } else {
        console.log(`   ✅ Updated successfully`)
        updated++
      }
    }

    console.log('\n' + '━'.repeat(80))
    console.log('\n📊 RESULTS SUMMARY')
    console.log('━'.repeat(80))
    console.log(`✅ Successfully updated: ${updated}`)
    console.log(`❌ Failed: ${failed}`)
    console.log('\n✨ Work location types populated!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
populateWorkLocationTypes()
