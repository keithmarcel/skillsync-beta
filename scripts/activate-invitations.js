/**
 * Update invitations from pending to sent status
 * This makes them visible in the notification dropdown
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function activateInvitations() {
  console.log('🔔 Activating invitations...\n')

  try {
    // Update all pending invitations to sent
    const { data, error } = await supabase
      .from('employer_invitations')
      .update({
        status: 'sent',
        invited_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(), // Random within last 5 days
        is_read: false
      })
      .eq('status', 'pending')
      .select()

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log(`✅ Updated ${data.length} invitations to "sent" status`)
    console.log(`📧 All invitations are now active and unread\n`)

    // Show summary
    const { count: unreadCount } = await supabase
      .from('employer_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .eq('status', 'sent')

    console.log(`📊 Summary:`)
    console.log(`   🔔 Unread invitations: ${unreadCount}`)
    console.log(`   ✅ Ready to test notification dropdown!`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

activateInvitations()
