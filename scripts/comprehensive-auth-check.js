import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function comprehensiveCheck() {
  console.log('🔍 COMPREHENSIVE AUTH & DATA CHECK\n')

  // 1. Check Keith's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'keith-woods@bisk.com')
    .single()

  console.log('1️⃣ KEITH PROFILE:')
  console.log('  ID:', profile?.id)
  console.log('  Role:', profile?.role)
  console.log('  Admin Role:', profile?.admin_role)
  console.log('  First Name:', profile?.first_name)
  console.log('  Last Name:', profile?.last_name)
  console.log('  Avatar URL:', profile?.avatar_url || 'none')

  // 2. Check employer_invitations
  const { data: invites, count } = await supabase
    .from('employer_invitations')
    .select('*', { count: 'exact' })
    .eq('user_id', profile?.id)

  console.log('\n2️⃣ EMPLOYER INVITATIONS:')
  console.log('  Count:', count || 0)
  if (invites && invites.length > 0) {
    invites.forEach((inv, i) => {
      console.log(`  ${i+1}. Status: ${inv.status}, Created: ${new Date(inv.created_at).toLocaleDateString()}`)
    })
  }

  // 3. Check ALL invitations in table
  const { data: allInvites, count: allCount } = await supabase
    .from('employer_invitations')
    .select('*', { count: 'exact' })

  console.log('\n3️⃣ ALL INVITATIONS IN DATABASE:')
  console.log('  Total Count:', allCount || 0)

  // 4. Check assessments
  const { data: assessments, count: assessCount } = await supabase
    .from('assessments')
    .select('id, title, status, created_at', { count: 'exact' })
    .eq('user_id', profile?.id)

  console.log('\n4️⃣ ASSESSMENTS:')
  console.log('  Count:', assessCount || 0)

  // 5. Check if avatar_url field exists
  console.log('\n5️⃣ PROFILE FIELDS CHECK:')
  console.log('  Has first_name:', !!profile?.first_name)
  console.log('  Has last_name:', !!profile?.last_name)
  console.log('  Has avatar_url field:', 'avatar_url' in (profile || {}))
  console.log('  Has admin_role field:', 'admin_role' in (profile || {}))

  // 6. Test anon access
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data: anonProfile, error: anonError } = await anonClient
    .from('profiles')
    .select('*')
    .eq('id', profile?.id)
    .single()

  console.log('\n6️⃣ ANON KEY ACCESS:')
  console.log('  Can read own profile:', !!anonProfile)
  console.log('  Error:', anonError?.message || 'none')

  // 7. Summary
  console.log('\n📋 SUMMARY:')
  const issues = []
  
  if (!profile?.admin_role) {
    issues.push('❌ admin_role is not set')
  }
  if (!profile?.first_name || !profile?.last_name) {
    issues.push('❌ Name fields are missing')
  }
  if (count === 0 && allCount > 0) {
    issues.push('❌ Invitations exist but not linked to user')
  }
  if (anonError) {
    issues.push('❌ RLS policies blocking profile access')
  }

  if (issues.length === 0) {
    console.log('  ✅ Everything looks good!')
  } else {
    console.log('  Issues found:')
    issues.forEach(issue => console.log('  ', issue))
  }

  process.exit(0)
}

comprehensiveCheck()
