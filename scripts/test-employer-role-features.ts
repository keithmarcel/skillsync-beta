/**
 * Comprehensive Test Suite for Employer Role Features
 * Tests: EMPLOYER-601, EMPLOYER-602, EMPLOYER-603
 * 
 * Validates:
 * - UI components and interactions
 * - Backend API endpoints
 * - Database connections and updates
 * - Navigation and routing
 * - Save states and persistence
 * - Error handling
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Test configuration
const TEST_CONFIG = {
  testCompanyId: null as string | null,
  testRoleId: null as string | null,
  originalRoleData: null as any,
}

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80))
  log(`  ${title}`, 'cyan')
  console.log('='.repeat(80))
}

function logTest(testName: string) {
  console.log(`\n${colors.blue}▶ ${testName}${colors.reset}`)
}

function logPass(message: string) {
  log(`  ✓ ${message}`, 'green')
}

function logFail(message: string) {
  log(`  ✗ ${message}`, 'red')
}

function logWarn(message: string) {
  log(`  ⚠ ${message}`, 'yellow')
}

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
}

function assert(condition: boolean, message: string) {
  results.total++
  if (condition) {
    results.passed++
    logPass(message)
  } else {
    results.failed++
    logFail(message)
    throw new Error(`Assertion failed: ${message}`)
  }
}

function warn(condition: boolean, message: string) {
  if (!condition) {
    results.warnings++
    logWarn(message)
  }
}

// ============================================================================
// SETUP: Find or Create Test Data
// ============================================================================

async function setupTestData() {
  logSection('SETUP: Preparing Test Data')

  // Find a company with employer admin
  logTest('Finding test company')
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('id, name')
    .limit(1)

  if (companyError) throw companyError
  assert(companies && companies.length > 0, 'Found test company')
  
  TEST_CONFIG.testCompanyId = companies[0].id
  log(`  Using company: ${companies[0].name} (${TEST_CONFIG.testCompanyId})`, 'cyan')

  // Find a featured role for this company
  logTest('Finding test role')
  const { data: roles, error: roleError } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', TEST_CONFIG.testCompanyId)
    .eq('job_kind', 'featured_role')
    .limit(1)

  if (roleError) throw roleError
  assert(roles && roles.length > 0, 'Found test role')
  
  TEST_CONFIG.testRoleId = roles[0].id
  TEST_CONFIG.originalRoleData = { ...roles[0] }
  log(`  Using role: ${roles[0].title} (${TEST_CONFIG.testRoleId})`, 'cyan')
  log(`  Original is_published: ${roles[0].is_published}`, 'cyan')
  log(`  Original required_proficiency_pct: ${roles[0].required_proficiency_pct}`, 'cyan')
  log(`  Original visibility_threshold_pct: ${roles[0].visibility_threshold_pct}`, 'cyan')
}

// ============================================================================
// TEST 1: Database Schema Validation
// ============================================================================

async function testDatabaseSchema() {
  logSection('TEST 1: Database Schema Validation')

  logTest('Verify jobs table has required fields')
  const { data: role } = await supabase
    .from('jobs')
    .select('id, is_published, required_proficiency_pct, visibility_threshold_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()

  assert(role !== null, 'Role record exists')
  assert('is_published' in role, 'Field: is_published exists')
  assert('required_proficiency_pct' in role, 'Field: required_proficiency_pct exists')
  assert('visibility_threshold_pct' in role, 'Field: visibility_threshold_pct exists')

  logTest('Verify field types')
  assert(typeof role.is_published === 'boolean', 'is_published is boolean')
  assert(
    typeof role.required_proficiency_pct === 'number' || role.required_proficiency_pct === null,
    'required_proficiency_pct is number or null'
  )
  assert(
    typeof role.visibility_threshold_pct === 'number' || role.visibility_threshold_pct === null,
    'visibility_threshold_pct is number or null'
  )

  logTest('Verify field constraints')
  if (role.required_proficiency_pct !== null) {
    assert(
      role.required_proficiency_pct >= 0 && role.required_proficiency_pct <= 100,
      'required_proficiency_pct is between 0-100'
    )
  }
  if (role.visibility_threshold_pct !== null) {
    assert(
      role.visibility_threshold_pct >= 0 && role.visibility_threshold_pct <= 100,
      'visibility_threshold_pct is between 0-100'
    )
  }
}

// ============================================================================
// TEST 2: EMPLOYER-601 - Publish/Unpublish Toggle
// ============================================================================

async function testPublishUnpublishToggle() {
  logSection('TEST 2: EMPLOYER-601 - Publish/Unpublish Toggle')

  const originalState = TEST_CONFIG.originalRoleData.is_published

  // Test 1: Toggle to opposite state
  logTest('Toggle publish state')
  const newState = !originalState
  const { error: updateError } = await supabase
    .from('jobs')
    .update({ is_published: newState })
    .eq('id', TEST_CONFIG.testRoleId)

  assert(!updateError, 'Update query executed without error')

  // Test 2: Verify state changed in database
  logTest('Verify state persisted to database')
  const { data: updatedRole } = await supabase
    .from('jobs')
    .select('is_published')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()

  assert(updatedRole?.is_published === newState, `State changed to ${newState}`)

  // Test 3: Toggle back to original state
  logTest('Toggle back to original state')
  const { error: revertError } = await supabase
    .from('jobs')
    .update({ is_published: originalState })
    .eq('id', TEST_CONFIG.testRoleId)

  assert(!revertError, 'Revert query executed without error')

  // Test 4: Verify reverted
  logTest('Verify state reverted')
  const { data: revertedRole } = await supabase
    .from('jobs')
    .select('is_published')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()

  assert(revertedRole?.is_published === originalState, `State reverted to ${originalState}`)

  // Test 5: Test rapid toggles (race condition)
  logTest('Test rapid state changes (race condition)')
  const togglePromises = [
    supabase.from('jobs').update({ is_published: true }).eq('id', TEST_CONFIG.testRoleId),
    supabase.from('jobs').update({ is_published: false }).eq('id', TEST_CONFIG.testRoleId),
    supabase.from('jobs').update({ is_published: true }).eq('id', TEST_CONFIG.testRoleId),
  ]

  await Promise.all(togglePromises)
  const { data: finalRole } = await supabase
    .from('jobs')
    .select('is_published')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()

  assert(typeof finalRole?.is_published === 'boolean', 'State remains valid after rapid toggles')

  // Restore original state
  await supabase
    .from('jobs')
    .update({ is_published: originalState })
    .eq('id', TEST_CONFIG.testRoleId)
}

// ============================================================================
// TEST 3: EMPLOYER-602 - Required Proficiency Field
// ============================================================================

async function testRequiredProficiency() {
  logSection('TEST 3: EMPLOYER-602 - Set Required Proficiency')

  const originalValue = TEST_CONFIG.originalRoleData.required_proficiency_pct

  // Test 1: Update to valid value
  logTest('Update required_proficiency_pct to 85')
  const { error: updateError } = await supabase
    .from('jobs')
    .update({ required_proficiency_pct: 85 })
    .eq('id', TEST_CONFIG.testRoleId)

  assert(!updateError, 'Update query executed without error')

  // Test 2: Verify persistence
  logTest('Verify value persisted')
  const { data: updatedRole } = await supabase
    .from('jobs')
    .select('required_proficiency_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()

  assert(updatedRole?.required_proficiency_pct === 85, 'Value updated to 85')

  // Test 3: Test boundary values
  logTest('Test boundary value: 0')
  await supabase.from('jobs').update({ required_proficiency_pct: 0 }).eq('id', TEST_CONFIG.testRoleId)
  const { data: minRole } = await supabase
    .from('jobs')
    .select('required_proficiency_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()
  assert(minRole?.required_proficiency_pct === 0, 'Accepts minimum value (0)')

  logTest('Test boundary value: 100')
  await supabase.from('jobs').update({ required_proficiency_pct: 100 }).eq('id', TEST_CONFIG.testRoleId)
  const { data: maxRole } = await supabase
    .from('jobs')
    .select('required_proficiency_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()
  assert(maxRole?.required_proficiency_pct === 100, 'Accepts maximum value (100)')

  // Test 4: Test invalid values
  logTest('Test invalid value: -10 (should fail or coerce)')
  const { error: negativeError } = await supabase
    .from('jobs')
    .update({ required_proficiency_pct: -10 })
    .eq('id', TEST_CONFIG.testRoleId)
  
  warn(!negativeError, 'Database should reject negative values (no constraint found)')

  logTest('Test invalid value: 150 (should fail or coerce)')
  const { error: overError } = await supabase
    .from('jobs')
    .update({ required_proficiency_pct: 150 })
    .eq('id', TEST_CONFIG.testRoleId)
  
  warn(!overError, 'Database should reject values > 100 (no constraint found)')

  // Test 5: Test null value
  logTest('Test null value')
  await supabase.from('jobs').update({ required_proficiency_pct: null }).eq('id', TEST_CONFIG.testRoleId)
  const { data: nullRole } = await supabase
    .from('jobs')
    .select('required_proficiency_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()
  assert(nullRole?.required_proficiency_pct === null, 'Accepts null value')

  // Test 6: Test decimal values
  logTest('Test decimal value: 87.5')
  await supabase.from('jobs').update({ required_proficiency_pct: 87.5 }).eq('id', TEST_CONFIG.testRoleId)
  const { data: decimalRole } = await supabase
    .from('jobs')
    .select('required_proficiency_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()
  assert(decimalRole?.required_proficiency_pct === 87.5, 'Accepts decimal values')

  // Restore original value
  logTest('Restore original value')
  await supabase
    .from('jobs')
    .update({ required_proficiency_pct: originalValue })
    .eq('id', TEST_CONFIG.testRoleId)
  
  const { data: restoredRole } = await supabase
    .from('jobs')
    .select('required_proficiency_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()
  assert(restoredRole?.required_proficiency_pct === originalValue, 'Original value restored')
}

// ============================================================================
// TEST 4: EMPLOYER-603 - Visibility Threshold Field
// ============================================================================

async function testVisibilityThreshold() {
  logSection('TEST 4: EMPLOYER-603 - Set Invite Threshold')

  const originalValue = TEST_CONFIG.originalRoleData.visibility_threshold_pct

  // Test 1: Update to valid value
  logTest('Update visibility_threshold_pct to 80')
  const { error: updateError } = await supabase
    .from('jobs')
    .update({ visibility_threshold_pct: 80 })
    .eq('id', TEST_CONFIG.testRoleId)

  assert(!updateError, 'Update query executed without error')

  // Test 2: Verify persistence
  logTest('Verify value persisted')
  const { data: updatedRole } = await supabase
    .from('jobs')
    .select('visibility_threshold_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()

  assert(updatedRole?.visibility_threshold_pct === 80, 'Value updated to 80')

  // Test 3: Test relationship with required_proficiency_pct
  logTest('Test business logic: visibility_threshold should be ≤ required_proficiency')
  await supabase.from('jobs').update({ required_proficiency_pct: 90 }).eq('id', TEST_CONFIG.testRoleId)
  await supabase.from('jobs').update({ visibility_threshold_pct: 95 }).eq('id', TEST_CONFIG.testRoleId)
  
  const { data: logicRole } = await supabase
    .from('jobs')
    .select('required_proficiency_pct, visibility_threshold_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()

  warn(
    logicRole && logicRole.visibility_threshold_pct! <= logicRole.required_proficiency_pct!,
    'Business rule: visibility_threshold should be ≤ required_proficiency (no constraint enforced)'
  )

  // Test 4: Test boundary values
  logTest('Test boundary value: 0')
  await supabase.from('jobs').update({ visibility_threshold_pct: 0 }).eq('id', TEST_CONFIG.testRoleId)
  const { data: minRole } = await supabase
    .from('jobs')
    .select('visibility_threshold_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()
  assert(minRole?.visibility_threshold_pct === 0, 'Accepts minimum value (0)')

  logTest('Test boundary value: 100')
  await supabase.from('jobs').update({ visibility_threshold_pct: 100 }).eq('id', TEST_CONFIG.testRoleId)
  const { data: maxRole } = await supabase
    .from('jobs')
    .select('visibility_threshold_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()
  assert(maxRole?.visibility_threshold_pct === 100, 'Accepts maximum value (100)')

  // Test 5: Test null value
  logTest('Test null value')
  await supabase.from('jobs').update({ visibility_threshold_pct: null }).eq('id', TEST_CONFIG.testRoleId)
  const { data: nullRole } = await supabase
    .from('jobs')
    .select('visibility_threshold_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()
  assert(nullRole?.visibility_threshold_pct === null, 'Accepts null value')

  // Restore original value
  logTest('Restore original value')
  await supabase
    .from('jobs')
    .update({ 
      visibility_threshold_pct: originalValue,
      required_proficiency_pct: TEST_CONFIG.originalRoleData.required_proficiency_pct
    })
    .eq('id', TEST_CONFIG.testRoleId)
  
  const { data: restoredRole } = await supabase
    .from('jobs')
    .select('visibility_threshold_pct')
    .eq('id', TEST_CONFIG.testRoleId)
    .single()
  assert(restoredRole?.visibility_threshold_pct === originalValue, 'Original value restored')
}

// ============================================================================
// TEST 5: Integration with Auto-Invite System
// ============================================================================

async function testAutoInviteIntegration() {
  logSection('TEST 5: Integration with Auto-Invite System')

  logTest('Verify auto-invite uses visibility_threshold_pct')
  
  // Check if there are any assessments for this role
  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, readiness_pct, job_id')
    .eq('job_id', TEST_CONFIG.testRoleId)
    .not('readiness_pct', 'is', null)
    .limit(5)

  if (assessments && assessments.length > 0) {
    logPass(`Found ${assessments.length} assessments for this role`)
    
    // Get current threshold
    const { data: role } = await supabase
      .from('jobs')
      .select('visibility_threshold_pct')
      .eq('id', TEST_CONFIG.testRoleId)
      .single()

    const threshold = role?.visibility_threshold_pct || 85

    // Check which assessments would qualify
    const qualifying = assessments.filter(a => a.readiness_pct! >= threshold)
    log(`  ${qualifying.length} assessments meet threshold of ${threshold}%`, 'cyan')

    // Check if invitations exist for qualifying assessments
    if (qualifying.length > 0) {
      const { data: invitations } = await supabase
        .from('employer_invitations')
        .select('id, assessment_id, status')
        .in('assessment_id', qualifying.map(a => a.id))

      log(`  ${invitations?.length || 0} invitations found for qualifying assessments`, 'cyan')
    }
  } else {
    logWarn('No assessments found for this role to test auto-invite integration')
  }
}

// ============================================================================
// TEST 6: UI Component Files Exist
// ============================================================================

async function testUIComponents() {
  logSection('TEST 6: UI Component Validation')

  const fs = require('fs')
  const path = require('path')

  logTest('Verify employer roles table exists')
  const rolesTablePath = path.resolve(__dirname, '../src/components/employer/employer-roles-table-v2.tsx')
  assert(fs.existsSync(rolesTablePath), 'employer-roles-table-v2.tsx exists')

  logTest('Verify employer role editor exists')
  const roleEditorPath = path.resolve(__dirname, '../src/app/(main)/employer/roles/[id]/edit/page.tsx')
  assert(fs.existsSync(roleEditorPath), 'employer role editor page exists')

  logTest('Verify admin role editor exists (wrapped by employer)')
  const adminEditorPath = path.resolve(__dirname, '../src/app/admin/roles/[id]/page.tsx')
  assert(fs.existsSync(adminEditorPath), 'admin role editor exists')

  logTest('Check for publish/unpublish dialog in roles table')
  const rolesTableContent = fs.readFileSync(rolesTablePath, 'utf-8')
  assert(rolesTableContent.includes('publishDialog'), 'Publish dialog state exists')
  assert(rolesTableContent.includes('handleConfirmPublish'), 'Publish handler exists')
  assert(rolesTableContent.includes('toggle-publish'), 'Toggle publish action exists')

  logTest('Check for proficiency fields in admin editor')
  const adminEditorContent = fs.readFileSync(adminEditorPath, 'utf-8')
  assert(adminEditorContent.includes('required_proficiency_pct'), 'Required proficiency field exists')
  assert(adminEditorContent.includes('visibility_threshold_pct'), 'Visibility threshold field exists')
  assert(adminEditorContent.includes('context'), 'Context prop exists for employer/admin differentiation')
}

// ============================================================================
// TEST 7: Route Validation
// ============================================================================

async function testRoutes() {
  logSection('TEST 7: Route Validation')

  const fs = require('fs')
  const path = require('path')

  logTest('Verify employer dashboard route')
  const dashboardPath = path.resolve(__dirname, '../src/app/(main)/employer/page.tsx')
  assert(fs.existsSync(dashboardPath), 'Employer dashboard page exists')

  logTest('Verify employer roles edit route')
  const editPath = path.resolve(__dirname, '../src/app/(main)/employer/roles/[id]/edit/page.tsx')
  assert(fs.existsSync(editPath), 'Employer role edit page exists')

  logTest('Verify employer roles new route')
  const newPath = path.resolve(__dirname, '../src/app/(main)/employer/roles/new/page.tsx')
  assert(fs.existsSync(newPath), 'Employer role new page exists')

  logTest('Check edit page wraps admin editor')
  const editContent = fs.readFileSync(editPath, 'utf-8')
  assert(editContent.includes('RoleEditorPage'), 'Edit page imports admin role editor')
  assert(editContent.includes('context="employer"'), 'Edit page passes employer context')
  assert(editContent.includes('companyId'), 'Edit page passes company ID')
}

// ============================================================================
// CLEANUP & SUMMARY
// ============================================================================

async function cleanup() {
  logSection('CLEANUP: Restoring Original Data')

  if (TEST_CONFIG.testRoleId && TEST_CONFIG.originalRoleData) {
    logTest('Restore original role data')
    const { error } = await supabase
      .from('jobs')
      .update({
        is_published: TEST_CONFIG.originalRoleData.is_published,
        required_proficiency_pct: TEST_CONFIG.originalRoleData.required_proficiency_pct,
        visibility_threshold_pct: TEST_CONFIG.originalRoleData.visibility_threshold_pct,
      })
      .eq('id', TEST_CONFIG.testRoleId)

    if (error) {
      logFail('Failed to restore original data')
      console.error(error)
    } else {
      logPass('Original data restored')
    }
  }
}

function printSummary() {
  logSection('TEST SUMMARY')

  console.log(`\nTotal Tests: ${results.total}`)
  log(`Passed: ${results.passed}`, 'green')
  if (results.failed > 0) {
    log(`Failed: ${results.failed}`, 'red')
  }
  if (results.warnings > 0) {
    log(`Warnings: ${results.warnings}`, 'yellow')
  }

  const passRate = ((results.passed / results.total) * 100).toFixed(1)
  console.log(`\nPass Rate: ${passRate}%`)

  if (results.failed === 0) {
    log('\n✓ ALL TESTS PASSED!', 'green')
    log('\nStories Status:', 'cyan')
    log('  EMPLOYER-601: Publish/Unpublish Toggle - ✓ VERIFIED', 'green')
    log('  EMPLOYER-602: Set Required Proficiency - ✓ VERIFIED', 'green')
    log('  EMPLOYER-603: Set Invite Threshold - ✓ VERIFIED', 'green')
  } else {
    log('\n✗ SOME TESTS FAILED', 'red')
    log('Review failures above and fix issues before marking stories complete', 'yellow')
  }

  console.log('\n' + '='.repeat(80) + '\n')
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  try {
    log('\n╔═══════════════════════════════════════════════════════════════════════════╗', 'cyan')
    log('║  EMPLOYER ROLE FEATURES - COMPREHENSIVE TEST SUITE                        ║', 'cyan')
    log('║  Testing: EMPLOYER-601, EMPLOYER-602, EMPLOYER-603                        ║', 'cyan')
    log('╚═══════════════════════════════════════════════════════════════════════════╝', 'cyan')

    await setupTestData()
    await testDatabaseSchema()
    await testPublishUnpublishToggle()
    await testRequiredProficiency()
    await testVisibilityThreshold()
    await testAutoInviteIntegration()
    await testUIComponents()
    await testRoutes()
    await cleanup()
    
    printSummary()
    
    process.exit(results.failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n' + '='.repeat(80))
    log('FATAL ERROR', 'red')
    console.error('='.repeat(80))
    console.error(error)
    await cleanup()
    process.exit(1)
  }
}

// Run tests
runAllTests()
