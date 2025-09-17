const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testRLSWithAuth() {
  console.log('🔍 Testing RLS with authenticated session...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Create client with anon key (like the app uses)
  const supabase = createClient(supabaseUrl, anonKey)
  
  console.log('\n1. Testing anonymous access to favorites...')
  const { data: anonData, error: anonError } = await supabase
    .from('favorites')
    .select('*')
    .limit(1)
    
  console.log('Anonymous access:', { 
    success: !anonError, 
    error: anonError?.message,
    errorCode: anonError?.code,
    data: anonData 
  })
  
  // The fact that anonymous access works suggests RLS might not be enabled
  // Let's try to create a user and test with that
  console.log('\n2. Creating test user...')
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'test-rls@example.com',
    password: 'testpassword123'
  })
  
  if (signUpError && !signUpError.message.includes('already registered')) {
    console.log('SignUp error:', signUpError.message)
  } else {
    console.log('User created or already exists')
  }
  
  console.log('\n3. Signing in...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test-rls@example.com',
    password: 'testpassword123'
  })
  
  if (signInError) {
    console.log('SignIn error:', signInError.message)
  } else {
    console.log('Signed in successfully:', signInData.user?.email)
    
    console.log('\n4. Testing authenticated access to favorites...')
    const { data: authData, error: authError } = await supabase
      .from('favorites')
      .select('*')
      .limit(1)
      
    console.log('Authenticated access:', { 
      success: !authError, 
      error: authError?.message,
      errorCode: authError?.code,
      data: authData 
    })
  }
  
  // Test if RLS is actually enabled by checking system tables
  console.log('\n5. Checking if RLS is enabled on favorites table...')
  const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  // Try to query pg_class to check RLS status
  const { data: rlsData, error: rlsError } = await serviceSupabase
    .rpc('sql', { 
      query: "SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'favorites'" 
    })
    
  if (rlsError) {
    console.log('Cannot check RLS status:', rlsError.message)
  } else {
    console.log('RLS status:', rlsData)
  }
}

testRLSWithAuth().then(() => process.exit(0))
