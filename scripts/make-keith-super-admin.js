#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function makeSuperAdmin() {
  console.log('🔧 Updating Keith to Super Admin...\n')
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      admin_role: 'super_admin',
      // Keep school_id and company_id so you can still test those dashboards
    })
    .eq('email', 'keith-woods@bisk.com')
    .select()
  
  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Success! Updated profile:')
    console.log(data[0])
    console.log('\n🎉 You are now a Super Admin!')
    console.log('   Refresh /admin to see the "View As" switcher')
  }
}

makeSuperAdmin()
