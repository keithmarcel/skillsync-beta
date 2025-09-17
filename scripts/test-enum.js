const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testEnumValues() {
  const testValues = ['featured_role', 'high_demand', 'occupation']
  
  for (const value of testValues) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          job_kind: value,
          title: `Test ${value}`
        }])
        .select()
        
      if (!error) {
        console.log(`✅ ${value}: Valid`)
        // Clean up
        await supabase.from('jobs').delete().eq('title', `Test ${value}`)
      } else {
        console.log(`❌ ${value}: ${error.message}`)
      }
    } catch (e) {
      console.log(`❌ ${value}: ${e.message}`)
    }
  }
}

testEnumValues()
