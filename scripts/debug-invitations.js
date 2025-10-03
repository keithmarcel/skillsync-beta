/**
 * Debug invitations - check what's in the database
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugInvitations() {
  console.log('🔍 Debugging invitations...\n')

  try {
    // 1. Check all invitations
    const { data: allInvitations, error: allError } = await supabase
      .from('employer_invitations')
      .select('id, user_id, status, is_read, invited_at')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ Error fetching invitations:', allError)
      return
    }

    console.log(`📊 Total invitations in database: ${allInvitations.length}\n`)

    // 2. Group by status
    const byStatus = {}
    allInvitations.forEach(inv => {
      byStatus[inv.status] = (byStatus[inv.status] || 0) + 1
    })

    console.log('📈 Invitations by status:')
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })
    console.log('')

    // 3. Check unread sent invitations
    const { data: unreadSent, error: unreadError } = await supabase
      .from('employer_invitations')
      .select('id, user_id, status, is_read')
      .eq('status', 'sent')
      .eq('is_read', false)

    console.log(`🔔 Unread "sent" invitations: ${unreadSent?.length || 0}\n`)

    // 4. Get unique user IDs
    const userIds = [...new Set(allInvitations.map(inv => inv.user_id))]
    console.log(`👥 Invitations assigned to ${userIds.length} user(s):\n`)

    for (const userId of userIds) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single()

      const userInvitations = allInvitations.filter(inv => inv.user_id === userId)
      const unread = userInvitations.filter(inv => inv.status === 'sent' && !inv.is_read).length

      console.log(`   User: ${profile?.email || userId}`)
      console.log(`   Name: ${profile?.first_name || 'Unknown'} ${profile?.last_name || ''}`)
      console.log(`   Total invitations: ${userInvitations.length}`)
      console.log(`   Unread: ${unread}`)
      console.log('')
    }

    // 5. Check current logged-in user (from your session)
    console.log('💡 To test, log in as one of these users:')
    console.log('   Email: candidate1@test.com')
    console.log('   Password: TestPassword123!')
    console.log('')
    console.log('   Or check which user you\'re currently logged in as')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugInvitations()
