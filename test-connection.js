const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    console.log('Testing connection...')
    const { data, error } = await supabase
      .from('jobs')
      .select('count(*)')
      .single()
    
    if (error) {
      console.error('Connection failed:', error)
    } else {
      console.log('✅ Connection successful! Job count:', data.count)
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    console.log('Exiting...')
    setTimeout(() => process.exit(0), 1000)
  }
}

testConnection()
