require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testFavoritesState() {
  console.log('🔍 Testing favorites state detection...')
  
  try {
    // Get current user session
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      console.error('❌ Error getting users:', usersError)
      return
    }
    
    const user = users[0]
    if (!user) {
      console.error('❌ No users found')
      return
    }
    
    console.log('✅ Found user:', user.email)
    
    // Check current favorites
    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
    
    if (favError) {
      console.error('❌ Error getting favorites:', favError)
      return
    }
    
    console.log('📋 Current favorites:', favorites?.length || 0)
    favorites?.forEach(fav => {
      console.log(`  - ${fav.entity_kind} ID: ${fav.entity_id}`)
    })
    
    // Test isFavorite function logic
    const testJobId = 'test-job-123'
    const testProgramId = 'test-program-456'
    
    const isJobFavorited = favorites?.some(f => f.entity_kind === 'job' && f.entity_id === testJobId)
    const isProgramFavorited = favorites?.some(f => f.entity_kind === 'program' && f.entity_id === testProgramId)
    
    console.log('🧪 Test isFavorite logic:')
    console.log(`  - Job ${testJobId}: ${isJobFavorited ? 'FAVORITED' : 'NOT FAVORITED'}`)
    console.log(`  - Program ${testProgramId}: ${isProgramFavorited ? 'FAVORITED' : 'NOT FAVORITED'}`)
    
    // Get some actual job and program IDs to test with
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id')
      .limit(3)
    
    const { data: programs } = await supabase
      .from('programs')
      .select('id')
      .limit(3)
    
    console.log('🔍 Testing with real data:')
    if (jobs?.length > 0) {
      for (const job of jobs) {
        const isFav = favorites?.some(f => f.entity_kind === 'job' && f.entity_id === job.id)
        console.log(`  - Job ${job.id}: ${isFav ? 'FAVORITED' : 'NOT FAVORITED'}`)
      }
    }
    
    if (programs?.length > 0) {
      for (const program of programs) {
        const isFav = favorites?.some(f => f.entity_kind === 'program' && f.entity_id === program.id)
        console.log(`  - Program ${program.id}: ${isFav ? 'FAVORITED' : 'NOT FAVORITED'}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testFavoritesState()
