#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function createTestUsers() {
  console.log('🚀 Creating test users for dashboards...\n')
  
  // Get first school and company
  const { data: schools } = await supabase.from('schools').select('id, name').limit(1).single()
  const { data: companies } = await supabase.from('companies').select('id, name').limit(1).single()
  
  if (!schools || !companies) {
    console.error('❌ No schools or companies found')
    return
  }
  
  console.log(`📍 Using School: ${schools.name}`)
  console.log(`📍 Using Company: ${companies.name}\n`)
  
  // Check if keith's account exists
  const { data: keithProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'keith-woods@bisk.com')
    .single()
  
  if (keithProfile) {
    console.log('👤 Found existing Keith account')
    console.log('   Updating to test both roles...\n')
    
    // Update Keith to be a provider admin with school
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        admin_role: 'provider_admin',
        school_id: schools.id,
        company_id: companies.id // Also add company so he can test both
      })
      .eq('id', keithProfile.id)
    
    if (updateError) {
      console.error('❌ Error updating profile:', updateError)
    } else {
      console.log('✅ Updated keith-woods@bisk.com:')
      console.log(`   • admin_role: provider_admin`)
      console.log(`   • school_id: ${schools.id} (${schools.name})`)
      console.log(`   • company_id: ${companies.id} (${companies.name})`)
      console.log('\n📝 Note: You can test BOTH dashboards:')
      console.log('   • /provider - Will work (provider_admin + school_id)')
      console.log('   • /employer - Will work if you temporarily change admin_role to company_admin')
    }
  } else {
    console.log('❌ Keith account not found')
    console.log('   Please create test accounts manually or update your existing account')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📋 MANUAL SQL TO TEST BOTH DASHBOARDS:')
  console.log('='.repeat(60))
  console.log(`
-- Test Provider Dashboard
UPDATE profiles 
SET admin_role = 'provider_admin', 
    school_id = '${schools.id}'
WHERE email = 'keith-woods@bisk.com';

-- Test Employer Dashboard  
UPDATE profiles 
SET admin_role = 'company_admin', 
    company_id = '${companies.id}'
WHERE email = 'keith-woods@bisk.com';

-- Reset to super admin
UPDATE profiles 
SET admin_role = 'super_admin', 
    school_id = NULL, 
    company_id = NULL
WHERE email = 'keith-woods@bisk.com';
`)
}

createTestUsers()
