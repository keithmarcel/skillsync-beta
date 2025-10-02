/**
 * Generate Mock Users for SkillSync
 * 
 * Creates realistic test users without sending auth emails:
 * - 1 Employer Admin (Power Design)
 * - 1 Provider Admin (Pinellas Technical College)
 * - 9 Regular Users (job seekers with varied assessment scores)
 * 
 * Usage: node scripts/generate-mock-users.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key bypasses RLS
)

// Mock user data with names and avatar URLs
const mockUsers = [
  // Employer Admin
  {
    email: 'employer@powerdesign.com',
    password: 'Password123!',
    role: 'employer_admin',
    first_name: 'Sarah',
    last_name: 'Mitchell',
    company_name: 'Power Design',
    avatar_url: '/avatars/sarah-mitchell.jpg',
    zip_code: '33701'
  },
  
  // Provider Admin
  {
    email: 'provider@ptec.edu',
    password: 'Password123!',
    role: 'provider_admin',
    first_name: 'Dr. James',
    last_name: 'Rodriguez',
    school_name: 'Pinellas Technical College',
    avatar_url: '/avatars/james-rodriguez.jpg',
    zip_code: '33702'
  },
  
  // Regular Users (Job Seekers)
  {
    email: 'naomi.blake@example.com',
    password: 'Password123!',
    role: 'user',
    first_name: 'Naomi',
    last_name: 'Blake',
    avatar_url: '/avatars/naomi-blake.jpg',
    zip_code: '33703',
    assessment_score: 99 // Top performer
  },
  {
    email: 'elias.thorne@example.com',
    password: 'Password123!',
    role: 'user',
    first_name: 'Elias',
    last_name: 'Thorne',
    avatar_url: '/avatars/elias-thorne.jpg',
    zip_code: '33704',
    assessment_score: 98
  },
  {
    email: 'emanuel.mughaele@example.com',
    password: 'Password123!',
    role: 'user',
    first_name: 'Emanuel',
    last_name: 'Mughaele',
    avatar_url: '/avatars/emanuel-mughaele.jpg',
    zip_code: '33705',
    assessment_score: 95
  },
  {
    email: 'aaliyah.ramirez@example.com',
    password: 'Password123!',
    role: 'user',
    first_name: 'Aaliyah',
    last_name: 'Ramirez',
    avatar_url: '/avatars/aaliyah-ramirez.jpg',
    zip_code: '33706',
    assessment_score: 91
  },
  {
    email: 'fatima.nguyen@example.com',
    password: 'Password123!',
    role: 'user',
    first_name: 'Fatima',
    last_name: 'Nguyen',
    avatar_url: '/avatars/fatima-nguyen.jpg',
    zip_code: '33707',
    assessment_score: 87
  },
  {
    email: 'amelia.dubois@example.com',
    password: 'Password123!',
    role: 'user',
    first_name: 'Amelia',
    last_name: 'Dubois',
    avatar_url: '/avatars/amelia-dubois.jpg',
    zip_code: '33708',
    assessment_score: 82
  },
  {
    email: 'jamison.quinoa@example.com',
    password: 'Password123!',
    role: 'user',
    first_name: 'Jamison',
    last_name: 'Quinoa',
    avatar_url: '/avatars/jamison-quinoa.jpg',
    zip_code: '33709',
    assessment_score: 80
  },
  {
    email: 'catalina.mercau@example.com',
    password: 'Password123!',
    role: 'user',
    first_name: 'Catalina',
    last_name: 'Mercau',
    avatar_url: '/avatars/catalina-mercau.jpg',
    zip_code: '33710',
    assessment_score: 80
  },
  {
    email: 'alfred.millstone@example.com',
    password: 'Password123!',
    role: 'user',
    first_name: 'Alfred',
    last_name: 'Millstone',
    avatar_url: '/avatars/alfred-millstone.jpg',
    zip_code: '33711',
    assessment_score: 80
  }
]

async function generateMockUsers() {
  console.log('🚀 Starting mock user generation...\n')

  // Get company and school IDs
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('name', 'Power Design')
    .single()

  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .eq('name', 'Pinellas Technical College')
    .single()

  if (!companies) {
    console.error('❌ Power Design company not found. Please create it first.')
    return
  }

  if (!schools) {
    console.error('❌ Pinellas Technical College school not found. Please create it first.')
    return
  }

  console.log(`✅ Found Power Design (${companies.id})`)
  console.log(`✅ Found Pinellas Technical College (${schools.id})\n`)

  for (const user of mockUsers) {
    try {
      console.log(`Creating ${user.first_name} ${user.last_name} (${user.role})...`)

      // Create auth user (bypasses email verification with service role key)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name
        }
      })

      if (authError) {
        console.error(`  ❌ Auth error: ${authError.message}`)
        continue
      }

      // Create profile
      const profileData = {
        id: authData.user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        zip_code: user.zip_code,
        is_mock_user: true,
        agreed_to_terms: true,
        company_id: user.role === 'employer_admin' ? companies.id : null,
        school_id: user.role === 'provider_admin' ? schools.id : null,
        max_featured_roles: user.role === 'employer_admin' ? 10 : null,
        max_programs: user.role === 'provider_admin' ? 300 : null,
        max_featured_programs: user.role === 'provider_admin' ? 50 : null
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)

      if (profileError) {
        console.error(`  ❌ Profile error: ${profileError.message}`)
        continue
      }

      console.log(`  ✅ Created successfully`)

      // For regular users, create mock assessment if score provided
      if (user.role === 'user' && user.assessment_score) {
        // Get a featured role to assess against
        const { data: job } = await supabase
          .from('jobs')
          .select('id')
          .eq('job_kind', 'featured_role')
          .eq('company_id', companies.id)
          .limit(1)
          .single()

        if (job) {
          const { error: assessmentError } = await supabase
            .from('assessments')
            .insert({
              user_id: authData.user.id,
              job_id: job.id,
              method: 'quiz',
              readiness_pct: user.assessment_score,
              status_tag: user.assessment_score >= 90 ? 'role_ready' : 
                         user.assessment_score >= 75 ? 'close_gaps' : 'needs_development'
            })

          if (!assessmentError) {
            console.log(`  ✅ Created assessment (${user.assessment_score}%)`)
          }
        }
      }

    } catch (error) {
      console.error(`  ❌ Unexpected error: ${error.message}`)
    }
  }

  console.log('\n✅ Mock user generation complete!')
  console.log('\n📋 Login Credentials:')
  console.log('  Employer Admin: employer@powerdesign.com / Password123!')
  console.log('  Provider Admin: provider@ptec.edu / Password123!')
  console.log('  All Users: [email] / Password123!')
  
  process.exit(0)
}

// Run the script
generateMockUsers().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
