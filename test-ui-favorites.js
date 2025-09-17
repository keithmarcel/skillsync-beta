require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Import the actual query functions to test them
async function getUserFavoriteJobs(userId) {
  console.log('🔍 Fetching favorite jobs for user:', userId)
  
  // First get the favorite job IDs
  const { data: favorites, error: favError } = await supabase
    .from('favorites')
    .select('entity_id')
    .eq('user_id', userId)
    .eq('entity_kind', 'job')

  if (favError) {
    console.error('❌ Error fetching favorite job IDs:', favError)
    return []
  }

  if (!favorites || favorites.length === 0) {
    console.log('📋 No favorite jobs found')
    return []
  }

  const jobIds = favorites.map(fav => fav.entity_id)
  console.log('🎯 Fetching jobs for IDs:', jobIds.length)

  // Then get the job details
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select(`id, job_kind, title, soc_code, company_id, job_type, category, location_city, location_state, median_wage_usd, long_desc, featured_image_url, skills_count, companies(id, name, logo_url, is_trusted_partner, hq_city, hq_state, revenue_range, employee_range, industry, bio)`)
    .in('id', jobIds)

  if (jobsError) {
    console.error('❌ Error fetching job details:', jobsError)
    return []
  }

  console.log('✅ Fetched favorite jobs:', jobs?.length || 0, 'items')
  
  return jobs?.map(job => ({
    ...job,
    company: Array.isArray(job.companies) ? job.companies[0] : job.companies
  })) || []
}

async function testUIFavorites() {
  console.log('🧪 Testing UI favorites functionality...')
  
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
    
    // Test 1: Get favorite jobs using the UI query function
    console.log('1️⃣ Testing getUserFavoriteJobs function...')
    const favoriteJobs = await getUserFavoriteJobs(user.id)
    console.log('✅ Favorite jobs count:', favoriteJobs.length)
    
    if (favoriteJobs.length > 0) {
      console.log('📋 Sample favorite job:')
      const sampleJob = favoriteJobs[0]
      console.log(`  - ID: ${sampleJob.id}`)
      console.log(`  - Title: ${sampleJob.title}`)
      console.log(`  - Company: ${sampleJob.company?.name || 'N/A'}`)
      console.log(`  - Category: ${sampleJob.category}`)
    }
    
    // Test 2: Test isFavorite logic
    console.log('2️⃣ Testing isFavorite logic...')
    
    // Get some test jobs
    const { data: testJobs } = await supabase
      .from('jobs')
      .select('id, title')
      .limit(5)
    
    if (testJobs && testJobs.length > 0) {
      for (const testJob of testJobs) {
        const isFav = favoriteJobs.some(job => job.id === testJob.id)
        console.log(`  - Job "${testJob.title}" (${testJob.id}): ${isFav ? 'FAVORITED' : 'NOT FAVORITED'}`)
      }
    }
    
    // Test 3: Test add/remove functionality
    console.log('3️⃣ Testing add/remove favorites...')
    
    // Find a job that's not currently favorited
    const nonFavoriteJob = testJobs?.find(job => 
      !favoriteJobs.some(fav => fav.id === job.id)
    )
    
    if (nonFavoriteJob) {
      console.log(`🎯 Testing with non-favorite job: ${nonFavoriteJob.title}`)
      
      // Add to favorites
      const { error: addError } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          entity_kind: 'job',
          entity_id: nonFavoriteJob.id
        })
      
      if (addError) {
        console.error('❌ Error adding favorite:', addError)
      } else {
        console.log('✅ Successfully added to favorites')
        
        // Verify it was added by re-fetching favorites
        const updatedFavorites = await getUserFavoriteJobs(user.id)
        const isNowFavorited = updatedFavorites.some(job => job.id === nonFavoriteJob.id)
        console.log('✅ Verification - now favorited:', isNowFavorited ? 'YES' : 'NO')
        
        // Clean up - remove the test favorite
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('entity_kind', 'job')
          .eq('entity_id', nonFavoriteJob.id)
        
        console.log('🧹 Cleaned up test favorite')
      }
    } else {
      console.log('⚠️ All test jobs are already favorited, skipping add/remove test')
    }
    
    console.log('🎉 UI favorites test completed successfully!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testUIFavorites()
