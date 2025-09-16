const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCurrentAuth() {
  console.log('🔍 Testing Current Authentication State...\n')
  
  try {
    // Test current session
    console.log('1. Checking current session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
    } else if (session) {
      console.log('✅ User is authenticated!')
      console.log('   User ID:', session.user.id)
      console.log('   Email:', session.user.email)
      console.log('   Session expires:', new Date(session.expires_at * 1000))
      
      // Check if this user has a profile
      console.log('\n2. Checking user profile...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileError) {
        console.error('❌ Profile error:', profileError.message)
        console.log('🔧 User exists in auth but missing profile - this is the issue!')
      } else {
        console.log('✅ User profile found:', {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          name: `${profile.first_name} ${profile.last_name}`
        })
      }
      
    } else {
      console.log('❌ No active session - user is not authenticated')
    }

  } catch (error) {
    console.error('❌ Auth test failed:', error.message)
  }
  
  process.exit(0)
}

testCurrentAuth()
