const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProfilesSchema() {
  console.log('🔍 Checking actual profiles table schema...\n')
  
  try {
    // Try to insert with minimal fields to see what's required
    const testUserId = '00000000-0000-0000-0000-000000000000'
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test@example.com'
      })
    
    if (error) {
      console.log('Schema info from error:', error.message)
      console.log('Error details:', error.details)
      console.log('Error hint:', error.hint)
    }
    
    // Try with different field combinations
    console.log('\n🔧 Trying basic profile creation...')
    const { error: error2 } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
    
    if (error2) {
      console.log('Basic profile error:', error2.message)
    } else {
      console.log('✅ Basic profile fields work')
      // Clean up test record
      await supabase.from('profiles').delete().eq('id', testUserId)
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message)
  }
  
  process.exit(0)
}

checkProfilesSchema()
