const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugFavorites() {
  console.log('🔍 Debugging Favorites Functionality...\n')
  
  try {
    // Get Keith's user ID from auth
    const { data: users } = await supabase.auth.admin.listUsers()
    const keithUser = users.users.find(u => u.email === 'keith-woods@bisk.com')
    
    if (!keithUser) {
      console.error('❌ Keith user not found')
      return
    }
    
    console.log('✅ Keith user found:', keithUser.id)
    
    // Check current favorites
    const { data: currentFavorites, error: favError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', keithUser.id)
    
    if (favError) {
      console.error('❌ Error fetching favorites:', favError)
    } else {
      console.log(`📋 Current favorites: ${currentFavorites.length}`)
      currentFavorites.forEach(fav => {
        console.log(`   - ${fav.entity_kind}: ${fav.entity_id}`)
      })
    }
    
    // Get a real job ID to test with
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('job_kind', 'occupation')
      .limit(1)
    
    if (jobs && jobs.length > 0) {
      const testJob = jobs[0]
      console.log(`\n🧪 Testing with job: ${testJob.title} (${testJob.id})`)
      
      // Test adding favorite
      const { error: addError } = await supabase
        .from('favorites')
        .insert({
          user_id: keithUser.id,
          entity_kind: 'job',
          entity_id: testJob.id
        })
      
      if (addError) {
        console.error('❌ Add favorite error:', addError)
        console.log('   Code:', addError.code)
        console.log('   Details:', addError.details)
        console.log('   Hint:', addError.hint)
      } else {
        console.log('✅ Successfully added favorite')
        
        // Verify it was added
        const { data: verifyFav } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', keithUser.id)
          .eq('entity_id', testJob.id)
        
        console.log(`✅ Verification: ${verifyFav.length} matching favorites found`)
        
        // Clean up
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', keithUser.id)
          .eq('entity_id', testJob.id)
        
        console.log('🧹 Test favorite cleaned up')
      }
    }
    
    // Test RLS policies
    console.log('\n🔒 Testing RLS policies...')
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: anonTest, error: anonError } = await supabaseAnon
      .from('favorites')
      .select('*')
      .eq('user_id', keithUser.id)
    
    if (anonError) {
      console.log('❌ Anonymous access blocked (this is expected):', anonError.message)
    } else {
      console.log('⚠️  Anonymous access allowed - RLS may not be configured properly')
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
  
  process.exit(0)
}

debugFavorites()
