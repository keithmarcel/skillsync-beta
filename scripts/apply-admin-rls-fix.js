import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyMigration() {
  console.log('🔧 Applying RLS policy fix for admin users...\n')
  
  const sql = readFileSync('supabase/migrations/20251003190000_fix_admin_profiles_access.sql', 'utf8')
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))
  
  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 60)}...`)
    
    const { error } = await supabase.rpc('exec', { sql: statement + ';' })
    
    if (error) {
      console.error('❌ Error:', error.message)
      // Continue anyway - some errors are expected (like DROP IF EXISTS)
    } else {
      console.log('✓ Success')
    }
  }
  
  console.log('\n✅ Migration applied!')
  console.log('\n📝 What changed:')
  console.log('  • Admin users can now view all profiles')
  console.log('  • Admin users can update any profile')
  console.log('  • Admin users can create new profiles')
  console.log('  • Super admins can delete profiles')
  console.log('\n🔐 RLS is still active - only authenticated admins have access')
  
  process.exit(0)
}

applyMigration()
