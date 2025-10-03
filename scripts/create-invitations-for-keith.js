/**
 * Create invitations for keith-woods@bisk.com
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createInvitationsForKeith() {
  console.log('📧 Creating invitations for keith-woods@bisk.com...\n')

  try {
    // 1. Get Keith's user ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('email', 'keith-woods@bisk.com')
      .single()

    if (profileError || !profile) {
      console.error('❌ Could not find user keith-woods@bisk.com')
      return
    }

    console.log(`✅ Found user: ${profile.first_name} ${profile.last_name} (${profile.email})`)
    console.log(`   User ID: ${profile.id}\n`)

    // 2. Get some jobs to create invitations for
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, soc_code, company_id')
      .not('company_id', 'is', null)
      .limit(5)

    if (jobsError || !jobs || jobs.length === 0) {
      console.error('❌ No jobs found with companies')
      return
    }

    console.log(`✅ Found ${jobs.length} jobs to create invitations for\n`)

    // 3. Create mock assessments for Keith
    const assessments = []
    const proficiencyScores = [99, 96, 93, 91, 88] // Mix of scores

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      const score = proficiencyScores[i]

      // Check if assessment already exists
      const { data: existingAssessment } = await supabase
        .from('assessments')
        .select('id')
        .eq('user_id', profile.id)
        .eq('job_id', job.id)
        .single()

      if (existingAssessment) {
        assessments.push(existingAssessment)
        console.log(`⚠️  Assessment already exists for ${job.title}`)
        continue
      }

      // Create assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          user_id: profile.id,
          job_id: job.id,
          method: 'quiz',
          readiness_pct: score,
          status_tag: score >= 90 ? 'role_ready' : 'close_gaps',
          analyzed_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

      if (assessmentError) {
        console.error(`❌ Error creating assessment for ${job.title}:`, assessmentError.message)
        continue
      }

      assessments.push(assessment)
      console.log(`✅ Created assessment: ${job.title} (${score}%)`)
    }

    console.log(`\n✅ Created ${assessments.length} assessments\n`)

    // 4. Create invitations
    let invitationCount = 0

    for (let i = 0; i < assessments.length; i++) {
      const assessment = assessments[i]
      const job = jobs[i]

      // Get company info
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .eq('id', job.company_id)
        .single()

      if (!company) {
        console.log(`⚠️  No company found for job ${job.title}`)
        continue
      }

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from('employer_invitations')
        .select('id')
        .eq('user_id', profile.id)
        .eq('job_id', job.id)
        .single()

      if (existingInvitation) {
        console.log(`⚠️  Invitation already exists for ${job.title}`)
        continue
      }

      // Create invitation
      const { error: invitationError } = await supabase
        .from('employer_invitations')
        .insert({
          user_id: profile.id,
          company_id: company.id,
          job_id: job.id,
          assessment_id: assessment.id,
          proficiency_pct: assessment.readiness_pct,
          application_url: `https://careers.${company.name.toLowerCase().replace(/\s+/g, '')}.com/apply`,
          message: `We were impressed by your ${assessment.readiness_pct}% proficiency score and would love to have you apply for our ${job.title} position.`,
          status: 'sent',
          is_read: false,
          invited_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
        })

      if (invitationError) {
        console.error(`❌ Error creating invitation:`, invitationError.message)
        continue
      }

      invitationCount++
      console.log(`✅ Invitation: ${company.name} → ${job.title}`)
    }

    console.log(`\n🎉 Created ${invitationCount} invitations for Keith!`)
    console.log(`\n🔔 Refresh your page to see the notification badge!`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createInvitationsForKeith()
