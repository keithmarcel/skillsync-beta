/**
 * Seed test data for invitations system
 * Creates mock users, assessments, employer, and invitations
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Get existing companies and jobs from database
async function getExistingData() {
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, logo_url')
    .limit(5)

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, soc_code, company_id')
    .not('company_id', 'is', null)
    .limit(10)

  return { companies, jobs }
}

async function seedInvitationData() {
  console.log('🌱 Seeding invitation test data...\n')

  try {
    const { companies, jobs } = await getExistingData()

    if (!companies?.length || !jobs?.length) {
      console.log('❌ No companies or jobs found. Please seed companies and jobs first.')
      return
    }

    console.log(`✅ Found ${companies.length} companies and ${jobs.length} jobs\n`)

    // 1. Create mock candidates (users with completed assessments)
    const mockCandidates = [
      {
        email: 'candidate1@test.com',
        first_name: 'Jane',
        last_name: 'Smith',
        linkedin_url: 'https://linkedin.com/in/janesmith',
        visible_to_employers: true,
        avatar_url: '/assets/Avatar-1.png',
        role: 'user'
      },
      {
        email: 'candidate2@test.com',
        first_name: 'Michael',
        last_name: 'Johnson',
        linkedin_url: 'https://linkedin.com/in/michaeljohnson',
        visible_to_employers: true,
        avatar_url: '/assets/Avatar-2.png',
        role: 'user'
      },
      {
        email: 'candidate3@test.com',
        first_name: 'Sarah',
        last_name: 'Williams',
        linkedin_url: 'https://linkedin.com/in/sarahwilliams',
        visible_to_employers: true,
        avatar_url: '/assets/Avatar-3.png',
        role: 'user'
      },
      {
        email: 'candidate4@test.com',
        first_name: 'David',
        last_name: 'Brown',
        linkedin_url: 'https://linkedin.com/in/davidbrown',
        visible_to_employers: true,
        avatar_url: '/assets/Avatar-4.png',
        role: 'user'
      },
      {
        email: 'candidate5@test.com',
        first_name: 'Emily',
        last_name: 'Davis',
        linkedin_url: 'https://linkedin.com/in/emilydavis',
        visible_to_employers: true,
        avatar_url: '/assets/Avatar-5.png',
        role: 'user'
      }
    ]

    console.log('👥 Getting or creating mock candidates...')
    
    const createdUsers = []
    for (const candidate of mockCandidates) {
      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('email', candidate.email)
        .single()

      if (existingProfile) {
        createdUsers.push({ ...candidate, id: existingProfile.id })
        console.log(`✅ Found existing: ${existingProfile.first_name} ${existingProfile.last_name}`)
        continue
      }

      // Create new auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: candidate.email,
        password: 'TestPassword123!',
        email_confirm: true
      })

      if (authError) {
        console.log(`⚠️  Error creating ${candidate.email}:`, authError.message)
        continue
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: candidate.email,
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          linkedin_url: candidate.linkedin_url,
          visible_to_employers: candidate.visible_to_employers,
          avatar_url: candidate.avatar_url,
          role: candidate.role
        })

      if (profileError) {
        console.error(`❌ Error creating profile for ${candidate.email}:`, profileError.message)
        continue
      }

      createdUsers.push({ ...candidate, id: authData.user.id })
      console.log(`✅ Created: ${candidate.first_name} ${candidate.last_name}`)
    }

    console.log(`\n✅ Have ${createdUsers.length} mock candidates\n`)

    // 2. Create mock assessments for each candidate
    console.log('📝 Creating mock assessments...')
    
    const assessments = []
    for (const user of createdUsers) {
      // Create 2-3 assessments per user with different proficiency scores
      const scores = [99, 98, 95, 91, 87] // Mix of Ready and Building Skills
      const numAssessments = Math.floor(Math.random() * 2) + 2 // 2-3 assessments

      for (let i = 0; i < numAssessments && i < jobs.length; i++) {
        const job = jobs[i]
        const score = scores[i % scores.length]

        const { data: assessment, error } = await supabase
          .from('assessments')
          .insert({
            user_id: user.id,
            job_id: job.id,
            method: 'quiz',
            readiness_pct: score,
            status_tag: score >= 90 ? 'role_ready' : 'close_gaps',
            analyzed_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random within last 7 days
          })
          .select()
          .single()

        if (!error && assessment) {
          assessments.push({ ...assessment, user, job })
          console.log(`✅ Assessment: ${user.first_name} - ${job.title} (${score}%)`)
        }
      }
    }

    console.log(`\n✅ Created ${assessments.length} mock assessments\n`)

    // 3. Create mock invitations
    console.log('📧 Creating mock invitations...')
    
    let invitationCount = 0
    for (const assessment of assessments) {
      // Get the job with company_id
      const { data: jobData } = await supabase
        .from('jobs')
        .select('id, title, company_id')
        .eq('id', assessment.job_id)
        .single()

      if (!jobData || !jobData.company_id) {
        console.log(`⚠️  Job ${assessment.job_id} has no company, skipping...`)
        continue
      }

      const company = companies.find(c => c.id === jobData.company_id)
      if (!company) {
        console.log(`⚠️  Company not found for job ${jobData.title}, skipping...`)
        continue
      }

      const statuses = ['sent', 'sent', 'sent', 'applied', 'declined'] // Most are pending
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      const { error } = await supabase
        .from('employer_invitations')
        .insert({
          user_id: assessment.user_id,
          company_id: company.id,
          job_id: assessment.job_id,
          assessment_id: assessment.id,
          proficiency_pct: assessment.readiness_pct,
          application_url: `https://careers.${company.name.toLowerCase().replace(/\s+/g, '')}.com/apply`,
          message: `We were impressed by your ${assessment.readiness_pct}% proficiency score and would love to have you apply for our ${jobData.title} position.`,
          status,
          is_read: status !== 'sent', // Unread if pending
          invited_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
          viewed_at: status !== 'sent' ? new Date().toISOString() : null,
          responded_at: ['applied', 'declined'].includes(status) ? new Date().toISOString() : null
        })

      if (!error) {
        invitationCount++
        console.log(`✅ Invitation: ${company.name} → ${assessment.user.first_name || 'User'} (${status})`)
      } else {
        console.error(`❌ Error creating invitation:`, error.message)
      }
    }

    console.log(`\n✅ Created ${invitationCount} mock invitations\n`)

    // 4. Create mock employer admin
    console.log('👔 Creating mock employer admin...')
    
    const employerCompany = companies[0]
    const { data: employerAuth, error: employerAuthError } = await supabase.auth.admin.createUser({
      email: 'employer@powerdesign.com',
      password: 'TestPassword123!',
      email_confirm: true
    })

    if (!employerAuthError && employerAuth) {
      await supabase
        .from('profiles')
        .upsert({
          id: employerAuth.user.id,
          email: 'employer@powerdesign.com',
          first_name: 'John',
          last_name: 'Employer',
          role: 'employer_admin',
          company_id: employerCompany.id
        })

      console.log(`✅ Created employer admin: John Employer (${employerCompany.name})`)
    } else {
      console.log('⚠️  Employer admin might already exist')
    }

    // 5. Create mock provider admin
    console.log('\n🎓 Creating mock provider admin...')
    
    const { data: schools } = await supabase
      .from('schools')
      .select('id, name')
      .limit(1)
      .single()

    if (schools) {
      const { data: providerAuth, error: providerAuthError } = await supabase.auth.admin.createUser({
        email: 'provider@school.edu',
        password: 'TestPassword123!',
        email_confirm: true
      })

      if (!providerAuthError && providerAuth) {
        await supabase
          .from('profiles')
          .upsert({
            id: providerAuth.user.id,
            email: 'provider@school.edu',
            first_name: 'Sarah',
            last_name: 'Provider',
            role: 'provider_admin',
            organization_id: schools.id
          })

        console.log(`✅ Created provider admin: Sarah Provider (${schools.name})`)
      } else {
        console.log('⚠️  Provider admin might already exist')
      }
    }

    console.log('\n🎉 Seed data creation complete!\n')
    console.log('📊 Summary:')
    console.log(`   - ${createdUsers.length} mock candidates`)
    console.log(`   - ${assessments.length} mock assessments`)
    console.log(`   - ${invitationCount} mock invitations`)
    console.log(`   - 1 employer admin`)
    console.log(`   - 1 provider admin`)
    console.log('\n✅ Ready to test invitations UI!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

seedInvitationData()
