/**
 * Compare Local and Remote Database Schemas
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const remoteSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const localSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function compareTables() {
  console.log('🔍 Comparing Database Schemas...\n')

  const tablesToCheck = [
    'employer_invitations',
    'program_jobs',
    'user_question_history',
    'profiles'
  ]

  for (const table of tablesToCheck) {
    console.log(`\n📋 Checking table: ${table}`)
    
    // Check remote
    const { data: remoteData, error: remoteError } = await remoteSupabase
      .from(table)
      .select('*')
      .limit(0)

    // Check local
    const { data: localData, error: localError } = await localSupabase
      .from(table)
      .select('*')
      .limit(0)

    if (remoteError && localError) {
      console.log(`   ❌ Missing in BOTH`)
    } else if (remoteError) {
      console.log(`   ⚠️  Missing in REMOTE (exists in local)`)
    } else if (localError) {
      console.log(`   ⚠️  Missing in LOCAL (exists in remote)`)
    } else {
      console.log(`   ✅ Exists in both`)
    }
  }

  // Check specific columns in profiles
  console.log('\n\n📋 Checking profiles table columns...')
  
  const columnsToCheck = [
    'bio',
    'visible_to_employers',
    'notif_in_app_invites',
    'notif_in_app_new_roles',
    'notif_email_new_roles',
    'notif_email_invites',
    'notif_email_marketing',
    'notif_email_security',
    'notif_all_disabled',
    'company_id',
    'school_id'
  ]

  for (const column of columnsToCheck) {
    const { error: remoteError } = await remoteSupabase
      .from('profiles')
      .select(column)
      .limit(0)

    const { error: localError } = await localSupabase
      .from('profiles')
      .select(column)
      .limit(0)

    if (remoteError && localError) {
      console.log(`   ❌ ${column}: Missing in BOTH`)
    } else if (remoteError) {
      console.log(`   ⚠️  ${column}: Missing in REMOTE`)
    } else if (localError) {
      console.log(`   ⚠️  ${column}: Missing in LOCAL`)
    } else {
      console.log(`   ✅ ${column}: Exists in both`)
    }
  }

  console.log('\n\n═══════════════════════════════════════')
  console.log('Schema comparison complete')
  console.log('═══════════════════════════════════════\n')
}

compareTables()
