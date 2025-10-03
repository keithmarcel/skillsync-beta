/**
 * View all invitations in database
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function viewInvitations() {
  console.log('📋 Viewing all invitations...\n')

  try {
    const { data, error } = await supabase
      .from('employer_invitations')
      .select(`
        *,
        company:companies(name, logo_url),
        job:jobs(title)
      `)
      .order('created_at', { ascending: false })
    
    // Get user info separately
    for (const inv of data || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', inv.user_id)
        .single()
      
      inv.user = profile
    }

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    if (!data || data.length === 0) {
      console.log('No invitations found.')
      return
    }

    console.log(`Found ${data.length} invitation(s):\n`)
    
    data.forEach((inv, index) => {
      console.log(`${index + 1}. ${inv.company?.name || 'Unknown'} → ${inv.user?.first_name || 'Unknown'} ${inv.user?.last_name || ''}`)
      console.log(`   Role: ${inv.job?.title || 'Unknown'}`)
      console.log(`   Proficiency: ${inv.proficiency_pct}%`)
      console.log(`   Status: ${inv.status}`)
      console.log(`   Read: ${inv.is_read ? 'Yes' : 'No'}`)
      console.log(`   Invited: ${inv.invited_at ? new Date(inv.invited_at).toLocaleDateString() : 'Not sent'}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

viewInvitations()
