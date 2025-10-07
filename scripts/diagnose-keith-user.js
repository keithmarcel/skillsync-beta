import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnoseKeithUser() {
  console.log('🔍 INVESTIGATING KEITH WOODS USER...\n')

  // 1. Check auth.users
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const keithAuth = users?.find(u => u.email === 'keith-woods@bisk.com')

  console.log('1️⃣ AUTH.USERS (Supabase Auth):')
  if (keithAuth) {
    console.log('  ✅ Found in auth.users')
    console.log('  ID:', keithAuth.id)
    console.log('  Email:', keithAuth.email)
    console.log('  Email Confirmed:', keithAuth.email_confirmed_at ? 'Yes' : 'No')
    console.log('  Created:', new Date(keithAuth.created_at).toLocaleString())
  } else {
    console.log('  ❌ NOT FOUND in auth.users!')
  }

  // 2. Check profiles table
  const { data: keithProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'keith-woods@bisk.com')
    .maybeSingle()

  console.log('\n2️⃣ PROFILES TABLE:')
  if (keithProfile) {
    console.log('  ✅ Found in profiles')
    console.log('  ID:', keithProfile.id)
    console.log('  Email:', keithProfile.email)
    console.log('  Name:', keithProfile.first_name, keithProfile.last_name)
    console.log('  Role:', keithProfile.role)
    console.log('  Admin Role:', keithProfile.admin_role)
    console.log('  Company ID:', keithProfile.company_id || 'none')
    console.log('  School ID:', keithProfile.school_id || 'none')
  } else {
    console.log('  ❌ NOT FOUND in profiles!')
    if (profileError) console.log('  Error:', profileError.message)
  }

  // 3. Check if IDs match
  console.log('\n3️⃣ ID CONSISTENCY:')
  if (keithAuth && keithProfile) {
    if (keithAuth.id === keithProfile.id) {
      console.log('  ✅ IDs MATCH - auth and profile are linked correctly')
    } else {
      console.log('  ❌ ID MISMATCH!')
      console.log('    Auth ID:', keithAuth.id)
      console.log('    Profile ID:', keithProfile.id)
      console.log('    This is a CRITICAL ERROR - they must match!')
    }
  }

  // 4. Check assessments
  const { data: assessments, count: assessmentCount } = await supabase
    .from('assessments')
    .select('*', { count: 'exact' })
    .eq('user_id', keithProfile?.id || 'none')

  console.log('\n4️⃣ ASSESSMENTS:')
  console.log('  Count:', assessmentCount || 0)
  if (assessments && assessments.length > 0) {
    assessments.forEach((a, i) => {
      console.log(`  ${i+1}. ${a.title || 'Untitled'} (Status: ${a.status})`)
    })
  }

  // 5. Check favorites
  const { data: favorites, count: favCount } = await supabase
    .from('favorites')
    .select('*', { count: 'exact' })
    .eq('user_id', keithProfile?.id || 'none')

  console.log('\n5️⃣ FAVORITES:')
  console.log('  Count:', favCount || 0)

  // 6. Recommendations
  console.log('\n📋 DIAGNOSIS:')
  if (!keithAuth) {
    console.log('  ❌ Keith Woods does not exist in auth.users')
    console.log('  → Need to create auth user')
  }
  if (!keithProfile) {
    console.log('  ❌ Keith Woods does not exist in profiles table')
    console.log('  → Need to create profile')
  }
  if (keithAuth && keithProfile && keithAuth.id !== keithProfile.id) {
    console.log('  ❌ Auth and Profile IDs do not match')
    console.log('  → Need to fix the profile ID or recreate')
  }
  if (keithProfile && !keithProfile.admin_role) {
    console.log('  ❌ Profile exists but admin_role is not set')
    console.log('  → Need to set admin_role = super_admin')
  }
  if (keithAuth && keithProfile && keithAuth.id === keithProfile.id && keithProfile.admin_role === 'super_admin') {
    console.log('  ✅ Everything looks correct!')
    console.log('  → The issue might be with session/authentication in the browser')
  }

  process.exit(0)
}

diagnoseKeithUser()
