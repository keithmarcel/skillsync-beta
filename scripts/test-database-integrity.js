#!/usr/bin/env node

/**
 * Database Schema and Data Integrity Tests
 *
 * Tests database schema, constraints, and data integrity for AI generation system
 *
 * Run with: node scripts/test-database-integrity.js
 */

const { config } = require('dotenv')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const results = { passed: 0, failed: 0, tests: [] }

function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
  console.log(`[${timestamp}] ${prefix} ${message}`)
}

function test(name, fn) {
  return async () => {
    try {
      log(`Testing: ${name}`)
      await fn()
      results.passed++
      results.tests.push({ name, status: 'PASS' })
      log(`${name} - PASSED`, 'success')
    } catch (error) {
      results.failed++
      results.tests.push({ name, status: 'FAIL', error: error.message })
      log(`${name} - FAILED: ${error.message}`, 'error')
    }
  }
}

async function runTests() {
  log('🗄️  Starting Database Integrity Test Suite')

  // Schema Tests
  await test('Jobs Table Schema', async () => {
    const { data, error } = await supabase.from('jobs').select('*').limit(1)
    if (error) throw error

    const requiredColumns = ['id', 'job_kind', 'soc_code', 'title']
    const columns = Object.keys(data[0] || {})

    for (const col of requiredColumns) {
      if (!columns.includes(col)) throw new Error(`Missing required column: ${col}`)
    }
  })()

  await test('Skills Table Schema', async () => {
    const { data, error } = await supabase.from('skills').select('*').limit(1)
    if (error) throw error

    const requiredColumns = ['id', 'name', 'category', 'description']
    const columns = Object.keys(data[0] || {})

    for (const col of requiredColumns) {
      if (!columns.includes(col)) throw new Error(`Missing required column: ${col}`)
    }
  })()

  await test('Job Skills Junction Table Schema', async () => {
    const { data, error } = await supabase.from('job_skills').select('*').limit(1)
    if (error) throw error

    const requiredColumns = ['id', 'job_id', 'skill_id', 'importance_level', 'created_at']
    const columns = Object.keys(data[0] || {})

    for (const col of requiredColumns) {
      if (!columns.includes(col)) throw new Error(`Missing required column: ${col}`)
    }
  })()

  await test('Quiz Questions Table Schema', async () => {
    const { data, error } = await supabase.from('quiz_questions').select('*').limit(1)
    if (error) throw error

    const requiredColumns = ['id', 'section_id', 'skill_id', 'stem', 'choices', 'answer_key', 'difficulty']
    const columns = Object.keys(data[0] || {})

    for (const col of requiredColumns) {
      if (!columns.includes(col)) throw new Error(`Missing required column: ${col}`)
    }
  })()

  // Foreign Key Constraint Tests
  await test('Job Skills Foreign Key Constraints', async () => {
    const { data: jobSkills, error } = await supabase
      .from('job_skills')
      .select('job_id, skill_id')
      .limit(5)

    if (error) throw error

    for (const js of jobSkills) {
      // Check job exists
      const { data: job } = await supabase.from('jobs').select('id').eq('id', js.job_id).single()
      if (!job) throw new Error(`Job ${js.job_id} referenced by job_skills doesn't exist`)

      // Check skill exists
      const { data: skill } = await supabase.from('skills').select('id').eq('id', js.skill_id).single()
      if (!skill) throw new Error(`Skill ${js.skill_id} referenced by job_skills doesn't exist`)
    }
  })()

  await test('Quiz Questions Foreign Key Constraints', async () => {
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('section_id, skill_id')
      .limit(5)

    if (error) throw error

    for (const q of questions) {
      // Check section exists (section_id should never be NULL)
      const { data: section } = await supabase.from('quiz_sections').select('id').eq('id', q.section_id).single()
      if (!section) throw new Error(`Section ${q.section_id} referenced by quiz_questions doesn't exist`)

      // Check skill exists (skill_id can be NULL for some legacy questions)
      if (q.skill_id !== null) {
        const { data: skill } = await supabase.from('skills').select('id').eq('id', q.skill_id).single()
        if (!skill) throw new Error(`Skill ${q.skill_id} referenced by quiz_questions doesn't exist`)
      }
    }
  })()

  // Data Integrity Tests
  await test('Importance Level Constraints', async () => {
    const { data, error } = await supabase
      .from('job_skills')
      .select('importance_level')
      .limit(10)

    if (error) throw error

    for (const item of data) {
      if (item.importance_level < 1 || item.importance_level > 5) {
        throw new Error(`Invalid importance_level: ${item.importance_level} (should be 1-5)`)
      }
    }
  })()

  await test('Question Difficulty Values', async () => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('difficulty')
      .limit(10)

    if (error) throw error

    const validDifficulties = ['beginner', 'intermediate', 'expert']
    for (const item of data) {
      if (!validDifficulties.includes(item.difficulty)) {
        throw new Error(`Invalid difficulty: ${item.difficulty}`)
      }
    }
  })()

  await test('JSON Choices Format', async () => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('choices')
      .limit(5)

    if (error) throw error

    for (const item of data) {
      try {
        const parsed = JSON.parse(item.choices)
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Choices should be an object')
        }
      } catch (e) {
        throw new Error(`Invalid JSON in choices field: ${item.choices}`)
      }
    }
  })()

  // Data Consistency Tests
  await test('Job-Skill Relationships', async () => {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, job_kind')
      .limit(5)

    if (error) throw error

    for (const job of jobs) {
      if (job.job_kind === 'featured_role') {
        const { data: skills } = await supabase
          .from('job_skills')
          .select('id')
          .eq('job_id', job.id)

        if (skills.length === 0) {
          log(`Warning: Featured role ${job.id} has no associated skills`, 'info')
        }
      }
    }
  })()

  await test('Quiz Data Consistency', async () => {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('id, job_id')
      .limit(5)

    if (error) throw error

    for (const quiz of quizzes) {
      // Check quiz has sections
      const { data: sections } = await supabase
        .from('quiz_sections')
        .select('id')
        .eq('quiz_id', quiz.id)

      if (sections.length === 0) {
        log(`Warning: Quiz ${quiz.id} has no sections`, 'info')
      }

      // Check job exists
      const { data: job } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', quiz.job_id)
        .single()

      if (!job) {
        throw new Error(`Quiz ${quiz.id} references non-existent job ${quiz.job_id}`)
      }
    }
  })()

  // Performance Tests
  await test('Query Performance - Skills Lookup', async () => {
    const startTime = Date.now()

    const { data, error } = await supabase
      .from('skills')
      .select('id, name, category')
      .limit(100)

    const duration = Date.now() - startTime

    if (error) throw error
    if (duration > 5000) throw new Error(`Skills query too slow: ${duration}ms`)

    log(`Skills query completed in ${duration}ms`)
  })()

  await test('Query Performance - Job Skills with Relations', async () => {
    const startTime = Date.now()

    const { data, error } = await supabase
      .from('job_skills')
      .select(`
        importance_level,
        skills(id, name, category)
      `)
      .limit(50)

    const duration = Date.now() - startTime

    if (error) throw error
    if (duration > 5000) throw new Error(`Job skills query too slow: ${duration}ms`)

    log(`Job skills query completed in ${duration}ms`)
  })()

  // Print Results
  console.log('\n' + '='.repeat(60))
  console.log('🗄️  DATABASE INTEGRITY TEST RESULTS')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📊 Total:  ${results.passed + results.failed}`)

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:')
    results.tests.filter(t => t.status === 'FAIL').forEach(test => {
      console.log(`   • ${test.name}: ${test.error}`)
    })
  }

  console.log('\n' + '='.repeat(60))

  if (results.failed === 0) {
    log('🎉 ALL DATABASE TESTS PASSED! Data integrity verified.', 'success')
    process.exit(0)
  } else {
    log(`⚠️  ${results.failed} database integrity issues found.`, 'error')
    process.exit(1)
  }
}

runTests().catch(error => {
  log(`Database test suite failed: ${error.message}`, 'error')
  process.exit(1)
})
