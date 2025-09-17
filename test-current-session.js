const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCurrentSession() {
  console.log('🔍 Testing Current Session After Re-authentication...\n')
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Session error:', error.message)
    } else if (session) {
      console.log('✅ User is authenticated!')
      console.log('   User ID:', session.user.id)
      console.log('   Email:', session.user.email)
      
      // Test favorites table access
      console.log('\n🔍 Testing favorites table access...')
      const { data: favorites, error: favError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', session.user.id)
      
      if (favError) {
        console.error('❌ Favorites access error:', favError.message)
        console.log('   Code:', favError.code)
        console.log('   Details:', favError.details)
      } else {
        console.log(`✅ Favorites accessible: ${favorites.length} favorites found`)
      }
      
      // Test adding a favorite
      console.log('\n🔧 Testing add favorite...')
      const testJobId = '123e4567-e89b-12d3-a456-426614174000' // dummy ID
      const { error: addError } = await supabase
        .from('favorites')
        .insert({
          user_id: session.user.id,
          entity_kind: 'job',
          entity_id: testJobId
        })
      
      if (addError) {
        console.error('❌ Add favorite error:', addError.message)
        console.log('   Code:', addError.code)
        console.log('   Details:', addError.details)
      } else {
        console.log('✅ Add favorite test successful')
        // Clean up test record
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('entity_id', testJobId)
      }
      
    } else {
      console.log('❌ No active session found')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
  
  process.exit(0)
}

testCurrentSession()
