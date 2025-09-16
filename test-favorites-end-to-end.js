require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testEndToEndFavorites() {
  console.log('🧪 Testing end-to-end favorites functionality...')
  
  try {
    // Get current user
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
    
    // Get a test job that's not currently favorited
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title')
      .limit(5)
    
    if (!jobs || jobs.length === 0) {
      console.error('❌ No jobs found')
      return
    }
    
    // Check current favorites
    const { data: currentFavorites } = await supabase
      .from('favorites')
      .select('entity_id, entity_kind')
      .eq('user_id', user.id)
    
    console.log('📋 Current favorites count:', currentFavorites?.length || 0)
    
    // Find a job that's not currently favorited
    const testJob = jobs.find(job => 
      !currentFavorites?.some(fav => fav.entity_kind === 'job' && fav.entity_id === job.id)
    )
    
    if (!testJob) {
      console.log('⚠️ All test jobs are already favorited, using first job anyway')
      testJob = jobs[0]
    }
    
    console.log('🎯 Testing with job:', testJob.title, `(ID: ${testJob.id})`)
    
    // Test 1: Check if job is currently favorited
    const isInitiallyFavorited = currentFavorites?.some(fav => 
      fav.entity_kind === 'job' && fav.entity_id === testJob.id
    )
    console.log('1️⃣ Initially favorited:', isInitiallyFavorited ? 'YES' : 'NO')
    
    // Test 2: Add to favorites if not already favorited
    if (!isInitiallyFavorited) {
      console.log('2️⃣ Adding to favorites...')
      const { error: addError } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          entity_kind: 'job',
          entity_id: testJob.id
        })
      
      if (addError) {
        console.error('❌ Error adding favorite:', addError)
        return
      }
      console.log('✅ Successfully added to favorites')
      
      // Verify it was added
      const { data: afterAdd } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_kind', 'job')
        .eq('entity_id', testJob.id)
      
      console.log('✅ Verification: favorite exists after add:', afterAdd?.length > 0 ? 'YES' : 'NO')
    }
    
    // Test 3: Check new two-step favorites query used by UI
    console.log('3️⃣ Testing new UI favorites query...')
    
    // First get favorite job IDs
    const { data: favoriteIds, error: favIdsError } = await supabase
      .from('favorites')
      .select('entity_id')
      .eq('user_id', user.id)
      .eq('entity_kind', 'job')
    
    if (favIdsError) {
      console.error('❌ Error getting favorite job IDs:', favIdsError)
      return
    }
    
    console.log('✅ Favorite job IDs query successful, count:', favoriteIds?.length || 0)
    
    if (favoriteIds && favoriteIds.length > 0) {
      const jobIds = favoriteIds.map(fav => fav.entity_id)
      
      // Then get job details
      const { data: favoriteJobs, error: favJobsError } = await supabase
        .from('jobs')
        .select(`id, job_kind, title, soc_code, company_id, job_type, category, location_city, location_state, median_wage_usd, long_desc, featured_image_url, skills_count, companies(id, name, logo_url, is_trusted_partner, hq_city, hq_state, revenue_range, employee_range, industry, bio)`)
        .in('id', jobIds)
      
      if (favJobsError) {
        console.error('❌ Error getting favorite job details:', favJobsError)
        return
      }
      
      console.log('✅ Favorite jobs details query successful, count:', favoriteJobs?.length || 0)
      
      const testJobInFavorites = favoriteJobs?.some(job => job.id === testJob.id)
      console.log('✅ Test job in favorites query result:', testJobInFavorites ? 'YES' : 'NO')
      
      // Test 4: Test isFavorite logic
      console.log('4️⃣ Testing isFavorite logic...')
      const mappedFavoriteJobs = favoriteJobs?.map(job => ({
        ...job,
        company: Array.isArray(job.companies) ? job.companies[0] : job.companies
      })) || []
      
      const isFavoriteResult = mappedFavoriteJobs.some(job => job.id === testJob.id)
      console.log('✅ isFavorite logic result:', isFavoriteResult ? 'FAVORITED' : 'NOT FAVORITED')
    } else {
      console.log('📋 No favorite jobs found, skipping details query')
    }
    
    console.log('🎉 End-to-end test completed successfully!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testEndToEndFavorites()
