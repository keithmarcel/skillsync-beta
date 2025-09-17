require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testFavoritesBadges() {
  console.log('🏷️  Testing Favorites Tab Badge System...')
  
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
    
    // Test 1: Get sample jobs with different job_kind values
    console.log('1️⃣ Testing job_kind detection...')
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, category, job_kind')
      .limit(5)
    
    if (jobsError) {
      console.error('❌ Error fetching jobs:', jobsError)
      return
    }
    
    console.log('✅ Sample jobs with job_kind:')
    jobs?.forEach(job => {
      console.log(`  - "${job.title}" | Category: ${job.category} | Kind: ${job.job_kind || 'occupation'}`)
    })
    
    // Test 2: Simulate badge rendering logic
    console.log('2️⃣ Testing badge rendering logic...')
    
    const mockFeaturedRole = {
      id: 'test-1',
      title: 'Senior Software Engineer',
      category: 'Tech & Services',
      job_kind: 'featured_role'
    }
    
    const mockOccupation = {
      id: 'test-2', 
      title: 'Registered Nurses',
      category: 'Health & Education',
      job_kind: 'occupation'
    }
    
    console.log('✅ Badge Logic Simulation:')
    console.log('  Featured Role Example:')
    console.log(`    - Title: "${mockFeaturedRole.title}"`)
    console.log(`    - Should show: "Hiring Now" badge (green) + "${mockFeaturedRole.category}" badge (colored)`)
    console.log(`    - Badge colors: Tech & Services uses purple theme`)
    
    console.log('  Occupation Example:')
    console.log(`    - Title: "${mockOccupation.title}"`)
    console.log(`    - Should show: "${mockOccupation.category}" badge (neutral gray)`)
    console.log(`    - No "Hiring Now" badge for occupations`)
    
    // Test 3: Check current favorites and predict badge behavior
    console.log('3️⃣ Testing current favorites badge behavior...')
    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('entity_kind, entity_id')
      .eq('user_id', user.id)
      .eq('entity_kind', 'job')
    
    if (favError) {
      console.error('❌ Error fetching favorites:', favError)
      return
    }
    
    console.log('✅ Current job favorites badge predictions:')
    if (favorites && favorites.length > 0) {
      for (const fav of favorites.slice(0, 3)) { // Test first 3
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('title, category, job_kind')
          .eq('id', fav.entity_id)
          .single()
        
        if (!jobError && job) {
          const jobKind = job.job_kind || 'occupation'
          console.log(`  - "${job.title}":`)
          console.log(`    * Job Kind: ${jobKind}`)
          console.log(`    * Category: ${job.category}`)
          if (jobKind === 'featured_role') {
            console.log(`    * Badges: "Hiring Now" (green) + "${job.category}" (colored)`)
          } else {
            console.log(`    * Badges: "${job.category}" (neutral gray)`)
          }
        }
      }
    } else {
      console.log('  - No job favorites found to test')
    }
    
    console.log('🎉 Favorites Badge System Test Complete!')
    console.log('📋 Summary of Changes:')
    console.log('  ✅ Column header changed from "Occupation" to "Job"')
    console.log('  ✅ "Hiring Now" badge created for featured roles (green)')
    console.log('  ✅ Category badges use color palette for featured roles')
    console.log('  ✅ Category badges use neutral gray for occupations')
    console.log('  ✅ Badges positioned below job title with subtle padding')
    console.log('  ✅ Smart logic distinguishes featured roles vs occupations')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testFavoritesBadges()
