/**
 * Check Keith's invitations
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkKeithInvitations() {
  console.log('🔍 Checking Keith\'s invitations...\n')

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'keith-woods@bisk.com')
      .single()

    if (!profile) {
      console.log('❌ User not found')
      return
    }

    const { data: invitations, error } = await supabase
      .from('employer_invitations')
      .select(`
        id,
        status,
        is_read,
        invited_at,
        proficiency_pct,
        company:companies(name),
        job:jobs(title)
      `)
      .eq('user_id', profile.id)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log(`📊 Keith has ${invitations.length} invitation(s):\n`)

    invitations.forEach((inv, i) => {
      console.log(`${i + 1}. ${inv.company?.name || 'Unknown'} - ${inv.job?.title || 'Unknown'}`)
      console.log(`   Status: ${inv.status}`)
      console.log(`   Read: ${inv.is_read ? 'Yes' : 'No'}`)
      console.log(`   Proficiency: ${inv.proficiency_pct}%`)
      console.log(`   Invited: ${inv.invited_at || 'Not set'}`)
      console.log('')
    })

    // Update them to sent if needed
    const needsUpdate = invitations.filter(inv => inv.status !== 'sent' || inv.is_read)

    if (needsUpdate.length > 0) {
      console.log(`⚠️  ${needsUpdate.length} invitation(s) need to be updated to "sent" and unread`)
      console.log('   Updating now...\n')

      const { error: updateError } = await supabase
        .from('employer_invitations')
        .update({
          status: 'sent',
          is_read: false,
          invited_at: new Date().toISOString()
        })
        .eq('user_id', profile.id)

      if (updateError) {
        console.error('❌ Update error:', updateError)
      } else {
        console.log('✅ Updated all invitations to "sent" and unread')
      }
    } else {
      console.log('✅ All invitations are already in "sent" status and unread')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkKeithInvitations()
