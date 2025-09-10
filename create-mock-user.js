const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Create client with service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createMockUser() {
  console.log('Creating mock user for development...')
  
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'
  
  // Try to insert into auth.users table
  const { error } = await supabase
    .from('auth.users')
    .insert({
      id: mockUserId,
      email: 'user@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Error creating mock user:', error)
    console.log('This is expected - auth.users is managed by Supabase Auth')
    console.log('We need to use a different approach...')
  } else {
    console.log('✅ Mock user created successfully')
  }
}

createMockUser().catch(console.error)
