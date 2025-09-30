const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testRLSStatus() {
  console.log('🔍 Testing RLS status and access...')
  
  try {
    // Test with service role (should work)
    const { data: serviceData, error: serviceError } = await supabase
      .from('favorites')
      .select('*')
      .limit(5)
      
    console.log('Service role access:', { 
      success: !serviceError, 
      error: serviceError?.message,
      count: serviceData?.length || 0 
    })
    
    // Test with anon key (should fail if RLS is enabled)
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { data: anonData, error: anonError } = await anonSupabase
      .from('favorites')
      .select('*')
      .limit(1)
      
    console.log('Anonymous access:', { 
      success: !anonError, 
      error: anonError?.message,
      count: anonData?.length || 0 
    })
    
    if (anonError && anonError.message.includes('RLS')) {
      console.log('✅ RLS is enabled and working')
    } else if (!anonError) {
      console.log('⚠️  RLS may not be properly configured - anonymous access allowed')
    }
    
  } catch (err) {
    console.error('❌ Exception:', err.message)
  }
}

testRLSStatus().then(() => process.exit(0))
