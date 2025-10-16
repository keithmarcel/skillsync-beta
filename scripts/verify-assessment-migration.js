/**
 * Verify Assessment Migration
 * Check if columns were added successfully
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verify() {
  console.log('🔍 Verifying assessment migration...\n')

  try {
    // Try to insert a test row to verify schema
    const testId = '00000000-0000-0000-0000-000000000000'
    const testSectionId = '00000000-0000-0000-0000-000000000001'
    
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({
        id: testId,
        section_id: testSectionId,
        question_text: 'Test question',
        question_type: 'multiple_choice',
        correct_answer: 'A',
        importance_level: 3,
        difficulty: 'medium',
        display_order: 1,
        good_answer_example: null,
        max_length: 200
      })
      .select()

    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('❌ Migration failed - columns missing')
        console.error('   Error:', error.message)
        console.log('\n📝 Run migration manually in Supabase Dashboard:')
        console.log('   supabase/migrations/20251016000002_add_assessment_question_types.sql')
        process.exit(1)
      } else if (error.message.includes('foreign key') || error.message.includes('violates')) {
        // Expected - foreign key constraint, but columns exist!
        console.log('✅ All columns exist (foreign key error is expected)')
        console.log('\n📋 Verified columns:')
        console.log('   ✅ question_type')
        console.log('   ✅ good_answer_example')
        console.log('   ✅ max_length')
        console.log('   ✅ display_order')
        console.log('\n🎉 Migration successful!')
        console.log('\n🚀 Ready for Phase 2: Employer Assessments Tab')
      } else {
        console.error('❌ Unexpected error:', error.message)
        process.exit(1)
      }
    } else {
      // Success - clean up test row
      await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', testId)

      console.log('✅ All columns exist and working!')
      console.log('\n📋 Verified columns:')
      console.log('   ✅ question_type')
      console.log('   ✅ good_answer_example')
      console.log('   ✅ max_length')
      console.log('   ✅ display_order')
      console.log('\n🎉 Migration successful!')
      console.log('\n🚀 Ready for Phase 2: Employer Assessments Tab')
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  }
}

verify()
