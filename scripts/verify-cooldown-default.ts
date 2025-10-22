/**
 * Quick verification that retake_cooldown_enabled defaults to true
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verify() {
  console.log('\n🔍 Verifying retake_cooldown_enabled default value...\n')

  // Step 1: Check existing roles
  console.log('Step 1: Checking existing roles...')
  const { data: existing, error: existingError } = await supabase
    .from('jobs')
    .select('id, title, retake_cooldown_enabled')
    .eq('job_kind', 'featured_role')
    .limit(5)

  if (existingError) {
    console.error('❌ Error fetching existing roles:', existingError)
    process.exit(1)
  }

  console.log(`Found ${existing?.length || 0} existing roles:`)
  existing?.forEach(role => {
    const status = role.retake_cooldown_enabled === true ? '✅ true' : 
                   role.retake_cooldown_enabled === false ? '❌ false' : 
                   '⚠️  null'
    console.log(`  - ${role.title.slice(0, 40)}: ${status}`)
  })

  const allTrue = existing?.every(r => r.retake_cooldown_enabled === true)
  if (allTrue) {
    console.log('✅ All existing roles have cooldown enabled\n')
  } else {
    console.log('⚠️  Some existing roles do not have cooldown enabled\n')
  }

  // Step 2: Create a new test role
  console.log('Step 2: Creating new test role...')
  
  // Get a company ID to use
  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .limit(1)

  if (!companies || companies.length === 0) {
    console.error('❌ No companies found')
    process.exit(1)
  }

  const { data: newRole, error: insertError } = await supabase
    .from('jobs')
    .insert({
      title: `TEST ROLE - Default Verification ${Date.now()}`,
      company_id: companies[0].id,
      job_kind: 'featured_role',
      soc_code: '11-1021',
      category: 'test',
      application_url: 'https://example.com/apply',
      // NOT specifying retake_cooldown_enabled - should get DEFAULT
    })
    .select('id, title, retake_cooldown_enabled')
    .single()

  if (insertError) {
    console.error('❌ Error creating test role:', insertError)
    process.exit(1)
  }

  console.log(`Created: ${newRole.title}`)
  console.log(`retake_cooldown_enabled: ${newRole.retake_cooldown_enabled}`)

  if (newRole.retake_cooldown_enabled === true) {
    console.log('✅ DEFAULT is working! New roles get true\n')
  } else if (newRole.retake_cooldown_enabled === null) {
    console.log('❌ DEFAULT is NOT working! New roles get null\n')
    console.log('Migration may not have been applied correctly.')
  } else {
    console.log(`⚠️  Unexpected value: ${newRole.retake_cooldown_enabled}\n`)
  }

  // Step 3: Clean up test role
  console.log('Step 3: Cleaning up test role...')
  const { error: deleteError } = await supabase
    .from('jobs')
    .delete()
    .eq('id', newRole.id)

  if (deleteError) {
    console.error('⚠️  Could not delete test role:', deleteError)
  } else {
    console.log('✅ Test role deleted\n')
  }

  // Step 4: Final verdict
  console.log('═'.repeat(60))
  if (newRole.retake_cooldown_enabled === true && allTrue) {
    console.log('✅ PASS: Migration is working correctly!')
    console.log('   - Existing roles updated to true')
    console.log('   - New roles default to true')
    console.log('═'.repeat(60) + '\n')
    process.exit(0)
  } else {
    console.log('❌ FAIL: Migration has issues')
    if (!allTrue) {
      console.log('   - Some existing roles are not true')
    }
    if (newRole.retake_cooldown_enabled !== true) {
      console.log('   - New roles do not default to true')
    }
    console.log('═'.repeat(60) + '\n')
    process.exit(1)
  }
}

verify()
