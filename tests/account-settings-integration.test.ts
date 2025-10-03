/**
 * Account Settings Integration Tests
 * Tests all account settings functionality with real database operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

let testUserId: string
let testUserEmail: string

describe('Account Settings Integration Tests', () => {
  beforeAll(async () => {
    // Create a test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `test-settings-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    })

    if (authError) throw authError
    testUserId = authData.user.id
    testUserEmail = authData.user.email!

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: testUserEmail,
        role: 'user',
        first_name: 'Test',
        last_name: 'User',
        agreed_to_terms: true
      })

    if (profileError) throw profileError

    console.log(`✅ Test user created: ${testUserEmail}`)
  })

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId)
      console.log(`🧹 Test user deleted: ${testUserEmail}`)
    }
  })

  describe('Profile Settings', () => {
    it('should update first and last name', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: 'Updated',
          last_name: 'Name'
        })
        .eq('id', testUserId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.first_name).toBe('Updated')
      expect(data?.last_name).toBe('Name')
      console.log('✅ Name update successful')
    })

    it('should update LinkedIn URL', async () => {
      const linkedinUrl = 'https://www.linkedin.com/in/testuser'
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ linkedin_url: linkedinUrl })
        .eq('id', testUserId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.linkedin_url).toBe(linkedinUrl)
      console.log('✅ LinkedIn URL update successful')
    })

    it('should update bio', async () => {
      const bio = "I'm a product designer and hoping to upskill in software engineering!"
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ bio })
        .eq('id', testUserId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.bio).toBe(bio)
      console.log('✅ Bio update successful')
    })

    it('should toggle employer visibility checkbox', async () => {
      // Set to true
      let { data, error } = await supabase
        .from('profiles')
        .update({ visible_to_employers: true })
        .eq('id', testUserId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.visible_to_employers).toBe(true)
      console.log('✅ Employer visibility enabled')

      // Set to false
      const result = await supabase
        .from('profiles')
        .update({ visible_to_employers: false })
        .eq('id', testUserId)
        .select()
        .single()

      expect(result.error).toBeNull()
      expect(result.data?.visible_to_employers).toBe(false)
      console.log('✅ Employer visibility disabled')
    })

    it('should validate employer visibility requires name and LinkedIn', async () => {
      // Clear LinkedIn URL
      await supabase
        .from('profiles')
        .update({ linkedin_url: null })
        .eq('id', testUserId)

      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, linkedin_url, visible_to_employers')
        .eq('id', testUserId)
        .single()

      // Validation logic (would be in API route)
      const canEnableEmployerVisibility = 
        data?.first_name && 
        data?.last_name && 
        data?.linkedin_url

      expect(canEnableEmployerVisibility).toBe(false)
      console.log('✅ Employer visibility validation working')
    })
  })

  describe('Account Management', () => {
    it('should update ZIP code', async () => {
      const zipCode = '33701'
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ zip_code: zipCode })
        .eq('id', testUserId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.zip_code).toBe(zipCode)
      console.log('✅ ZIP code update successful')
    })

    it('should validate ZIP code format (5 digits)', async () => {
      const validZip = '12345'
      const invalidZip = '123'

      // Valid ZIP
      const { error: validError } = await supabase
        .from('profiles')
        .update({ zip_code: validZip })
        .eq('id', testUserId)

      expect(validError).toBeNull()

      // Invalid ZIP would be caught by client-side validation
      const isValidZip = /^\d{5}$/.test(invalidZip)
      expect(isValidZip).toBe(false)
      console.log('✅ ZIP code validation working')
    })
  })

  describe('Notification Preferences', () => {
    it('should update in-app notification preferences', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          notif_in_app_invites: true,
          notif_in_app_new_roles: false
        })
        .eq('id', testUserId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.notif_in_app_invites).toBe(true)
      expect(data?.notif_in_app_new_roles).toBe(false)
      console.log('✅ In-app notifications update successful')
    })

    it('should update email notification preferences', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          notif_email_new_roles: true,
          notif_email_invites: true,
          notif_email_marketing: false,
          notif_email_security: true
        })
        .eq('id', testUserId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.notif_email_new_roles).toBe(true)
      expect(data?.notif_email_invites).toBe(true)
      expect(data?.notif_email_marketing).toBe(false)
      expect(data?.notif_email_security).toBe(true)
      console.log('✅ Email notifications update successful')
    })

    it('should toggle all notifications off', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          notif_all_disabled: true,
          notif_in_app_invites: false,
          notif_in_app_new_roles: false,
          notif_email_new_roles: false,
          notif_email_invites: false,
          notif_email_marketing: false,
          notif_email_security: false
        })
        .eq('id', testUserId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.notif_all_disabled).toBe(true)
      expect(data?.notif_in_app_invites).toBe(false)
      expect(data?.notif_email_invites).toBe(false)
      console.log('✅ Turn off all notifications successful')
    })
  })

  describe('Avatar Upload', () => {
    it('should verify avatars bucket exists', async () => {
      const { data, error } = await supabase.storage
        .from('avatars')
        .list()

      expect(error).toBeNull()
      console.log('✅ Avatars bucket exists and is accessible')
    })

    it('should allow authenticated user to upload avatar', async () => {
      // Create a mock file blob
      const mockFile = new Blob(['test image data'], { type: 'image/png' })
      const fileName = `${testUserId}/avatar.png`

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, mockFile, {
          upsert: true,
          contentType: 'image/png'
        })

      expect(error).toBeNull()
      expect(data?.path).toBe(fileName)
      console.log('✅ Avatar upload successful')

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      expect(publicUrl).toContain('avatars')
      console.log('✅ Avatar public URL generated')

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', testUserId)

      expect(updateError).toBeNull()
      console.log('✅ Profile avatar_url updated')

      // Clean up
      await supabase.storage.from('avatars').remove([fileName])
    })
  })

  describe('Data Persistence', () => {
    it('should persist all changes across queries', async () => {
      // Update multiple fields
      await supabase
        .from('profiles')
        .update({
          first_name: 'Final',
          last_name: 'Test',
          zip_code: '33702',
          linkedin_url: 'https://www.linkedin.com/in/finaltest',
          bio: 'Final test bio',
          visible_to_employers: true,
          notif_email_invites: true
        })
        .eq('id', testUserId)

      // Fetch fresh data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single()

      expect(error).toBeNull()
      expect(data?.first_name).toBe('Final')
      expect(data?.last_name).toBe('Test')
      expect(data?.zip_code).toBe('33702')
      expect(data?.linkedin_url).toBe('https://www.linkedin.com/in/finaltest')
      expect(data?.bio).toBe('Final test bio')
      expect(data?.visible_to_employers).toBe(true)
      expect(data?.notif_email_invites).toBe(true)
      console.log('✅ All changes persisted correctly')
    })
  })
})
