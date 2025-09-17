const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testFavoritesConnection() {
  console.log('Testing Supabase connection and favorites functionality...')
  
  // Test basic connection
  try {
    const { data, error } = await supabase.from('jobs').select('id').limit(1)
    if (error) {
      console.error('Database connection error:', error)
      return
    }
    console.log('✅ Database connection successful')
  } catch (err) {
    console.error('Connection failed:', err)
    return
  }

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'
  
  // Test getting a job to favorite
  console.log('\n1. Getting a job to test with...')
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title')
    .limit(1)
  
  if (jobsError || !jobs || jobs.length === 0) {
    console.error('No jobs found:', jobsError)
    return
  }
  
  const testJob = jobs[0]
  console.log(`Found job: ${testJob.title} (${testJob.id})`)

  // Test adding to favorites
  console.log('\n2. Testing add to favorites...')
  const { error: addError } = await supabase
    .from('favorites')
    .insert({
      user_id: mockUserId,
      entity_kind: 'job',
      entity_id: testJob.id
    })
  
  if (addError) {
    console.error('Add favorite error:', addError)
  } else {
    console.log('✅ Successfully added to favorites')
  }

  // Test getting favorites
  console.log('\n3. Testing get favorites...')
  const { data: favorites, error: getFavError } = await supabase
    .from('favorites')
    .select(`
      entity_id,
      job:jobs(
        *,
        company:companies(*),
        skills:job_skills(
          weight,
          skill:skills(*)
        )
      )
    `)
    .eq('user_id', mockUserId)
    .eq('entity_kind', 'job')
  
  if (getFavError) {
    console.error('Get favorites error:', getFavError)
  } else {
    console.log(`✅ Found ${favorites.length} favorite jobs`)
    favorites.forEach(fav => {
      console.log(`  - ${fav.job?.title || 'Unknown'} (${fav.entity_id})`)
    })
  }

  // Test removing from favorites
  console.log('\n4. Testing remove from favorites...')
  const { error: removeError } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', mockUserId)
    .eq('entity_kind', 'job')
    .eq('entity_id', testJob.id)
  
  if (removeError) {
    console.error('Remove favorite error:', removeError)
  } else {
    console.log('✅ Successfully removed from favorites')
  }

  console.log('\n✅ Favorites functionality test complete!')
}

testFavoritesConnection().catch(console.error)
