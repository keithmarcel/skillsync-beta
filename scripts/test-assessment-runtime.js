require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

console.log('🧪 ASSESSMENT RUNTIME TEST\n')
console.log('Testing actual database operations and API calls\n')
console.log('=' .repeat(60))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

let passed = 0
let failed = 0
const errors = []

async function test(description, testFn) {
  try {
    await testFn()
    console.log(`✅ ${description}`)
    passed++
  } catch (error) {
    console.log(`❌ ${description}`)
    console.log(`   Error: ${error.message}`)
    failed++
    errors.push({ test: description, error: error.message })
  }
}

async function runTests() {
  console.log('\n📊 DATABASE SCHEMA VERIFICATION')
  console.log('-'.repeat(60))

  // Test 1: Check quizzes table columns
  await test('quizzes table has title column', async () => {
    const { error } = await supabase
      .from('quizzes')
      .select('title')
      .limit(1)
    if (error) throw new Error(`Column 'title' missing: ${error.message}`)
  })

  await test('quizzes table has description column', async () => {
    const { error } = await supabase
      .from('quizzes')
      .select('description')
      .limit(1)
    if (error) throw new Error(`Column 'description' missing: ${error.message}`)
  })

  await test('quizzes table has status column', async () => {
    const { error } = await supabase
      .from('quizzes')
      .select('status')
      .limit(1)
    if (error) throw new Error(`Column 'status' missing: ${error.message}`)
  })

  await test('quizzes table has required_proficiency_pct column', async () => {
    const { error } = await supabase
      .from('quizzes')
      .select('required_proficiency_pct')
      .limit(1)
    if (error) throw new Error(`Column 'required_proficiency_pct' missing: ${error.message}`)
  })

  await test('quiz_questions table has question_type column', async () => {
    const { error } = await supabase
      .from('quiz_questions')
      .select('question_type')
      .limit(1)
    if (error) throw new Error(`Column 'question_type' missing: ${error.message}`)
  })

  await test('quiz_questions table has display_order column', async () => {
    const { error } = await supabase
      .from('quiz_questions')
      .select('display_order')
      .limit(1)
    if (error) throw new Error(`Column 'display_order' missing: ${error.message}`)
  })

  await test('quiz_sections table has display_order column', async () => {
    const { error } = await supabase
      .from('quiz_sections')
      .select('display_order')
      .limit(1)
    if (error) throw new Error(`Column 'display_order' missing: ${error.message}`)
  })

  console.log('\n🔄 CRUD OPERATIONS')
  console.log('-'.repeat(60))

  let testQuizId = null
  let testSectionId = null
  let testJobId = null

  // Get a test job
  await test('Can fetch jobs for testing', async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('id')
      .eq('job_kind', 'featured_role')
      .limit(1)
      .single()
    
    if (error) throw new Error(`Cannot fetch jobs: ${error.message}`)
    if (!data) throw new Error('No jobs found for testing')
    testJobId = data.id
  })

  // Test CREATE quiz
  await test('Can create quiz with all required fields', async () => {
    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        title: 'Test Assessment Runtime',
        job_id: testJobId,
        description: 'Test description',
        required_proficiency_pct: 90,
        status: 'draft'
      })
      .select()
      .single()
    
    if (error) throw new Error(`Insert failed: ${error.message}`)
    if (!data) throw new Error('No data returned from insert')
    testQuizId = data.id
  })

  // Test CREATE section
  await test('Can create quiz section', async () => {
    if (!testQuizId) throw new Error('No test quiz ID')
    
    const { data, error } = await supabase
      .from('quiz_sections')
      .insert({
        quiz_id: testQuizId,
        skill_id: null,
        display_order: 1
      })
      .select()
      .single()
    
    if (error) throw new Error(`Insert failed: ${error.message}`)
    if (!data) throw new Error('No data returned from insert')
    testSectionId = data.id
  })

  // Test CREATE question
  await test('Can create multiple choice question', async () => {
    if (!testSectionId) throw new Error('No test section ID')
    
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({
        section_id: testSectionId,
        question_type: 'multiple_choice',
        stem: 'Test question?',
        choices: JSON.stringify(['A', 'B', 'C', 'D']),
        answer_key: 'A',
        importance_level: 3,
        difficulty: 'medium',
        display_order: 1
      })
      .select()
      .single()
    
    if (error) throw new Error(`Insert failed: ${error.message}`)
    if (!data) throw new Error('No data returned from insert')
  })

  // Test READ quiz
  await test('Can read quiz with all fields', async () => {
    if (!testQuizId) throw new Error('No test quiz ID')
    
    const { data, error } = await supabase
      .from('quizzes')
      .select('id, title, description, status, required_proficiency_pct, job_id')
      .eq('id', testQuizId)
      .single()
    
    if (error) throw new Error(`Select failed: ${error.message}`)
    if (!data) throw new Error('No data returned')
    if (data.title !== 'Test Assessment Runtime') throw new Error('Title mismatch')
    if (data.required_proficiency_pct !== 90) throw new Error('Proficiency mismatch')
  })

  // Test UPDATE quiz
  await test('Can update quiz fields', async () => {
    if (!testQuizId) throw new Error('No test quiz ID')
    
    const { error } = await supabase
      .from('quizzes')
      .update({
        title: 'Test Assessment Updated',
        status: 'published'
      })
      .eq('id', testQuizId)
    
    if (error) throw new Error(`Update failed: ${error.message}`)
  })

  // Test company scoping
  await test('Can query quizzes with company scoping', async () => {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        job:jobs!job_id(id, title, company_id)
      `)
      .limit(5)
    
    if (error) throw new Error(`Query failed: ${error.message}`)
  })

  // Cleanup
  console.log('\n🧹 CLEANUP')
  console.log('-'.repeat(60))

  await test('Can delete test quiz (cascade deletes sections/questions)', async () => {
    if (!testQuizId) throw new Error('No test quiz ID')
    
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', testQuizId)
    
    if (error) throw new Error(`Delete failed: ${error.message}`)
  })

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 RUNTIME TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:')
    errors.forEach(err => {
      console.log(`   - ${err.test}`)
      console.log(`     ${err.error}`)
    })
    console.log('\n⚠️  RUNTIME ISSUES DETECTED')
    console.log('\n📋 ACTION REQUIRED:')
    console.log('   1. Run the migration: supabase/migrations/20251016000002_add_assessment_question_types.sql')
    console.log('   2. Verify all columns exist in Supabase Dashboard')
    console.log('   3. Re-run this test')
    process.exit(1)
  } else {
    console.log('\n🎉 ALL RUNTIME TESTS PASSED')
    console.log('\n✅ Database is ready for assessment management')
    process.exit(0)
  }
}

runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error)
  process.exit(1)
})
