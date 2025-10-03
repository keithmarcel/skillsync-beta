/**
 * Check if avatar was uploaded successfully
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAvatar() {
  console.log('🔍 Checking avatar upload status...\n')

  try {
    // Get current user's profile
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (error) throw error

    console.log('📋 Recent profiles:\n')
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.email}`)
      console.log(`   Name: ${profile.first_name} ${profile.last_name}`)
      console.log(`   Avatar: ${profile.avatar_url || 'No avatar'}`)
      console.log(`   Updated: ${profile.updated_at}`)
      console.log('')
    })

    // Check avatars bucket
    console.log('\n📦 Checking avatars bucket...')
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list()

    if (listError) {
      console.error('❌ Error listing files:', listError.message)
    } else {
      console.log(`✅ Found ${files.length} files in avatars bucket`)
      files.forEach(file => {
        console.log(`   - ${file.name}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkAvatar()
