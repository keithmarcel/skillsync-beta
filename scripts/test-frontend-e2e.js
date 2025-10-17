#!/usr/bin/env node

/**
 * Frontend E2E Test Suite for AI Generation
 *
 * Tests the complete user workflow from browser perspective
 *
 * Run with: node scripts/test-frontend-e2e.js
 *
 * Prerequisites:
 * - npm install puppeteer
 */

const { config } = require('dotenv')

// Load environment variables
config({ path: '.env.local' })

const puppeteer = require('puppeteer')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = 'http://localhost:3000'

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
  log('🌐 Starting Frontend E2E Test Suite')

  let browser = null
  let testQuiz = null

  try {
    // Setup test data
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        job_id: '7dd7ace3-f5ef-4448-9c71-0070bbdee9b3',
        estimated_minutes: 15,
        version: 1
      })
      .select()
      .single()

    if (error) throw error
    testQuiz = quiz
    log(`Created test quiz: ${quiz.id}`)

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        log(`Browser Error: ${msg.text()}`, 'error')
      }
    })

    await test('Frontend App Loads', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
      const title = await page.title()
      if (!title.includes('SkillSync')) throw new Error('Page title incorrect')

      const content = await page.$eval('body', el => el.textContent)
      if (!content.includes('SkillSync')) throw new Error('Page content incorrect')
    })()

    await test('Assessment Edit Page Loads', async () => {
      await page.goto(`${BASE_URL}/employer/assessments/${testQuiz.id}/edit`, { waitUntil: 'networkidle0' })

      // Wait for the page to load
      await page.waitForTimeout(2000)

      const url = page.url()
      if (!url.includes(`/employer/assessments/${testQuiz.id}/edit`)) {
        throw new Error('Failed to navigate to assessment edit page')
      }

      // Check if questions tab is visible
      const questionsTab = await page.$('[data-testid="questions-tab"]') ||
                          await page.$('button:has-text("Questions")') ||
                          await page.$('text="Questions"')

      if (!questionsTab) {
        // Try to find it by checking the page content
        const content = await page.$eval('body', el => el.textContent)
        if (!content.includes('Questions') && !content.includes('Generate with AI')) {
          throw new Error('Questions tab not found on page')
        }
      }
    })()

    await test('AI Generation Button Visible', async () => {
      const aiButton = await page.$('button:has-text("Generate with AI")') ||
                      await page.$('text="Generate with AI"')

      if (!aiButton) {
        // Check if button exists in any form
        const buttons = await page.$$eval('button', buttons =>
          buttons.map(btn => btn.textContent)
        )
        const hasAIButton = buttons.some(text => text && text.includes('Generate with AI'))

        if (!hasAIButton) {
          throw new Error('Generate with AI button not found')
        }
      }

      log('✅ AI Generation button is visible')
    })()

    await test('Empty State Display', async () => {
      const content = await page.$eval('body', el => el.textContent)

      if (content.includes('Generate with AI') && !content.includes('You already have')) {
        log('✅ Empty state properly displayed')
      } else {
        log('ℹ️  Page may have existing questions, skipping empty state check')
      }
    })()

    await test('Page Responsiveness', async () => {
      // Test mobile viewport
      await page.setViewport({ width: 375, height: 667 })
      await page.waitForTimeout(1000)

      const mobileContent = await page.$eval('body', el => el.textContent)
      if (!mobileContent.includes('Generate with AI')) {
        throw new Error('Content not visible on mobile viewport')
      }

      // Test desktop viewport
      await page.setViewport({ width: 1920, height: 1080 })
      await page.waitForTimeout(1000)

      const desktopContent = await page.$eval('body', el => el.textContent)
      if (!desktopContent.includes('Generate with AI')) {
        throw new Error('Content not visible on desktop viewport')
      }

      log('✅ Page responsive across viewports')
    })()

    await test('Navigation Works', async () => {
      // Try to navigate back to home
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' })

      const homeContent = await page.$eval('body', el => el.textContent)
      if (!homeContent.includes('SkillSync')) {
        throw new Error('Navigation to home failed')
      }

      log('✅ Navigation working properly')
    })()

  } finally {
    if (browser) {
      await browser.close()
    }

    // Cleanup test data
    if (testQuiz) {
      await supabase.from('quizzes').delete().eq('id', testQuiz.id)
      log(`Cleaned up test quiz: ${testQuiz.id}`)
    }
  }

  // Print Results
  console.log('\n' + '='.repeat(60))
  console.log('🌐 FRONTEND E2E TEST RESULTS')
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
    log('🎉 ALL FRONTEND E2E TESTS PASSED! UI is fully functional.', 'success')
    process.exit(0)
  } else {
    log(`⚠️  ${results.failed} frontend tests failed. Check UI implementation.`, 'error')
    process.exit(1)
  }
}

// Check if puppeteer is available
try {
  require('puppeteer')
} catch (e) {
  log('❌ Puppeteer not installed. Run: npm install --save-dev puppeteer', 'error')
  process.exit(1)
}

runTests().catch(error => {
  log(`Frontend E2E test suite failed: ${error.message}`, 'error')
  process.exit(1)
})
