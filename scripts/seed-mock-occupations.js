/**
 * Seed mock occupations for testing
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const mockOccupations = [
  {
    soc_code: '15-1252.00',
    title: 'Software Developers',
    description: 'Research, design, and develop computer and network software or specialized utility programs.',
    category: 'Technology',
    is_featured: true
  },
  {
    soc_code: '29-1141.00',
    title: 'Registered Nurses',
    description: 'Assess patient health problems and needs, develop and implement nursing care plans, and maintain medical records.',
    category: 'Healthcare',
    is_featured: true
  },
  {
    soc_code: '13-2011.00',
    title: 'Accountants and Auditors',
    description: 'Examine, analyze, and interpret accounting records to prepare financial statements, give advice, or audit and evaluate statements.',
    category: 'Business',
    is_featured: true
  },
  {
    soc_code: '47-2031.00',
    title: 'Carpenters',
    description: 'Construct, erect, install, or repair structures and fixtures made of wood and comparable materials.',
    category: 'Skilled Trades',
    is_featured: false
  },
  {
    soc_code: '25-2021.00',
    title: 'Elementary School Teachers',
    description: 'Teach academic and social skills to students at the elementary school level.',
    category: 'Education',
    is_featured: false
  },
  {
    soc_code: '41-3099.00',
    title: 'Sales Representatives',
    description: 'Sell goods or services to individuals and businesses.',
    category: 'Sales',
    is_featured: true
  },
  {
    soc_code: '11-1021.00',
    title: 'General and Operations Managers',
    description: 'Plan, direct, or coordinate the operations of public or private sector organizations.',
    category: 'Management',
    is_featured: true
  },
  {
    soc_code: '49-9071.00',
    title: 'Maintenance and Repair Workers',
    description: 'Perform work involving the skills of two or more maintenance or craft occupations.',
    category: 'Skilled Trades',
    is_featured: false
  },
  {
    soc_code: '43-4051.00',
    title: 'Customer Service Representatives',
    description: 'Interact with customers to provide information in response to inquiries about products or services.',
    category: 'Customer Service',
    is_featured: false
  },
  {
    soc_code: '29-2061.00',
    title: 'Licensed Practical Nurses',
    description: 'Care for ill, injured, or convalescing patients or persons with disabilities in hospitals, nursing homes, clinics, or similar facilities.',
    category: 'Healthcare',
    is_featured: true
  }
]

async function seedOccupations() {
  console.log('🌱 Seeding mock occupations...\n')

  try {
    // Check if jobs table exists and has data
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Current jobs in database: ${count}\n`)

    let inserted = 0
    let skipped = 0

    for (const occupation of mockOccupations) {
      // Check if occupation already exists
      const { data: existing } = await supabase
        .from('jobs')
        .select('id')
        .eq('soc_code', occupation.soc_code)
        .single()

      if (existing) {
        console.log(`⚠️  ${occupation.title} (${occupation.soc_code}) already exists, skipping...`)
        skipped++
        continue
      }

      // Insert occupation
      const { error } = await supabase
        .from('jobs')
        .insert({
          soc_code: occupation.soc_code,
          title: occupation.title,
          description: occupation.description,
          category: occupation.category,
          is_featured: occupation.is_featured,
          required_proficiency_pct: 90,
          visibility_threshold_pct: 85
        })

      if (error) {
        console.error(`❌ Error inserting ${occupation.title}:`, error.message)
      } else {
        console.log(`✅ Inserted: ${occupation.title} (${occupation.category})`)
        inserted++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Inserted: ${inserted}`)
    console.log(`   ⚠️  Skipped: ${skipped}`)
    console.log(`   📋 Total: ${mockOccupations.length}`)
    console.log('\n🎉 Done!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

seedOccupations()
