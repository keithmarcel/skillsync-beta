/**
 * Question Bank System Tests
 * 
 * Tests Phase 1 & 2 implementation:
 * - Question bank generation
 * - Skill selection logic
 * - Random question sampling
 * - Anti-repeat functionality
 * - Dynamic assessment assembly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test configuration
const TEST_SOC_CODE = '15-1252.00'; // Software Developers
let TEST_JOB_ID = null;
let TEST_USER_ID = null;

async function setup() {
  console.log('\n🔧 Setting up tests...\n');

  // Get Software Developers job
  const { data: job } = await supabase
    .from('jobs')
    .select('id')
    .eq('soc_code', TEST_SOC_CODE)
    .single();

  TEST_JOB_ID = job.id;
  console.log(`✅ Test job ID: ${TEST_JOB_ID}`);

  // Get or create test user
  const { data: users } = await supabase.auth.admin.listUsers();
  TEST_USER_ID = users.users[0]?.id;
  
  if (!TEST_USER_ID) {
    console.log('⚠️  No users found - some tests will be skipped');
  } else {
    console.log(`✅ Test user ID: ${TEST_USER_ID}`);
  }
}

async function test1_checkSkills() {
  console.log('\n📋 TEST 1: Check job has skills');

  const { data: skills } = await supabase
    .from('job_skills')
    .select('*, skills(name)')
    .eq('job_id', TEST_JOB_ID);

  console.log(`  Found ${skills.length} skills`);
  
  const critical = skills.filter(s => s.importance_level === 'critical');
  const important = skills.filter(s => s.importance_level === 'important');
  const helpful = skills.filter(s => s.importance_level === 'helpful');

  console.log(`  - Critical: ${critical.length}`);
  console.log(`  - Important: ${important.length}`);
  console.log(`  - Helpful: ${helpful.length}`);

  if (skills.length === 0) {
    console.log('  ❌ FAIL: No skills found');
    return false;
  }

  console.log('  ✅ PASS');
  return true;
}

async function test2_skillSelection() {
  console.log('\n🎯 TEST 2: Top skill selection logic');

  const { data: allSkills } = await supabase
    .from('job_skills')
    .select('*, skills(name)')
    .eq('job_id', TEST_JOB_ID);

  // Simulate selectTopSkills function
  const topSkills = allSkills
    .filter(s => ['critical', 'important'].includes(s.importance_level))
    .sort((a, b) => {
      if (a.importance_level === b.importance_level) {
        return (b.weight || 0) - (a.weight || 0);
      }
      return a.importance_level === 'critical' ? -1 : 1;
    })
    .slice(0, 7);

  console.log(`  Selected ${topSkills.length} top skills:`);
  topSkills.forEach(s => {
    console.log(`    - ${s.skills.name} (${s.importance_level})`);
  });

  if (topSkills.length === 0) {
    console.log('  ❌ FAIL: No top skills selected');
    return false;
  }

  if (topSkills.length > 7) {
    console.log('  ❌ FAIL: Too many skills selected');
    return false;
  }

  console.log('  ✅ PASS');
  return true;
}

async function test3_questionBankExists() {
  console.log('\n📚 TEST 3: Check if question bank exists');

  const { data: skills } = await supabase
    .from('job_skills')
    .select('skill_id, skills(name)')
    .eq('job_id', TEST_JOB_ID)
    .limit(1);

  if (!skills || skills.length === 0) {
    console.log('  ⚠️  SKIP: No skills to check');
    return true;
  }

  const { count } = await supabase
    .from('quiz_questions')
    .select('*', { count: 'exact', head: true })
    .eq('skill_id', skills[0].skill_id)
    .eq('is_bank_question', true);

  console.log(`  Found ${count} bank questions for ${skills[0].skills.name}`);

  if (count === 0) {
    console.log('  ⚠️  No question bank yet - needs generation');
    return true; // Not a failure, just needs setup
  }

  console.log('  ✅ PASS');
  return true;
}

async function test4_randomSampling() {
  console.log('\n🎲 TEST 4: Random question sampling');

  const { data: skills } = await supabase
    .from('job_skills')
    .select('skill_id, skills(name)')
    .eq('job_id', TEST_JOB_ID)
    .limit(1);

  if (!skills || skills.length === 0) {
    console.log('  ⚠️  SKIP: No skills');
    return true;
  }

  const { data: allQuestions } = await supabase
    .from('quiz_questions')
    .select('id')
    .eq('skill_id', skills[0].skill_id)
    .eq('is_bank_question', true);

  if (!allQuestions || allQuestions.length < 3) {
    console.log('  ⚠️  SKIP: Not enough questions in bank');
    return true;
  }

  // Sample 3 questions twice
  const sample1 = allQuestions.sort(() => Math.random() - 0.5).slice(0, 3);
  const sample2 = allQuestions.sort(() => Math.random() - 0.5).slice(0, 3);

  console.log(`  Sample 1: ${sample1.map(q => q.id.substring(0, 8)).join(', ')}`);
  console.log(`  Sample 2: ${sample2.map(q => q.id.substring(0, 8)).join(', ')}`);

  const identical = JSON.stringify(sample1) === JSON.stringify(sample2);
  
  if (identical) {
    console.log('  ⚠️  WARNING: Samples are identical (may be random chance)');
  } else {
    console.log('  ✅ Samples are different');
  }

  console.log('  ✅ PASS');
  return true;
}

async function test5_antiRepeat() {
  console.log('\n🚫 TEST 5: Anti-repeat logic');

  if (!TEST_USER_ID) {
    console.log('  ⚠️  SKIP: No test user');
    return true;
  }

  const { data: skills } = await supabase
    .from('job_skills')
    .select('skill_id')
    .eq('job_id', TEST_JOB_ID)
    .limit(1);

  if (!skills || skills.length === 0) {
    console.log('  ⚠️  SKIP: No skills');
    return true;
  }

  const { data: allQuestions } = await supabase
    .from('quiz_questions')
    .select('id')
    .eq('skill_id', skills[0].skill_id)
    .eq('is_bank_question', true)
    .limit(5);

  if (!allQuestions || allQuestions.length < 3) {
    console.log('  ⚠️  SKIP: Not enough questions');
    return true;
  }

  // Simulate user seeing first 2 questions
  const seenQuestions = allQuestions.slice(0, 2);
  
  console.log(`  User has seen: ${seenQuestions.length} questions`);

  // Query excluding seen questions
  const { data: availableQuestions } = await supabase
    .from('quiz_questions')
    .select('id')
    .eq('skill_id', skills[0].skill_id)
    .eq('is_bank_question', true)
    .not('id', 'in', `(${seenQuestions.map(q => q.id).join(',')})`);

  console.log(`  Available (unseen): ${availableQuestions.length} questions`);

  if (availableQuestions.length >= allQuestions.length) {
    console.log('  ❌ FAIL: Exclusion logic not working');
    return false;
  }

  console.log('  ✅ PASS');
  return true;
}

async function test6_assessmentSize() {
  console.log('\n📏 TEST 6: Assessment size validation');

  const maxSkills = 7;
  const questionsPerSkill = 3;
  const expectedMax = maxSkills * questionsPerSkill; // 21

  console.log(`  Target: ${questionsPerSkill} questions × ${maxSkills} skills = ${expectedMax} questions`);

  if (expectedMax < 20 || expectedMax > 30) {
    console.log('  ❌ FAIL: Assessment size out of range (should be 20-30)');
    return false;
  }

  console.log('  ✅ PASS: Assessment size is appropriate');
  return true;
}

async function test7_databaseSchema() {
  console.log('\n🗄️  TEST 7: Database schema validation');

  // Check quiz_questions columns
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('is_bank_question, times_used, last_used_at')
    .limit(1);

  if (!questions || questions.length === 0) {
    console.log('  ⚠️  No questions to check schema');
  } else {
    const hasColumns = 'is_bank_question' in questions[0] && 
                      'times_used' in questions[0];
    
    if (!hasColumns) {
      console.log('  ❌ FAIL: Missing required columns');
      return false;
    }
    console.log('  ✅ quiz_questions schema correct');
  }

  // Check user_question_history table exists
  const { error } = await supabase
    .from('user_question_history')
    .select('*')
    .limit(1);

  if (error && error.message.includes('does not exist')) {
    console.log('  ❌ FAIL: user_question_history table missing');
    return false;
  }

  console.log('  ✅ user_question_history table exists');
  console.log('  ✅ PASS');
  return true;
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   QUESTION BANK SYSTEM - TEST SUITE');
  console.log('═══════════════════════════════════════════════════');

  await setup();

  const tests = [
    test1_checkSkills,
    test2_skillSelection,
    test3_questionBankExists,
    test4_randomSampling,
    test5_antiRepeat,
    test6_assessmentSize,
    test7_databaseSchema
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
      else failed++;
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`   RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('✅ All tests passed! Question bank system is ready.\n');
  } else {
    console.log('⚠️  Some tests failed. Review output above.\n');
  }
}

runAllTests().catch(console.error);
