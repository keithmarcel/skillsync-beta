import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkSchools() {
  console.log('Fetching schools from database...\n')
  
  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, name, logo_url')
    .order('name')
  
  if (error) {
    console.error('Error fetching schools:', error)
    process.exit(1)
  }
  
  console.log(`Found ${schools.length} schools:\n`)
  
  schools.forEach(school => {
    console.log(`ID: ${school.id}`)
    console.log(`Name: ${school.name}`)
    console.log(`Logo URL: ${school.logo_url || '(not set)'}`)
    console.log('---')
  })
  
  // Check which schools don't have logos
  const missingLogos = schools.filter(s => !s.logo_url)
  if (missingLogos.length > 0) {
    console.log(`\n⚠️  ${missingLogos.length} schools missing logos:`)
    missingLogos.forEach(s => console.log(`  - ${s.name}`))
  } else {
    console.log('\n✅ All schools have logos assigned!')
  }
  
  process.exit(0)
}

checkSchools()
