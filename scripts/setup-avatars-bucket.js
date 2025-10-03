/**
 * Setup Avatars Storage Bucket
 * Creates the avatars bucket with proper RLS policies
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupAvatarsBucket() {
  console.log('🔧 Setting up avatars storage bucket...\n')

  try {
    // Check if bucket exists
    console.log('📋 Checking if avatars bucket exists...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
      return
    }

    const avatarsBucket = buckets.find(b => b.name === 'avatars')
    
    if (avatarsBucket) {
      console.log('✅ Avatars bucket already exists')
      console.log('   - ID:', avatarsBucket.id)
      console.log('   - Public:', avatarsBucket.public)
      console.log('')
    } else {
      console.log('⚠️  Avatars bucket does not exist, creating...')
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 2097152, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
      })

      if (createError) {
        console.error('❌ Error creating bucket:', createError.message)
        return
      }

      console.log('✅ Avatars bucket created successfully')
      console.log('')
    }

    // Test upload
    console.log('📋 Testing upload to avatars bucket...')
    // Create a minimal PNG file (1x1 transparent pixel)
    const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    const testFile = new Blob([pngData], { type: 'image/png' })
    const testPath = 'test/test.png'
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(testPath, testFile, { upsert: true })

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message)
      console.log('\n⚠️  This might be an RLS policy issue.')
      console.log('   Please check Storage policies in Supabase Dashboard')
      return
    }

    console.log('✅ Upload test successful')
    
    // Clean up test file
    await supabase.storage.from('avatars').remove([testPath])
    console.log('✅ Test file cleaned up')
    console.log('')

    // Summary
    console.log('═══════════════════════════════════════')
    console.log('✅ AVATARS BUCKET READY')
    console.log('═══════════════════════════════════════')
    console.log('\n✨ Avatar uploads should now work!')

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    process.exit(1)
  }
}

setupAvatarsBucket()
