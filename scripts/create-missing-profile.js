/**
 * Create missing profile for authenticated user
 * Run this when a user exists in auth.users but not in public.profiles
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMissingProfile(userId) {
  console.log(`🔍 Checking user: ${userId}`)
  
  // Get user from auth
  const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId)
  
  if (authError || !user) {
    console.error('❌ User not found in auth.users:', authError)
    return
  }
  
  console.log('✅ User found:', user.email)
  
  // Check if profile exists
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (existingProfile) {
    console.log('✅ Profile already exists!')
    return
  }
  
  console.log('📝 Creating profile...')
  
  // Create profile
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      role: 'user',
      first_name: user.user_metadata?.first_name || null,
      last_name: user.user_metadata?.last_name || null,
      linkedin_url: user.user_metadata?.linkedin_url || null,
      agreed_to_terms: user.user_metadata?.agreed_to_terms || false,
      visible_to_employers: user.user_metadata?.visible_to_employers || false,
    })
    .select()
    .single()
  
  if (insertError) {
    console.error('❌ Failed to create profile:', insertError)
    return
  }
  
  console.log('✅ Profile created successfully!')
  console.log(newProfile)
}

// Get user ID from command line or use the one from the error
const userId = process.argv[2] || 'df8fd39f-3120-458e-be13-32b4ff8e0664'

createMissingProfile(userId)
  .then(() => {
    console.log('\n✅ Done! Try refreshing the app.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
