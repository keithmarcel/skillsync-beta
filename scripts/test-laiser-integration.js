#!/usr/bin/env node

/**
 * LAiSER Integration Test Script
 * Tests the LAiSER skills extraction integration with SkillSync
 */

import LaiserIntegrationService from '../src/lib/services/laiser-integration.ts'
import LaiserProgramSkillsService from '../src/lib/services/laiser-program-skills.ts'

async function testBasicExtraction() {
  console.log('🧪 Testing LAiSER Basic Skills Extraction\n')

  const service = new LaiserIntegrationService()

  // Check availability
  console.log('1. Checking LAiSER availability...')
  const available = await service.checkAvailability()
  console.log(`   Status: ${available ? '✅ Available' : '❌ Not Available'}\n`)

  if (!available) {
    console.log('❌ LAiSER not available. Please check:')
    console.log('   - Python 3.9+ installed')
    console.log('   - LAiSER package installed: pip install laiser[gpu]')
    console.log('   - Environment variables set')
    return
  }

  // Test with sample text
  console.log('2. Testing skills extraction...')
  const sampleText = `
    This Python programming course covers data structures, algorithms,
    object-oriented programming, and web development with Django.
    Students will learn to build applications using modern development practices.
  `

  try {
    const result = await service.extractSkills(sampleText)

    console.log(`   ✅ Extracted ${result.skills.length} skills in ${result.processing_time}ms`)
    console.log('   📊 Skills found:')

    result.skills.slice(0, 5).forEach((skill, i) => {
      console.log(`      ${i + 1}. ${skill.skill} (Level: ${skill.level}/12)`)
      if (skill.knowledge_required?.length > 0) {
        console.log(`         Knowledge: ${skill.knowledge_required.slice(0, 2).join(', ')}`)
      }
    })

    if (result.skills.length > 5) {
      console.log(`      ... and ${result.skills.length - 5} more skills`)
    }
    console.log()

  } catch (error) {
    console.log(`   ❌ Extraction failed: ${error.message}\n`)
  }
}

async function testProgramSkills() {
  console.log('🧪 Testing LAiSER Program Skills Extraction\n')

  const service = new LaiserProgramSkillsService()

  // Test with a sample program description
  console.log('1. Testing program skills extraction...')
  const programData = {
    id: 'test-program-123',
    name: 'Full Stack Web Development Bootcamp',
    short_desc: 'Learn to build modern web applications with React, Node.js, and cloud technologies',
    long_desc: `
      This comprehensive bootcamp teaches full-stack web development using modern technologies.
      Students will master React for frontend development, Node.js and Express for backend APIs,
      MongoDB for databases, and AWS for cloud deployment. The course covers agile development
      practices, version control with Git, and responsive design principles.
    `,
    cip_code: '11.0801' // Computer Programming
  }

  try {
    // Simulate program data for testing
    console.log('   📝 Program:', programData.name)
    console.log('   📚 CIP Code:', programData.cip_code)

    // Test text extraction
    const combinedText = [
      programData.short_desc,
      programData.long_desc,
      `CIP Code: ${programData.cip_code}`
    ].join('\n\n')

    const laiserService = new LaiserIntegrationService()
    const extractionResult = await laiserService.extractSkills(combinedText)

    console.log(`   ✅ Extracted ${extractionResult.skills.length} skills`)
    console.log('   🔍 Top skills for program:')

    extractionResult.skills.slice(0, 8).forEach((skill, i) => {
      const coverageLevel = skill.level >= 8 ? 'primary' :
                           skill.level >= 5 ? 'secondary' : 'supplemental'
      console.log(`      ${i + 1}. ${skill.skill} (${coverageLevel})`)
    })

    console.log()

  } catch (error) {
    console.log(`   ❌ Program extraction failed: ${error.message}\n`)
  }
}

async function testBatchProcessing() {
  console.log('🧪 Testing LAiSER Batch Processing\n')

  const service = new LaiserIntegrationService()

  const texts = [
    'Python programming course covering data structures and algorithms',
    'Web development with React, JavaScript, and modern frameworks',
    'Database design and SQL optimization techniques',
    'DevOps and cloud deployment with AWS and Docker'
  ]

  try {
    console.log(`1. Processing ${texts.length} texts in batch...`)
    const startTime = Date.now()

    const results = await service.extractSkillsBatch(texts)

    const totalTime = Date.now() - startTime
    const totalSkills = results.reduce((sum, r) => sum + r.skills.length, 0)

    console.log(`   ✅ Batch complete in ${totalTime}ms`)
    console.log(`   📊 Total skills extracted: ${totalSkills}`)
    console.log(`   📈 Average skills per text: ${(totalSkills / texts.length).toFixed(1)}`)
    console.log(`   ⏱️  Average time per text: ${(totalTime / texts.length).toFixed(0)}ms`)
    console.log()

  } catch (error) {
    console.log(`   ❌ Batch processing failed: ${error.message}\n`)
  }
}

async function main() {
  console.log('🚀 LAiSER Integration Test Suite for SkillSync\n')
  console.log('=' .repeat(60))

  try {
    await testBasicExtraction()
    await testProgramSkills()
    await testBatchProcessing()

    console.log('✨ Test suite complete!\n')
    console.log('📋 Next Steps:')
    console.log('   1. Review test results above')
    console.log('   2. Check LAISER_INTEGRATION_SETUP.md for deployment')
    console.log('   3. Integrate into your program creation workflow')
    console.log('   4. Test with real program data')

  } catch (error) {
    console.error('💥 Test suite failed:', error)
    process.exit(1)
  }
}

// Run tests
main().catch(console.error)
