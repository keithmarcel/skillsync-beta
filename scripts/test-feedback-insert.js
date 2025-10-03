/**
 * Test feedback insertion to debug the issue
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testFeedbackInsert() {
  console.log('🧪 Testing feedback insertion...\n')

  try {
    const testData = {
      sentiment: 'positive',
      message: 'Test feedback message',
      user_id: '72b464ef-1814-4942-b69e-2bdffd390e61', // Your user ID
      user_email: 'keith-woods@bisk.com'
    }

    console.log('📝 Inserting:', testData)

    const { data, error } = await supabase
      .from('feedback')
      .insert(testData)
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return
    }

    console.log('✅ Feedback inserted successfully!')
    console.log('Data:', data)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testFeedbackInsert()
