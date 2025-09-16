const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAuthConnection() {
  console.log('🔍 Testing Supabase Auth Connection...\n')
  
  try {
    // Test 1: Check if we can connect to auth.users
    console.log('1. Testing auth.users table access...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Auth users error:', usersError.message)
    } else {
      console.log(`✅ Found ${users.users.length} users in auth.users`)
      if (users.users.length > 0) {
        console.log('   Sample user:', {
          id: users.users[0].id,
          email: users.users[0].email,
          created_at: users.users[0].created_at
        })
      }
    }

    // Test 2: Check profiles table
    console.log('\n2. Testing profiles table access...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Profiles error:', profilesError.message)
    } else {
      console.log(`✅ Found ${profiles.length} profiles`)
      if (profiles.length > 0) {
        console.log('   Sample profile:', {
          id: profiles[0].id,
          email: profiles[0].email,
          role: profiles[0].role,
          first_name: profiles[0].first_name
        })
      }
    }

    // Test 3: Check favorites table structure
    console.log('\n3. Testing favorites table structure...')
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select('*')
      .limit(5)
    
    if (favoritesError) {
      console.error('❌ Favorites error:', favoritesError.message)
    } else {
      console.log(`✅ Found ${favorites.length} favorites`)
      if (favorites.length > 0) {
        console.log('   Sample favorite:', favorites[0])
      }
    }

    // Test 4: Check if auth users match profiles
    console.log('\n4. Testing auth.users <-> profiles relationship...')
    if (users && users.users.length > 0 && profiles && profiles.length > 0) {
      const authUserIds = users.users.map(u => u.id)
      const profileUserIds = profiles.map(p => p.id)
      const matchingIds = authUserIds.filter(id => profileUserIds.includes(id))
      
      console.log(`✅ ${matchingIds.length}/${authUserIds.length} auth users have profiles`)
      
      if (matchingIds.length > 0) {
        console.log('   Matching user ID:', matchingIds[0])
      }
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
  }
  
  process.exit(0)
}

testAuthConnection()
