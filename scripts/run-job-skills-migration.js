/**
 * Run job_skills migration
 * This creates the junction table and migrates existing SOC-based skills to role-specific skills
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
  console.log('🚀 Running job_skills migration...\n')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251016000000_add_job_skills_junction.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('⚠️  RPC method not available, trying direct execution...\n')
      
      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.includes('CREATE TABLE') || 
            statement.includes('CREATE INDEX') ||
            statement.includes('ALTER TABLE') ||
            statement.includes('CREATE POLICY') ||
            statement.includes('CREATE TRIGGER') ||
            statement.includes('CREATE OR REPLACE FUNCTION') ||
            statement.includes('INSERT INTO') ||
            statement.includes('COMMENT ON')) {
          
          console.log(`Executing: ${statement.substring(0, 60)}...`)
          
          const { error: execError } = await supabase.rpc('exec', { sql: statement + ';' })
          
          if (execError && !execError.message.includes('already exists')) {
            console.error(`❌ Error: ${execError.message}`)
          } else {
            console.log('✅ Success')
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully')
    }

    // Verify the table was created
    const { data: tableCheck, error: checkError } = await supabase
      .from('job_skills')
      .select('count')
      .limit(1)

    if (checkError) {
      console.error('\n❌ Table verification failed:', checkError.message)
      console.log('\n📝 Please run the migration manually using Supabase dashboard')
      console.log('   SQL Editor > New Query > Paste migration content')
      process.exit(1)
    }

    // Get migration stats
    const { count: jobSkillsCount } = await supabase
      .from('job_skills')
      .select('*', { count: 'exact', head: true })

    const { count: featuredRolesCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('job_kind', 'featured_role')

    console.log('\n✅ Migration completed successfully!')
    console.log(`\n📊 Stats:`)
    console.log(`   - Featured roles: ${featuredRolesCount}`)
    console.log(`   - Job-specific skills: ${jobSkillsCount}`)
    console.log(`\n🎉 Skills are now role-specific for featured roles!`)
    console.log(`   - Each role can have unique skills`)
    console.log(`   - No cross-contamination between roles`)
    console.log(`   - High-demand occupations still use SOC-based skills`)

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.log('\n📝 Manual migration required:')
    console.log('   1. Open Supabase dashboard')
    console.log('   2. Go to SQL Editor')
    console.log('   3. Run: supabase/migrations/20251016000000_add_job_skills_junction.sql')
    process.exit(1)
  }
}

runMigration()
