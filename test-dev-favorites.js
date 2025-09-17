const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testDevFavorites() {
  console.log('Testing dev_favorites functionality...')
  
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
  console.log('\n1. Adding to dev_favorites...')
  const { error: addError } = await supabase
    .from('dev_favorites')
    .insert({
      user_id: mockUserId,
      entity_kind: 'job',
      entity_id: testJob.id
    })
  
  if (addError) {
    console.error('Add error:', addError)
  } else {
    console.log('✅ Successfully added to dev_favorites')
  }

  // Test get favorites using the new query approach
  console.log('\n2. Getting favorite job IDs...')
  const { data: favoriteIds, error: favError } = await supabase
    .from('dev_favorites')
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
    .from('dev_favorites')
    .delete()
    .eq('user_id', mockUserId)
    .eq('entity_kind', 'job')
    .eq('entity_id', testJob.id)
  
  if (removeError) {
    console.error('Remove error:', removeError)
  } else {
    console.log('✅ Successfully cleaned up')
  }

  console.log('\n✅ Dev favorites test complete!')
}

testDevFavorites().catch(console.error)
