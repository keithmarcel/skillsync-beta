const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Create client with service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // This bypasses RLS
)

async function testFavoritesWithBypass() {
  console.log('Testing favorites with RLS bypass...')
  
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'
  
  // Get a job to test with
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title')
    .limit(1)
  
  if (!jobs || jobs.length === 0) {
    console.error('No jobs found')
    return
  }
  
  const testJob = jobs[0]
  console.log(`Testing with job: ${testJob.title} (${testJob.id})`)

  // Test add to favorites
  console.log('\n1. Adding to favorites...')
  const { error: addError } = await supabase
    .from('favorites')
    .insert({
      user_id: mockUserId,
      entity_kind: 'job',
      entity_id: testJob.id
    })
  
  if (addError) {
    console.error('Add error:', addError)
  } else {
    console.log('✅ Successfully added to favorites')
  }

  // Test get favorites using the new query approach
  console.log('\n2. Getting favorite job IDs...')
  const { data: favoriteIds, error: favError } = await supabase
    .from('favorites')
    .select('entity_id')
    .eq('user_id', mockUserId)
    .eq('entity_kind', 'job')

  if (favError) {
    console.error('Get favorite IDs error:', favError)
  } else {
    console.log(`Found ${favoriteIds.length} favorite job IDs`)
  }

  if (favoriteIds && favoriteIds.length > 0) {
    console.log('\n3. Getting job details...')
    const jobIds = favoriteIds.map(fav => fav.entity_id)
    const { data: jobDetails, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        company:companies(*),
        skills:job_skills(
          weight,
          skill:skills(*)
        )
      `)
      .in('id', jobIds)

    if (jobError) {
      console.error('Get job details error:', jobError)
    } else {
      console.log(`✅ Successfully fetched ${jobDetails.length} favorite jobs`)
      jobDetails.forEach(job => {
        console.log(`  - ${job.title} at ${job.company?.name || 'Unknown Company'}`)
      })
    }
  }

  // Clean up
  console.log('\n4. Cleaning up...')
  const { error: removeError } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', mockUserId)
    .eq('entity_kind', 'job')
    .eq('entity_id', testJob.id)
  
  if (removeError) {
    console.error('Remove error:', removeError)
  } else {
    console.log('✅ Successfully cleaned up')
  }

  console.log('\n✅ Favorites bypass test complete!')
}

testFavoritesWithBypass().catch(console.error)
