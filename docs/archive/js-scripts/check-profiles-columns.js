const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProfilesColumns() {
  console.log('🔍 Checking profiles table columns...\n')
  
  try {
    // Try inserting with just ID to see what's required
    const testId = '00000000-0000-0000-0000-000000000000'
    
    const { error } = await supabase
      .from('profiles')
      .insert({ id: testId })
    
    if (error) {
      console.log('Insert error details:', error)
    }
    
    // Try to get existing data to see column structure
    const { data: existingProfiles, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.log('Select error:', selectError.message)
    } else {
      console.log('Existing profiles count:', existingProfiles.length)
      if (existingProfiles.length > 0) {
        console.log('Profile columns:', Object.keys(existingProfiles[0]))
        console.log('Sample profile:', existingProfiles[0])
      } else {
        console.log('No existing profiles found')
      }
    }
    
    // Try minimal insert with just required fields
    console.log('\n🔧 Attempting minimal profile creation...')
    const authUserId = '72b464ef-1814-4942-b69e-2bdffd390e61' // Keith's actual auth ID
    
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: authUserId })
      .select()
    
    if (insertError) {
      console.log('❌ Minimal insert error:', insertError.message)
      console.log('Error details:', insertError.details)
      console.log('Error hint:', insertError.hint)
    } else {
      console.log('✅ Profile created successfully!')
      console.log('Created profile:', newProfile)
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
  
  process.exit(0)
}

checkProfilesColumns()
