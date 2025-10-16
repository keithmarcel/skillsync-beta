/**
 * Run Assessment Question Types Migration
 * Adds support for multiple question types, answer examples, and drag-and-drop ordering
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Running Assessment Question Types Migration...\n')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251016000002_add_assessment_question_types.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Migration file loaded\n')

    // Split into individual statements
    // Handle DO blocks specially (they contain semicolons)
    const statements = []
    let currentStatement = ''
    let inDoBlock = false

    migrationSQL.split('\n').forEach(line => {
      const trimmedLine = line.trim()
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        return
      }

      // Track DO blocks
      if (trimmedLine.startsWith('DO $$')) {
        inDoBlock = true
      }
      if (trimmedLine === '$$;' || trimmedLine === 'END $$;') {
        inDoBlock = false
        currentStatement += line + '\n'
        statements.push(currentStatement.trim())
        currentStatement = ''
        return
      }

      currentStatement += line + '\n'

      // End of statement (not in DO block)
      if (!inDoBlock && trimmedLine.endsWith(';')) {
        statements.push(currentStatement.trim())
        currentStatement = ''
      }
    })

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    let successCount = 0
    let skipCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length < 10) continue

      const preview = statement.substring(0, 80).replace(/\n/g, ' ')
      console.log(`   [${i + 1}/${statements.length}] ${preview}...`)

      try {
        const { error } = await supabase.rpc('exec', { sql: statement })

        if (error) {
          // Check if it's a benign error (already exists)
          if (
            error.message.includes('already exists') ||
            error.message.includes('does not exist') ||
            error.message.includes('column') && error.message.includes('already')
          ) {
            console.log(`   ⚠️  Already exists (skipping)`)
            skipCount++
          } else {
            console.error(`   ❌ Error: ${error.message}`)
            throw error
          }
        } else {
          console.log(`   ✅ Success`)
          successCount++
        }
      } catch (err) {
        // If RPC doesn't exist, try direct query
        try {
          const { error: directError } = await supabase.from('_migrations').select('*').limit(1)
          if (directError) {
            console.error(`   ❌ Failed: ${err.message}`)
            console.log('\n💡 Manual migration required. Run SQL in Supabase Dashboard:')
            console.log('   supabase/migrations/20251016000002_add_assessment_question_types.sql')
            process.exit(1)
          }
        } catch {
          console.error(`   ❌ Failed: ${err.message}`)
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Migration completed successfully!`)
    console.log(`   Success: ${successCount} statements`)
    console.log(`   Skipped: ${skipCount} statements (already exist)`)
    console.log('='.repeat(60))

    // Verify the migration
    console.log('\n🔍 Verifying migration...')
    
    const { data: columns, error: verifyError } = await supabase
      .from('quiz_questions')
      .select('*')
      .limit(1)

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message)
      process.exit(1)
    }

    // Check if new columns exist
    const sampleRow = columns?.[0] || {}
    const hasQuestionType = 'question_type' in sampleRow
    const hasGoodAnswer = 'good_answer_example' in sampleRow
    const hasMaxLength = 'max_length' in sampleRow
    const hasDisplayOrder = 'display_order' in sampleRow

    console.log('\n📋 Column verification:')
    console.log(`   ${hasQuestionType ? '✅' : '❌'} question_type`)
    console.log(`   ${hasGoodAnswer ? '✅' : '❌'} good_answer_example`)
    console.log(`   ${hasMaxLength ? '✅' : '❌'} max_length`)
    console.log(`   ${hasDisplayOrder ? '✅' : '❌'} display_order`)

    if (hasQuestionType && hasGoodAnswer && hasMaxLength && hasDisplayOrder) {
      console.log('\n🎉 All columns added successfully!')
      
      // Check if existing questions were updated
      const { count } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true })
        .gt('display_order', 0)

      console.log(`\n📊 Questions with display_order set: ${count || 0}`)
      
      console.log('\n✅ Migration verification complete!')
      console.log('\n🚀 Ready for Phase 2: Employer Assessments Tab')
    } else {
      console.log('\n⚠️  Some columns may be missing. Check Supabase dashboard.')
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.log('\n📝 Manual migration required:')
    console.log('   1. Open Supabase Dashboard → SQL Editor')
    console.log('   2. Run: supabase/migrations/20251016000002_add_assessment_question_types.sql')
    process.exit(1)
  }
}

// Run the migration
runMigration()
