/**
 * View all feedback submissions
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function viewFeedback() {
  console.log('📋 Viewing all feedback submissions...\n')

  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    if (data.length === 0) {
      console.log('No feedback found.')
      return
    }

    console.log(`Found ${data.length} feedback submission(s):\n`)
    
    data.forEach((feedback, index) => {
      console.log(`${index + 1}. Feedback ID: ${feedback.id}`)
      console.log(`   User: ${feedback.user_email}`)
      console.log(`   Sentiment: ${feedback.sentiment}`)
      console.log(`   Message: ${feedback.message || '(no message)'}`)
      console.log(`   Submitted: ${new Date(feedback.created_at).toLocaleString()}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

viewFeedback()
