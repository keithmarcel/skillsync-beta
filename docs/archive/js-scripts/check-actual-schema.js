const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkActualSchema() {
  console.log('🔍 Checking what tables actually exist...\n')
  
  try {
    // Check if profiles table exists at all
    
    // Try a different approach - check specific tables
    const tablesToCheck = ['profiles', 'users', 'user_profiles', 'auth_users']
    
    for (const tableName of tablesToCheck) {
      console.log(`Checking table: ${tableName}`)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`✅ ${tableName}: exists`)
      }
    }
    
    // Check auth.users directly
    console.log('\nChecking auth.users via admin API...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      console.log('❌ auth.users error:', usersError.message)
    } else {
      console.log(`✅ auth.users: ${users.users.length} users found`)
      if (users.users.length > 0) {
        console.log('User structure:', Object.keys(users.users[0]))
      }
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message)
  }
  
  process.exit(0)
}

checkActualSchema()
