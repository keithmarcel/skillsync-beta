#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkAdminUsers() {
  console.log('🔍 Checking for Provider and Employer Admin users...\n')
  
  // Check for provider admins
  const { data: providerAdmins, error: providerError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, admin_role, school_id, schools(name)')
    .or('admin_role.eq.provider_admin,role.eq.provider_admin')
  
  console.log('👨‍🏫 PROVIDER ADMINS:')
  if (providerAdmins && providerAdmins.length > 0) {
    providerAdmins.forEach(admin => {
      console.log(`  ✓ ${admin.email}`)
      console.log(`    Name: ${admin.first_name} ${admin.last_name}`)
      console.log(`    School ID: ${admin.school_id || 'NOT SET'}`)
      console.log(`    School: ${admin.schools?.name || 'NOT LINKED'}`)
      console.log('')
    })
  } else {
    console.log('  ❌ No provider admins found\n')
  }
  
  // Check for employer admins
  const { data: employerAdmins, error: employerError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, admin_role, company_id, companies(name)')
    .or('admin_role.eq.company_admin,role.eq.employer_admin')
  
  console.log('👔 EMPLOYER ADMINS:')
  if (employerAdmins && employerAdmins.length > 0) {
    employerAdmins.forEach(admin => {
      console.log(`  ✓ ${admin.email}`)
      console.log(`    Name: ${admin.first_name} ${admin.last_name}`)
      console.log(`    Company ID: ${admin.company_id || 'NOT SET'}`)
      console.log(`    Company: ${admin.companies?.name || 'NOT LINKED'}`)
      console.log('')
    })
  } else {
    console.log('  ❌ No employer admins found\n')
  }
  
  // Check available schools
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .limit(5)
  
  console.log('🏫 AVAILABLE SCHOOLS (sample):')
  schools?.forEach(school => {
    console.log(`  • ${school.name} (${school.id})`)
  })
  
  // Check available companies
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .limit(5)
  
  console.log('\n🏢 AVAILABLE COMPANIES (sample):')
  companies?.forEach(company => {
    console.log(`  • ${company.name} (${company.id})`)
  })
}

checkAdminUsers()
