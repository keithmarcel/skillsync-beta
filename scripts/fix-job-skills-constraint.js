/**
 * Fix job_skills constraint
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixConstraint() {
  console.log('🔧 Fixing job_skills constraint...\n')

  try {
    // Check if table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('job_skills')
      .select('count')
      .limit(1)

    if (tableError) {
      console.error('❌ Table does not exist:', tableError.message)
      process.exit(1)
    }

    console.log('✅ Table exists')

    // Try to insert a test record to see the actual error
    const testJobId = '00000000-0000-0000-0000-000000000000'
    const testSkillId = '00000000-0000-0000-0000-000000000001'
    
    console.log('\n📝 Testing insert with importance_level = 3...')
    const { data: testData, error: testError } = await supabase
      .from('job_skills')
      .insert({
        job_id: testJobId,
        skill_id: testSkillId,
        importance_level: 3
      })
      .select()

    if (testError) {
      console.error('❌ Test insert failed:', testError.message)
      console.error('   Code:', testError.code)
      console.error('   Details:', testError.details)
      console.error('   Hint:', testError.hint)
      
      console.log('\n💡 The constraint might need to be recreated.')
      console.log('   Run this SQL in Supabase dashboard:')
      console.log('   ')
      console.log('   ALTER TABLE job_skills DROP CONSTRAINT IF EXISTS job_skills_importance_level_check;')
      console.log('   ALTER TABLE job_skills ADD CONSTRAINT job_skills_importance_level_check CHECK (importance_level >= 1 AND importance_level <= 5);')
    } else {
      console.log('✅ Test insert successful!')
      
      // Clean up test record
      await supabase
        .from('job_skills')
        .delete()
        .eq('job_id', testJobId)
        .eq('skill_id', testSkillId)
      
      console.log('✅ Constraint is working correctly')
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

fixConstraint()
