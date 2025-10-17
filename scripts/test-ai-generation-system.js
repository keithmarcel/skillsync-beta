#!/usr/bin/env node

/**
 * Comprehensive AI Generation System Test Suite
 *
 * Tests the complete AI question generation system including:
 * - Database operations
 * - API endpoints
 * - Frontend components
 * - End-to-end workflows
 *
 * Run with: node scripts/test-ai-generation-system.js
 */

const { config } = require('dotenv')
const fetch = require('node-fetch')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = 'http://localhost:3000'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Timeout wrapper for fetch calls
function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  // Use longer timeout for AI generation endpoints
  if (url.includes('/api/admin/quizzes/generate')) {
    timeoutMs = 30000 // 30 seconds for AI generation
  }
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
  console.log(`[${timestamp}] ${prefix} ${message}`)
}

function test(name, fn) {
  return async () => {
    try {
      log(`Running: ${name}`)
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
  log('🚀 Starting AI Generation System Test Suite')

  // Database Tests
  await test('Database Connection', async () => {
    const { data, error } = await supabase.from('jobs').select('count').limit(1)
    if (error) throw error
  })()

  await test('Skills Table Schema', async () => {
    const { data, error } = await supabase.from('skills').select('*').limit(1)
    if (error) throw error
    if (!data[0].hasOwnProperty('name')) throw new Error('Skills table missing name column')
    if (!data[0].hasOwnProperty('category')) throw new Error('Skills table missing category column')
  })()

  await test('Job Skills Junction Table', async () => {
    const { data, error } = await supabase.from('job_skills').select('*').limit(1)
    if (error) throw error
    if (!data[0].hasOwnProperty('job_id')) throw new Error('Job skills table missing job_id column')
    if (!data[0].hasOwnProperty('skill_id')) throw new Error('Job skills table missing skill_id column')
    if (!data[0].hasOwnProperty('importance_level')) throw new Error('Job skills table missing importance_level column')
  })()

  await test('Quiz Questions Table Schema', async () => {
    const { data, error } = await supabase.from('quiz_questions').select('*').limit(1)
    if (error) throw error
    const columns = Object.keys(data[0])
    const required = ['section_id', 'skill_id', 'stem', 'choices', 'answer_key', 'difficulty']
    for (const col of required) {
      if (!columns.includes(col)) throw new Error(`Quiz questions table missing ${col} column`)
    }
  })()

  // API Endpoint Tests
  await test('Skills API Endpoint', async () => {
    // Find a job with skills
    const { data: jobs } = await supabase.from('jobs').select('id').limit(5)
    if (!jobs.length) throw new Error('No jobs found for testing')

    let testJobId = null
    for (const job of jobs) {
      const { data: skills } = await supabase.from('job_skills').select('id').eq('job_id', job.id).limit(1)
      if (skills.length > 0) {
        testJobId = job.id
        break
      }
    }

    if (!testJobId) throw new Error('No job with skills found for testing')

    const response = await fetchWithTimeout(`${BASE_URL}/api/admin/roles/${testJobId}/skills`)
    if (!response.ok) throw new Error(`API returned ${response.status}`)

    const data = await response.json()
    if (!data.skills || !Array.isArray(data.skills)) throw new Error('Invalid API response format')
    if (data.skills.length === 0) throw new Error('API returned empty skills array')
  })()

  await test('AI Generation API Endpoint', async () => {
    const testPayload = {
      skillId: '00000000-0000-0000-0000-000000000001', // Test UUID
      skillName: 'Test Skill',
      proficiencyLevel: 'intermediate',
      questionCount: 1,
      sectionId: '00000000-0000-0000-0000-000000000002'
    }

    const response = await fetchWithTimeout(`${BASE_URL}/api/admin/quizzes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    })

    // Should return an error for non-existent skill, but API should respond
    if (response.status !== 500) throw new Error(`Expected 500 error for test skill, got ${response.status}`)

    const data = await response.json()
    if (data.success !== false) throw new Error('API should return success: false for test case')
  })()

  await test('AI Generation with Real Skill', async () => {
    // Get a real skill for testing
    const { data: skills } = await supabase.from('skills').select('id, name').limit(1)
    if (!skills.length) throw new Error('No skills found in database')

    const skill = skills[0]
    const testPayload = {
      skillId: skill.id,
      skillName: skill.name,
      proficiencyLevel: 'intermediate',
      questionCount: 1,
      sectionId: '00000000-0000-0000-0000-000000000001'
    }

    const response = await fetchWithTimeout(`${BASE_URL}/api/admin/quizzes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    })

    if (!response.ok) throw new Error(`API returned ${response.status}`)

    const data = await response.json()
    if (!data.success) throw new Error(`API failed: ${data.error}`)
    if (!data.questions || !Array.isArray(data.questions)) throw new Error('Invalid questions response')
    if (data.questions.length !== 1) throw new Error(`Expected 1 question, got ${data.questions.length}`)

    // Validate question structure
    const question = data.questions[0]
    const requiredFields = ['stem', 'choices', 'correct_answer', 'explanation', 'difficulty']
    for (const field of requiredFields) {
      if (!(field in question)) throw new Error(`Question missing required field: ${field}`)
    }
  })()

  // Frontend Component Tests (mock browser environment)
  await test('Frontend App Accessibility', async () => {
    const response = await fetchWithTimeout(BASE_URL)
    if (!response.ok) throw new Error(`Frontend not accessible: ${response.status}`)
    const html = await response.text()
    if (!html.includes('SkillSync')) throw new Error('Frontend not loading properly')
  })()

  await test('Assessment Page Load', async () => {
    // Find a quiz for testing
    const { data: quizzes } = await supabase.from('quizzes').select('id').limit(1)
    if (!quizzes.length) throw new Error('No quizzes found for testing')

    const quizId = quizzes[0].id
    const response = await fetchWithTimeout(`${BASE_URL}/employer/assessments/${quizId}/edit`)
    if (!response.ok) throw new Error(`Assessment page not accessible: ${response.status}`)
  })()

  // Integration Tests
  await test('Complete AI Generation Workflow', async () => {
    log('Testing complete AI generation workflow...')

    // 1. Get a job with skills
    const { data: jobs } = await supabase.from('jobs').select('id').limit(5)
    let testJobId = null
    for (const job of jobs) {
      const { data: skills } = await supabase.from('job_skills').select('id').eq('job_id', job.id).limit(1)
      if (skills.length > 0) {
        testJobId = job.id
        break
      }
    }
    if (!testJobId) throw new Error('No job with skills found')

    // 2. Create a test quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        job_id: testJobId,
        estimated_minutes: 10,
        version: 1
      })
      .select()
      .single()

    if (quizError) throw quizError
    log(`Created test quiz: ${quiz.id}`)

    try {
      // 3. Create quiz section
      const { data: section, error: sectionError } = await supabase
        .from('quiz_sections')
        .insert({
          quiz_id: quiz.id,
          order_index: 1
        })
        .select()
        .single()

      if (sectionError) throw sectionError
      log(`Created test section: ${section.id}`)

      // 4. Get skills for the job
      const skillsResponse = await fetchWithTimeout(`${BASE_URL}/api/admin/roles/${testJobId}/skills`)
      if (!skillsResponse.ok) throw new Error(`Skills API failed: ${skillsResponse.status}`)
      const skillsData = await skillsResponse.json()

      // 5. Generate questions for first skill
      const firstSkill = skillsData.skills[0]
      const genResponse = await fetchWithTimeout(`${BASE_URL}/api/admin/quizzes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: firstSkill.id,
          skillName: firstSkill.name,
          proficiencyLevel: 'intermediate',
          questionCount: 2,
          sectionId: section.id
        })
      })

      if (!genResponse.ok) throw new Error(`AI generation failed: ${genResponse.status}`)
      const genData = await genResponse.json()
      if (!genData.success) throw new Error(`AI generation error: ${genData.error}`)

      log(`Generated ${genData.questions.length} questions successfully`)

      // 6. Verify questions were saved
      const { data: savedQuestions, error: fetchError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('section_id', section.id)

      if (fetchError) throw fetchError
      if (savedQuestions.length !== genData.questions.length) {
        throw new Error(`Expected ${genData.questions.length} questions, found ${savedQuestions.length}`)
      }

      log('✅ Complete workflow test passed!')

    } finally {
      // Cleanup test data
      await supabase.from('quizzes').delete().eq('id', quiz.id)
    }
  })()

  // Performance Tests
  await test('AI Generation Performance', async () => {
    const { data: skills } = await supabase.from('skills').select('id, name').limit(1)
    if (!skills.length) throw new Error('No skills found')

    const skill = skills[0]
    const startTime = Date.now()

    const response = await fetchWithTimeout(`${BASE_URL}/api/admin/quizzes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skillId: skill.id,
        skillName: skill.name,
        proficiencyLevel: 'intermediate',
        questionCount: 3,
        sectionId: '00000000-0000-0000-0000-000000000001'
      })
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    if (!response.ok) throw new Error(`API failed: ${response.status}`)

    log(`AI generation took ${duration}ms`)

    // Should complete within 30 seconds
    if (duration > 30000) throw new Error(`AI generation too slow: ${duration}ms`)
  })()

  // Print Results
  console.log('\n' + '='.repeat(60))
  console.log('🧪 AI GENERATION SYSTEM TEST RESULTS')
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
    log('🎉 ALL TESTS PASSED! AI Generation System is fully operational.', 'success')
    process.exit(0)
  } else {
    log(`⚠️  ${results.failed} tests failed. System needs attention.`, 'error')
    process.exit(1)
  }
}

// Run the tests
runTests().catch(error => {
  log(`Test suite failed: ${error.message}`, 'error')
  process.exit(1)
})
