import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fixJohnEmployerRole() {
  console.log('🔍 Looking for John Employer (employer@powerdesign.com)...\n')
  
  // First, get Power Design company ID
  const { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', '%power%design%')
    .single()
  
  if (!company) {
    console.error('❌ Power Design company not found!')
    process.exit(1)
  }
  
  console.log(`✅ Found company: ${company.name} (${company.id})`)
  
  // Find John Employer by email
  const { data: user, error: findError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'employer@powerdesign.com')
    .maybeSingle()
  
  if (findError) {
    console.error('❌ Error finding user:', findError)
    process.exit(1)
  }
  
  if (!user) {
    console.log('\n⚠️  User not found in database.')
    console.log('📝 User needs to be created first through the admin UI or signup flow.')
    console.log('\nOnce created, run this script again to update their role.')
    process.exit(0)
  }
  
  console.log(`\n📋 Current user status:`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Name: ${user.first_name} ${user.last_name}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   Admin Role: ${user.admin_role || 'none'}`)
  console.log(`   Company ID: ${user.company_id || 'none'}`)
  
  // Update user to be company admin
  console.log(`\n🔄 Updating user to Company Admin for Power Design...`)
  
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({
      admin_role: 'company_admin',
      company_id: company.id,
      role: 'partner_admin' // Keep role as partner_admin for company users
    })
    .eq('id', user.id)
    .select()
    .single()
  
  if (updateError) {
    console.error('❌ Error updating user:', updateError)
    process.exit(1)
  }
  
  console.log(`\n✅ Successfully updated John Employer!`)
  console.log(`   Admin Role: ${updated.admin_role}`)
  console.log(`   Role: ${updated.role}`)
  console.log(`   Company ID: ${updated.company_id}`)
  console.log(`\n🎉 John Employer is now a Company Admin for Power Design!`)
  
  process.exit(0)
}

fixJohnEmployerRole()
