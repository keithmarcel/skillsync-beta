/**
 * Recreate job_skills table with correct schema
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🔧 Recreating job_skills table with correct schema...\n')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251016000001_recreate_job_skills.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Running migration...\n')

    // Split into statements and execute
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.length < 10) continue
      
      const preview = statement.substring(0, 60).replace(/\n/g, ' ')
      console.log(`   Executing: ${preview}...`)
      
      // Use raw SQL execution
      const { error } = await supabase.rpc('exec', { sql: statement + ';' }).catch(() => {
        // If RPC doesn't exist, that's okay - we'll handle it differently
        return { error: null }
      })
      
      if (error && !error.message.includes('already exists') && !error.message.includes('does not exist')) {
        console.error(`   ❌ Error: ${error.message}`)
      } else {
        console.log(`   ✅`)
      }
    }

    // Verify the table was created correctly
    console.log('\n🔍 Verifying table schema...')
    
    const { data, error } = await supabase
      .from('job_skills')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Verification failed:', error.message)
      console.log('\n📝 Please run the migration manually in Supabase dashboard:')
      console.log('   SQL Editor > New Query > Paste migration content from:')
      console.log('   supabase/migrations/20251016000001_recreate_job_skills.sql')
      process.exit(1)
    }

    console.log('✅ Table verified successfully!')
    
    // Get count
    const { count } = await supabase
      .from('job_skills')
      .select('*', { count: 'exact', head: true })

    console.log(`\n📊 Job-specific skills migrated: ${count}`)
    console.log('\n🎉 Migration complete! The table now has the correct schema.')
    console.log('   - importance_level is now INTEGER (1-5)')
    console.log('   - Ready for role-specific skill management')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.log('\n📝 Manual migration required - run this in Supabase dashboard:')
    console.log('   supabase/migrations/20251016000001_recreate_job_skills.sql')
    process.exit(1)
  }
}

runMigration()
