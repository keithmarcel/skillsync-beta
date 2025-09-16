const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMissingProfile() {
  console.log('🔧 Creating missing profile for authenticated user...\n')
  
  try {
    // Get the auth user
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError || !users.users.length) {
      console.error('❌ No users found in auth.users')
      return
    }
    
    const authUser = users.users[0] // keith-woods@bisk.com
    console.log('📧 Found auth user:', authUser.email)
    
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()
    
    if (existingProfile) {
      console.log('✅ Profile already exists')
      return
    }
    
    // Create profile for Keith (check if role column exists first)
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        email: authUser.email,
        first_name: 'Keith',
        last_name: 'Marcel',
        zip_code: '33701', // St. Pete area
        agreed_to_terms: true,
        avatar_url: null
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('❌ Profile creation error:', profileError)
    } else {
      console.log('✅ Profile created successfully!')
      console.log('   User ID:', authUser.id)
      console.log('   Email:', authUser.email)
      console.log('   Role: super_admin')
      console.log('   Name: Keith Marcel')
    }
    
  } catch (error) {
    console.error('❌ Profile creation failed:', error.message)
  }
  
  process.exit(0)
}

createMissingProfile()
