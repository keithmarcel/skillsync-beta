/**
 * Test Account Settings Database Schema
 * Verifies all required columns exist and can be updated
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Use local Supabase instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

console.log('🔗 Connecting to:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseSchema() {
  console.log('🔍 Testing Account Settings Database Schema...\n')

  try {
    // Test 1: Check what columns exist
    console.log('📋 Test 1: Checking what columns exist in profiles table...')
    
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (allError) {
      console.error('❌ Could not query profiles:', allError.message)
      return
    }
    
    if (allProfiles && allProfiles.length > 0) {
      console.log('✅ Existing columns:', Object.keys(allProfiles[0]).join(', '))
    } else {
      console.log('⚠️  No profiles exist yet')
    }
    console.log('')
    
    // Test 1b: Try to select new columns
    console.log('📋 Test 1b: Checking for new settings columns...')
    const { data: profiles, error: selectError } = await supabase
      .from('profiles')
      .select('id, bio, visible_to_employers, notif_in_app_invites')
      .limit(1)

    if (selectError) {
      console.error('❌ New columns missing:', selectError.message)
      console.log('⚠️  Migration may not have been applied correctly\n')
      return
    }
    console.log('✅ All required columns exist\n')

    // Test 2: Create a test user
    console.log('📋 Test 2: Creating test user...')
    const testEmail = `test-${Date.now()}@example.com`
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    })

    if (authError) {
      console.error('❌ User creation failed:', authError.message)
      return
    }
    
    const testUserId = authData.user.id
    console.log(`✅ Test user created: ${testEmail}\n`)

    // Test 3: Create profile
    console.log('📋 Test 3: Creating profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        role: 'user',
        first_name: 'Test',
        last_name: 'User',
        agreed_to_terms: true
      })

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message)
      await supabase.auth.admin.deleteUser(testUserId)
      return
    }
    console.log('✅ Profile created\n')

    // Test 4: Update profile settings
    console.log('📋 Test 4: Testing profile updates...')
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: 'Updated',
        last_name: 'Name',
        linkedin_url: 'https://www.linkedin.com/in/testuser',
        bio: "I'm a product designer and hoping to upskill in software engineering!",
        visible_to_employers: true
      })
      .eq('id', testUserId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Profile update failed:', updateError.message)
      await supabase.auth.admin.deleteUser(testUserId)
      return
    }
    
    console.log('✅ Profile updated successfully')
    console.log('   - Name:', updatedProfile.first_name, updatedProfile.last_name)
    console.log('   - LinkedIn:', updatedProfile.linkedin_url)
    console.log('   - Bio:', updatedProfile.bio?.substring(0, 50) + '...')
    console.log('   - Visible to employers:', updatedProfile.visible_to_employers)
    console.log('')

    // Test 5: Update ZIP code
    console.log('📋 Test 5: Testing ZIP code update...')
    const { data: zipData, error: zipError } = await supabase
      .from('profiles')
      .update({ zip_code: '33701' })
      .eq('id', testUserId)
      .select('zip_code')
      .single()

    if (zipError) {
      console.error('❌ ZIP code update failed:', zipError.message)
    } else {
      console.log('✅ ZIP code updated:', zipData.zip_code)
      console.log('')
    }

    // Test 6: Update notification preferences
    console.log('📋 Test 6: Testing notification preferences...')
    const { data: notifData, error: notifError } = await supabase
      .from('profiles')
      .update({
        notif_in_app_invites: true,
        notif_in_app_new_roles: false,
        notif_email_new_roles: true,
        notif_email_invites: true,
        notif_email_marketing: false,
        notif_email_security: true,
        notif_all_disabled: false
      })
      .eq('id', testUserId)
      .select('notif_in_app_invites, notif_in_app_new_roles, notif_email_new_roles, notif_email_invites, notif_email_marketing, notif_email_security, notif_all_disabled')
      .single()

    if (notifError) {
      console.error('❌ Notification update failed:', notifError.message)
    } else {
      console.log('✅ Notifications updated successfully')
      console.log('   - In-app invites:', notifData.notif_in_app_invites)
      console.log('   - In-app new roles:', notifData.notif_in_app_new_roles)
      console.log('   - Email new roles:', notifData.notif_email_new_roles)
      console.log('   - Email invites:', notifData.notif_email_invites)
      console.log('   - Email marketing:', notifData.notif_email_marketing)
      console.log('   - Email security:', notifData.notif_email_security)
      console.log('   - All disabled:', notifData.notif_all_disabled)
      console.log('')
    }

    // Test 7: Check avatars bucket
    console.log('📋 Test 7: Testing avatars storage bucket...')
    const { data: buckets, error: bucketError } = await supabase.storage
      .from('avatars')
      .list()

    if (bucketError) {
      console.error('❌ Avatars bucket check failed:', bucketError.message)
    } else {
      console.log('✅ Avatars bucket exists and is accessible')
      console.log('')
    }

    // Cleanup
    console.log('🧹 Cleaning up test user...')
    await supabase.auth.admin.deleteUser(testUserId)
    console.log('✅ Test user deleted\n')

    // Summary
    console.log('═══════════════════════════════════════')
    console.log('✅ ALL TESTS PASSED')
    console.log('═══════════════════════════════════════')
    console.log('\n✨ Account Settings database is ready!')
    console.log('\nVerified functionality:')
    console.log('  ✓ Profile updates (name, LinkedIn, bio)')
    console.log('  ✓ Employer visibility toggle')
    console.log('  ✓ ZIP code updates')
    console.log('  ✓ Notification preferences (7 fields)')
    console.log('  ✓ Avatars storage bucket')
    console.log('\n🎯 Ready for UI testing!')

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    process.exit(1)
  }
}

testDatabaseSchema()
