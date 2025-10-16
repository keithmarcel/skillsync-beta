/**
 * Run Assessment Question Types Migration - Direct Execution
 * Uses direct SQL queries instead of RPC
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

async function runMigration() {
  console.log('🚀 Running Assessment Question Types Migration (Direct)...\n')

  try {
    // Execute each ALTER TABLE statement individually
    console.log('📝 Adding question_type column...')
    try {
      await supabase.rpc('exec', { 
        sql: `ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'long_answer'));`
      })
      console.log('   ✅ question_type added')
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ⚠️  question_type already exists')
      } else {
        throw err
      }
    }

    console.log('\n📝 Adding good_answer_example column...')
    try {
      await supabase.rpc('exec', {
        sql: `ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS good_answer_example TEXT;`
      })
      console.log('   ✅ good_answer_example added')
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ⚠️  good_answer_example already exists')
      } else {
        throw err
      }
    }

    console.log('\n📝 Adding max_length column...')
    try {
      await supabase.rpc('exec', {
        sql: `ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS max_length INTEGER DEFAULT 200;`
      })
      console.log('   ✅ max_length added')
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ⚠️  max_length already exists')
      } else {
        throw err
      }
    }

    console.log('\n📝 Adding display_order column...')
    try {
      await supabase.rpc('exec', {
        sql: `ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;`
      })
      console.log('   ✅ display_order added')
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ⚠️  display_order already exists')
      } else {
        throw err
      }
    }

    console.log('\n📝 Creating index on display_order...')
    try {
      await supabase.rpc('exec', {
        sql: `CREATE INDEX IF NOT EXISTS idx_quiz_questions_display_order ON quiz_questions(section_id, display_order);`
      })
      console.log('   ✅ Index created')
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ⚠️  Index already exists')
      } else {
        console.log('   ⚠️  Index creation skipped (may already exist)')
      }
    }

    console.log('\n🔍 Verifying migration...')
    
    const { data: columns, error: verifyError } = await supabase
      .from('quiz_questions')
      .select('*')
      .limit(1)

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message)
      console.log('\n💡 Please run the migration manually in Supabase Dashboard')
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
      
      // Update existing questions with sequential display_order
      console.log('\n📝 Updating existing questions with display_order...')
      
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, section_id, created_at')
        .order('section_id')
        .order('created_at')

      if (questions && questions.length > 0) {
        let currentSection = null
        let orderCounter = 1

        for (const question of questions) {
          if (question.section_id !== currentSection) {
            currentSection = question.section_id
            orderCounter = 1
          }

          await supabase
            .from('quiz_questions')
            .update({ display_order: orderCounter })
            .eq('id', question.id)

          orderCounter++
        }

        console.log(`   ✅ Updated ${questions.length} questions with display_order`)
      } else {
        console.log('   ℹ️  No existing questions to update')
      }
      
      console.log('\n✅ Migration complete!')
      console.log('\n🚀 Ready for Phase 2: Employer Assessments Tab')
    } else {
      console.log('\n⚠️  Some columns may be missing.')
      console.log('\n📝 Please run the full migration SQL in Supabase Dashboard:')
      console.log('   supabase/migrations/20251016000002_add_assessment_question_types.sql')
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
