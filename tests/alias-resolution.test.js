// Simple test script for alias resolution functionality
// Run with: node tests/alias-resolution.test.js

const testAliasResolution = async () => {
  console.log('🧪 Testing Lightcast Alias Resolution\n')

  // Test data - simulate skills and aliases
  const mockSkills = [
    { id: '1', name: 'Project Management', category: 'Management' },
    { id: '2', name: 'Microsoft Excel', category: 'Software' },
    { id: '3', name: 'Six Sigma', category: 'Process Improvement' }
  ]

  const mockAliases = [
    { skill_id: '1', alias: 'PM' },
    { skill_id: '1', alias: 'Project Manager' },
    { skill_id: '2', alias: 'Excel' },
    { skill_id: '2', alias: 'Spreadsheets' },
    { skill_id: '3', alias: 'Lean Six Sigma' },
    { skill_id: '3', alias: 'Six-Sigma' }
  ]

  // Simulate the extraction function logic
  function normalizeText(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
  }

  function extractSkillsFromText(text, aliasMap, skillsMap) {
    const foundSkills = new Set()
    const normalizedText = normalizeText(text)
    
    // Check for exact skill name matches
    for (const [skillName, skillId] of skillsMap) {
      const regex = new RegExp(`\\b${skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (regex.test(normalizedText)) {
        foundSkills.add(skillId)
      }
    }
    
    // Check for alias matches
    for (const [alias, skillId] of aliasMap) {
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (regex.test(normalizedText)) {
        foundSkills.add(skillId)
      }
    }
    
    return foundSkills
  }

  // Create lookup maps
  const skillsMap = new Map()
  mockSkills.forEach(skill => {
    skillsMap.set(skill.name.toLowerCase(), skill.id)
  })

  const aliasMap = new Map()
  mockAliases.forEach(alias => {
    aliasMap.set(alias.alias.toLowerCase(), alias.skill_id)
  })

  // Test cases
  const testCases = [
    {
      name: 'Direct skill name match',
      text: 'I have experience with Project Management and team leadership.',
      expectedSkills: ['1']
    },
    {
      name: 'Alias match - PM',
      text: 'I worked as a PM for 3 years managing software projects.',
      expectedSkills: ['1']
    },
    {
      name: 'Alias match - Excel',
      text: 'Proficient in Excel, PowerPoint, and Word.',
      expectedSkills: ['2']
    },
    {
      name: 'Multiple alias matches',
      text: 'I am a certified PM with advanced Excel skills and Six-Sigma training.',
      expectedSkills: ['1', '2', '3']
    },
    {
      name: 'Case insensitive matching',
      text: 'EXCEL and pm experience with six sigma certification.',
      expectedSkills: ['1', '2', '3']
    },
    {
      name: 'No matches',
      text: 'I have experience with cooking and gardening.',
      expectedSkills: []
    }
  ]

  let passed = 0
  let failed = 0

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`)
    console.log(`   Text: "${testCase.text}"`)
    
    const foundSkills = extractSkillsFromText(testCase.text, aliasMap, skillsMap)
    const foundArray = Array.from(foundSkills).sort()
    const expectedArray = testCase.expectedSkills.sort()
    
    const isMatch = JSON.stringify(foundArray) === JSON.stringify(expectedArray)
    
    if (isMatch) {
      console.log(`   ✅ PASS - Found skills: [${foundArray.join(', ')}]`)
      passed++
    } else {
      console.log(`   ❌ FAIL - Expected: [${expectedArray.join(', ')}], Got: [${foundArray.join(', ')}]`)
      failed++
    }
    console.log('')
  }

  console.log('📊 Test Results:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Alias resolution is working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.')
  }
}

// Run the test
testAliasResolution().catch(console.error)
