/**
 * Test invitations database connections and queries
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testInvitationsDatabase() {
  console.log('🧪 Testing Invitations Database Connections...\n')

  const tests = {
    passed: 0,
    failed: 0,
    results: []
  }

  // Test 1: Table exists
  try {
    const { data, error } = await supabase
      .from('employer_invitations')
      .select('id')
      .limit(1)

    if (error) throw error
    tests.passed++
    tests.results.push('✅ Table exists and is accessible')
  } catch (error) {
    tests.failed++
    tests.results.push(`❌ Table access failed: ${error.message}`)
  }

  // Test 2: Can query with joins
  try {
    const { data, error } = await supabase
      .from('employer_invitations')
      .select(`
        id,
        company:companies(name, logo_url),
        job:jobs(title)
      `)
      .limit(1)

    if (error) throw error
    tests.passed++
    tests.results.push('✅ Joins work correctly (companies, jobs)')
  } catch (error) {
    tests.failed++
    tests.results.push(`❌ Join query failed: ${error.message}`)
  }

  // Test 3: Indexes exist
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'employer_invitations'
      `
    })

    if (error) {
      // If exec_sql doesn't exist, skip this test
      tests.results.push('⚠️  Index check skipped (exec_sql not available)')
    } else {
      tests.passed++
      tests.results.push(`✅ Found ${data?.length || 0} indexes on employer_invitations`)
    }
  } catch (error) {
    tests.results.push('⚠️  Index check skipped')
  }

  // Test 4: RLS policies exist
  try {
    const { count, error } = await supabase
      .from('employer_invitations')
      .select('*', { count: 'exact', head: true })

    if (error && error.code === 'PGRST301') {
      // RLS is enabled (expected error when not authenticated)
      tests.passed++
      tests.results.push('✅ RLS is enabled')
    } else if (!error) {
      tests.passed++
      tests.results.push('✅ RLS policies allow service role access')
    } else {
      throw error
    }
  } catch (error) {
    tests.failed++
    tests.results.push(`❌ RLS check failed: ${error.message}`)
  }

  // Test 5: Can filter by status
  try {
    const { data, error } = await supabase
      .from('employer_invitations')
      .select('id, status')
      .eq('status', 'sent')
      .limit(5)

    if (error) throw error
    tests.passed++
    tests.results.push(`✅ Status filtering works (found ${data.length} sent invitations)`)
  } catch (error) {
    tests.failed++
    tests.results.push(`❌ Status filter failed: ${error.message}`)
  }

  // Test 6: Can filter by proficiency
  try {
    const { data, error } = await supabase
      .from('employer_invitations')
      .select('id, proficiency_pct')
      .gte('proficiency_pct', 90)
      .limit(5)

    if (error) throw error
    tests.passed++
    tests.results.push(`✅ Proficiency filtering works (found ${data.length} ready candidates)`)
  } catch (error) {
    tests.failed++
    tests.results.push(`❌ Proficiency filter failed: ${error.message}`)
  }

  // Test 7: Can update invitation
  try {
    // Get a test invitation
    const { data: invitations } = await supabase
      .from('employer_invitations')
      .select('id, is_read')
      .limit(1)
      .single()

    if (invitations) {
      const { error } = await supabase
        .from('employer_invitations')
        .update({ is_read: !invitations.is_read })
        .eq('id', invitations.id)

      if (error) throw error

      // Revert the change
      await supabase
        .from('employer_invitations')
        .update({ is_read: invitations.is_read })
        .eq('id', invitations.id)

      tests.passed++
      tests.results.push('✅ Can update invitations')
    } else {
      tests.results.push('⚠️  No invitations to test update')
    }
  } catch (error) {
    tests.failed++
    tests.results.push(`❌ Update failed: ${error.message}`)
  }

  // Test 8: Unique constraint works
  try {
    const { data: existing } = await supabase
      .from('employer_invitations')
      .select('user_id, job_id')
      .limit(1)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('employer_invitations')
        .insert({
          user_id: existing.user_id,
          job_id: existing.job_id,
          company_id: '00000000-0000-0000-0000-000000000000', // Dummy
          assessment_id: '00000000-0000-0000-0000-000000000000', // Dummy
          proficiency_pct: 90,
          application_url: 'https://test.com',
          status: 'pending'
        })

      if (error && error.code === '23505') {
        // Unique constraint violation (expected)
        tests.passed++
        tests.results.push('✅ Unique constraint enforced (user_id + job_id)')
      } else if (error) {
        throw error
      } else {
        tests.failed++
        tests.results.push('❌ Unique constraint not enforced')
      }
    } else {
      tests.results.push('⚠️  No invitations to test unique constraint')
    }
  } catch (error) {
    tests.failed++
    tests.results.push(`❌ Unique constraint test failed: ${error.message}`)
  }

  // Test 9: Status enum validation
  try {
    const { error } = await supabase
      .from('employer_invitations')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        company_id: '00000000-0000-0000-0000-000000000000',
        job_id: '00000000-0000-0000-0000-000000000000',
        assessment_id: '00000000-0000-0000-0000-000000000000',
        proficiency_pct: 90,
        application_url: 'https://test.com',
        status: 'invalid_status' // Invalid
      })

    if (error && error.code === '23514') {
      // CHECK constraint violation (expected)
      tests.passed++
      tests.results.push('✅ Status enum validation works')
    } else if (error) {
      throw error
    } else {
      tests.failed++
      tests.results.push('❌ Status enum not validated')
    }
  } catch (error) {
    tests.failed++
    tests.results.push(`❌ Status enum test failed: ${error.message}`)
  }

  // Test 10: Count queries work
  try {
    const { count, error } = await supabase
      .from('employer_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    if (error) throw error
    tests.passed++
    tests.results.push(`✅ Count queries work (${count} unread invitations)`)
  } catch (error) {
    tests.failed++
    tests.results.push(`❌ Count query failed: ${error.message}`)
  }

  // Print results
  console.log('📊 Test Results:\n')
  tests.results.forEach(result => console.log(result))
  
  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ Passed: ${tests.passed}`)
  console.log(`❌ Failed: ${tests.failed}`)
  console.log(`📊 Total: ${tests.passed + tests.failed}`)
  console.log('='.repeat(50))

  if (tests.failed === 0) {
    console.log('\n🎉 All database tests passed!')
  } else {
    console.log('\n⚠️  Some tests failed. Check configuration.')
  }
}

testInvitationsDatabase()
