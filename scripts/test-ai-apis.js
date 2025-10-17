#!/usr/bin/env node

/**
 * AI Generation API Test Suite
 *
 * Comprehensive testing of AI generation endpoints and workflows
 *
 * Run with: node scripts/test-ai-apis.js
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
  log('🔗 Starting AI Generation API Test Suite')

  // Setup test data
  let testQuiz = null
  let testSection = null

  try {
    // Create test quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        job_id: '7dd7ace3-f5ef-4448-9c71-0070bbdee9b3', // Use existing job
        estimated_minutes: 15,
        version: 1
      })
      .select()
      .single()

    if (quizError) throw quizError
    testQuiz = quiz
    log(`Created test quiz: ${quiz.id}`)

    // Create test section
    const { data: section, error: sectionError } = await supabase
      .from('quiz_sections')
      .insert({
        quiz_id: quiz.id,
        order_index: 1
      })
      .select()
      .single()

    if (sectionError) throw sectionError
    testSection = section
    log(`Created test section: ${section.id}`)

    // API Endpoint Tests
    await test('Skills API - Invalid Job ID', async () => {
      const response = await fetchWithTimeout(`${BASE_URL}/api/admin/roles/invalid-job-id/skills`)
      if (response.status !== 500) throw new Error(`Expected 500, got ${response.status}`)
    })()

    await test('Skills API - Valid Job ID', async () => {
      const response = await fetchWithTimeout(`${BASE_URL}/api/admin/roles/7dd7ace3-f5ef-4448-9c71-0070bbdee9b3/skills`)
      if (!response.ok) throw new Error(`API failed: ${response.status}`)

      const data = await response.json()
      if (!data.skills || !Array.isArray(data.skills)) throw new Error('Invalid response format')
      if (data.skills.length === 0) throw new Error('No skills returned')

      // Validate skill structure
      const skill = data.skills[0]
      const requiredFields = ['id', 'name', 'category', 'importance_level']
      for (const field of requiredFields) {
        if (!(field in skill)) throw new Error(`Skill missing field: ${field}`)
      }
    })()

    await test('AI Generation API - Missing Parameters', async () => {
      const response = await fetchWithTimeout(`${BASE_URL}/api/admin/quizzes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`)
      const data = await response.json()
      if (data.success !== false) throw new Error('Should return success: false')
    })()

    await test('AI Generation API - Invalid Skill ID', async () => {
      const payload = {
        skillId: '00000000-0000-0000-0000-000000000000',
        skillName: 'Invalid Skill',
        proficiencyLevel: 'intermediate',
        questionCount: 1,
        sectionId: testSection.id
      }

      const response = await fetchWithTimeout(`${BASE_URL}/api/admin/quizzes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.status !== 500) throw new Error(`Expected 500 for invalid skill, got ${response.status}`)
      const data = await response.json()
      if (data.success !== false) throw new Error('Should return success: false')
    })()

    await test('AI Generation API - Valid Request', async () => {
      // Get a real skill first
      const { data: skills } = await supabase.from('skills').select('id, name').limit(1)
      if (!skills.length) throw new Error('No skills available for testing')

      const skill = skills[0]
      const payload = {
        skillId: skill.id,
        skillName: skill.name,
        proficiencyLevel: 'intermediate',
        questionCount: 2,
        sectionId: testSection.id
      }

      const startTime = Date.now()
      const response = await fetchWithTimeout(`${BASE_URL}/api/admin/quizzes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const duration = Date.now() - startTime

      if (!response.ok) throw new Error(`API failed: ${response.status}`)

      const data = await response.json()
      if (!data.success) throw new Error(`Generation failed: ${data.error}`)
      if (!data.questions || !Array.isArray(data.questions)) throw new Error('Invalid questions format')
      if (data.questions.length !== 2) throw new Error(`Expected 2 questions, got ${data.questions.length}`)

      log(`AI generation completed in ${duration}ms`)

      // Validate question structure
      for (const question of data.questions) {
        const requiredFields = ['stem', 'choices', 'correct_answer', 'explanation', 'difficulty']
        for (const field of requiredFields) {
          if (!(field in question)) throw new Error(`Question missing field: ${field}`)
        }

        // Validate choices is an object
        if (typeof question.choices !== 'object') throw new Error('Choices should be an object')
      }
    })()

    await test('AI Generation API - Performance Test', async () => {
      const { data: skills } = await supabase.from('skills').select('id, name').limit(1)
      const skill = skills[0]

      const payload = {
        skillId: skill.id,
        skillName: skill.name,
        proficiencyLevel: 'expert',
        questionCount: 3,
        sectionId: testSection.id
      }

      const startTime = Date.now()
      const response = await fetchWithTimeout(`${BASE_URL}/api/admin/quizzes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const duration = Date.now() - startTime

      if (!response.ok) throw new Error(`API failed: ${response.status}`)

      // Should complete within 45 seconds for expert level
      if (duration > 45000) throw new Error(`Too slow: ${duration}ms`)

      log(`Expert level generation: ${duration}ms`)
    })()

    await test('AI Generation API - Different Proficiency Levels', async () => {
      const { data: skills } = await supabase.from('skills').select('id, name').limit(1)
      const skill = skills[0]

      const levels = ['beginner', 'intermediate', 'expert']

      for (const level of levels) {
        const payload = {
          skillId: skill.id,
          skillName: skill.name,
          proficiencyLevel: level,
          questionCount: 1,
          sectionId: testSection.id
        }

        const response = await fetchWithTimeout(`${BASE_URL}/api/admin/quizzes/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) throw new Error(`Failed for ${level} level: ${response.status}`)

        const data = await response.json()
        if (!data.success) throw new Error(`${level} generation failed: ${data.error}`)
        if (data.questions[0].difficulty !== level) {
          throw new Error(`Expected difficulty ${level}, got ${data.questions[0].difficulty}`)
        }

        log(`✅ ${level} level generation successful`)
      }
    })()

    await test('Database Integration - Questions Saved', async () => {
      const { data: questions, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('section_id', testSection.id)

      if (error) throw error
      if (questions.length === 0) throw new Error('No questions saved to database')

      // Validate saved question structure
      for (const q of questions) {
        if (!q.stem || !q.choices || !q.answer_key) {
          throw new Error('Saved question missing required fields')
        }

        // Validate choices is JSON string
        try {
          JSON.parse(q.choices)
        } catch (e) {
          throw new Error(`Invalid JSON in saved choices: ${q.choices}`)
        }
      }

      log(`Found ${questions.length} questions saved in database`)
    })()

    // Error Handling Tests
    await test('AI Generation API - OpenAI Error Handling', async () => {
      // Test with a very long skill name that might cause issues
      const longName = 'A'.repeat(1000)
      const payload = {
        skillId: '00000000-0000-0000-0000-000000000001',
        skillName: longName,
        proficiencyLevel: 'intermediate',
        questionCount: 1,
        sectionId: testSection.id
      }

      const response = await fetch(`${BASE_URL}/api/admin/quizzes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      // Should handle gracefully (either succeed or fail with proper error)
      const data = await response.json()
      if (typeof data.success !== 'boolean') throw new Error('API should always return success field')
    })()

  } finally {
    // Cleanup
    if (testQuiz) {
      await supabase.from('quizzes').delete().eq('id', testQuiz.id)
      log(`Cleaned up test quiz: ${testQuiz.id}`)
    }
  }

  // Print Results
  console.log('\n' + '='.repeat(60))
  console.log('🔗 AI GENERATION API TEST RESULTS')
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
    log('🎉 ALL AI API TESTS PASSED! System is fully operational.', 'success')
    process.exit(0)
  } else {
    log(`⚠️  ${results.failed} API tests failed. Check implementation.`, 'error')
    process.exit(1)
  }
}

runTests().catch(error => {
  log(`API test suite failed: ${error.message}`, 'error')
  process.exit(1)
})
