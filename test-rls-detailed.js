const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testRLSDetailed() {
  console.log('🔍 Detailed RLS testing...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Test with service role
  const serviceSupabase = createClient(supabaseUrl, serviceKey)
  
  // Test with anon key
  const anonSupabase = createClient(supabaseUrl, anonKey)
  
  console.log('\n1. Testing service role access...')
  const { data: serviceData, error: serviceError } = await serviceSupabase
    .from('favorites')
    .select('*')
    .limit(1)
    
  console.log('Service role result:', { 
    success: !serviceError, 
    error: serviceError?.message,
    data: serviceData 
  })
  
  console.log('\n2. Testing anonymous access (should fail if RLS enabled)...')
  const { data: anonData, error: anonError } = await anonSupabase
    .from('favorites')
    .select('*')
    .limit(1)
    
  console.log('Anonymous result:', { 
    success: !anonError, 
    error: anonError?.message,
    data: anonData 
  })
  
  console.log('\n3. Testing authenticated user access...')
  // Try to sign in with a test user first
  const { data: authData, error: authError } = await anonSupabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword123'
  })
  
  if (authError) {
    console.log('No test user available:', authError.message)
  } else {
    console.log('Signed in as:', authData.user?.email)
    
    const { data: authUserData, error: authUserError } = await anonSupabase
      .from('favorites')
      .select('*')
      .limit(1)
      
    console.log('Authenticated user result:', { 
      success: !authUserError, 
      error: authUserError?.message,
      data: authUserData 
    })
  }
  
  console.log('\n4. Testing if we can insert a test favorite...')
  const testUserId = '550e8400-e29b-41d4-a716-446655440000'
  const testJobId = '123e4567-e89b-12d3-a456-426614174000'
  
  const { data: insertData, error: insertError } = await serviceSupabase
    .from('favorites')
    .insert({
      user_id: testUserId,
      entity_kind: 'job',
      entity_id: testJobId
    })
    .select()
    
  console.log('Insert test result:', { 
    success: !insertError, 
    error: insertError?.message,
    data: insertData 
  })
  
  // Clean up test data
  if (!insertError) {
    await serviceSupabase
      .from('favorites')
      .delete()
      .eq('user_id', testUserId)
      .eq('entity_id', testJobId)
  }
}

testRLSDetailed().then(() => process.exit(0))
