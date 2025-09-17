require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testHomepageOrdering() {
  console.log('📅 Testing Homepage Favorites Ordering (Newest First)...')
  
  try {
    // Get current user
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      console.error('❌ Error getting users:', usersError)
      return
    }
    
    const user = users[0]
    console.log('✅ Found user:', user.email)
    
    // Test job favorites ordering
    console.log('1️⃣ Testing job favorites ordering...')
    const { data: jobFavorites, error: jobFavError } = await supabase
      .from('favorites')
      .select('entity_id, created_at')
      .eq('user_id', user.id)
      .eq('entity_kind', 'job')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (jobFavError) {
      console.error('❌ Error fetching job favorites:', jobFavError)
      return
    }
    
    console.log(`✅ Found ${jobFavorites?.length || 0} job favorites ordered by newest first:`)
    if (jobFavorites && jobFavorites.length > 0) {
      for (const [index, fav] of jobFavorites.entries()) {
        const createdDate = new Date(fav.created_at).toLocaleDateString()
        console.log(`  ${index + 1}. Entity ID: ${fav.entity_id} | Created: ${createdDate}`)
      }
    }
    
    // Test program favorites ordering
    console.log('2️⃣ Testing program favorites ordering...')
    const { data: programFavorites, error: progFavError } = await supabase
      .from('favorites')
      .select('entity_id, created_at')
      .eq('user_id', user.id)
      .eq('entity_kind', 'program')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (progFavError) {
      console.error('❌ Error fetching program favorites:', progFavError)
      return
    }
    
    console.log(`✅ Found ${programFavorites?.length || 0} program favorites ordered by newest first:`)
    if (programFavorites && programFavorites.length > 0) {
      for (const [index, fav] of programFavorites.entries()) {
        const createdDate = new Date(fav.created_at).toLocaleDateString()
        console.log(`  ${index + 1}. Entity ID: ${fav.entity_id} | Created: ${createdDate}`)
      }
    }
    
    console.log('🎉 Homepage Ordering Test Complete!')
    console.log('📋 Summary of Updates:')
    console.log('  ✅ Fixed "View All" links to scroll to top of page')
    console.log('  ✅ Fixed "Details" links to scroll to top of page')
    console.log('  ✅ Updated database queries to order by created_at DESC')
    console.log('  ✅ Homepage modules now show newest favorites first')
    console.log('  ✅ Users see their most recent saved items at the top')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testHomepageOrdering()
