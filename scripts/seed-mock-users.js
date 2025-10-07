import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

dotenv.config({ path: '.env.local' })

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function seedMockUsers() {
  console.log('🌱 Seeding mock users into database...\n')
  
  // Get Power Design company ID
  const { data: powerDesign } = await supabase
    .from('companies')
    .select('id')
    .eq('name', 'Power Design')
    .single()
  
  const mockUsers = [
    {
      email: 'employer@powerdesign.com',
      password: 'TempPassword123!',
      first_name: 'John',
      last_name: 'Employer',
      role: 'partner_admin',
      admin_role: 'company_admin',
      company_id: powerDesign?.id || null,
      agreed_to_terms: true
    },
    {
      email: 'candidate5@test.com',
      password: 'TempPassword123!',
      first_name: 'Emily',
      last_name: 'Davis',
      role: 'basic_user',
      admin_role: null,
      company_id: null,
      agreed_to_terms: true
    },
    {
      email: 'candidate4@test.com',
      password: 'TempPassword123!',
      first_name: 'David',
      last_name: 'Brown',
      role: 'basic_user',
      admin_role: null,
      company_id: null,
      agreed_to_terms: true
    },
    {
      email: 'candidate3@test.com',
      password: 'TempPassword123!',
      first_name: 'Sarah',
      last_name: 'Williams',
      role: 'basic_user',
      admin_role: null,
      company_id: null,
      agreed_to_terms: true
    },
    {
      email: 'candidate2@test.com',
      password: 'TempPassword123!',
      first_name: 'Michael',
      last_name: 'Johnson',
      role: 'basic_user',
      admin_role: null,
      company_id: null,
      agreed_to_terms: true
    },
    {
      email: 'candidate1@test.com',
      password: 'TempPassword123!',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'basic_user',
      admin_role: null,
      company_id: null,
      agreed_to_terms: true
    },
    {
      email: 'keith-woods@bisk.com',
      password: 'TempPassword123!',
      first_name: 'Keith',
      last_name: 'Woods',
      role: 'super_admin',
      admin_role: 'super_admin',
      company_id: null,
      agreed_to_terms: true
    }
  ]
  
  console.log(`📝 Creating ${mockUsers.length} users...\n`)
  
  const createdUsers = []
  
  // Create each user in auth and profiles
  for (const userData of mockUsers) {
    console.log(`Creating ${userData.first_name} ${userData.last_name} (${userData.email})...`)
    
    // Try to get existing auth user first
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.find(u => u.email === userData.email)
    
    let userId
    
    if (existingUser) {
      console.log(`  ℹ️  Auth user already exists, using existing ID`)
      userId = existingUser.id
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name
        }
      })
      
      if (authError) {
        console.error(`  ❌ Auth error:`, authError.message)
        continue
      }
      
      userId = authData.user.id
      console.log(`  ✓ Auth user created`)
    }
    
    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        admin_role: userData.admin_role,
        company_id: userData.company_id,
        agreed_to_terms: userData.agreed_to_terms
      })
      .select()
      .single()
    
    if (profileError) {
      console.error(`  ❌ Profile error:`, profileError.message)
      continue
    }
    
    console.log(`  ✓ Profile created successfully`)
    createdUsers.push(profileData)
  }
  
  const data = createdUsers
  
  if (data.length === 0) {
    console.error('\n❌ No users were created!')
    process.exit(1)
  }
  
  console.log(`\n✅ Successfully created ${data.length} user profiles!\n`)
  
  // Show summary
  console.log('📊 User Summary:')
  console.log('─────────────────────────────────────────────────')
  
  data.forEach(user => {
    const roleDisplay = user.admin_role 
      ? `${user.admin_role} (${user.role})`
      : user.role
    const orgDisplay = user.company_id ? 'Power Design' : '—'
    
    console.log(`✓ ${user.first_name} ${user.last_name}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Role: ${roleDisplay}`)
    console.log(`  Organization: ${orgDisplay}`)
    console.log('')
  })
  
  console.log('─────────────────────────────────────────────────')
  console.log('🎉 All mock users are now real users in the database!')
  console.log('\n💡 Stats:')
  console.log(`   Total Users: ${data.length}`)
  console.log(`   Admins: ${data.filter(u => u.admin_role).length}`)
  console.log(`   Company Users: ${data.filter(u => u.company_id).length}`)
  console.log(`   Basic Users: ${data.filter(u => !u.admin_role && !u.company_id).length}`)
  
  process.exit(0)
}

seedMockUsers()
