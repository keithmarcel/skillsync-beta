import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const logoMappings = [
  { name: 'Bisk Workforce Essentials', logo: '/schools/BWE-logo-color.svg' },
  { name: 'Bisk Workforce Essentials: Healthcare', logo: '/schools/Bisk Workforce Essentials - Healthcare Lockup Color Lockup.svg' },
  { name: 'Caldwell University', logo: '/schools/CAL-logo-horizontal-color (1).svg' },
  { name: 'Eastern Connecticut State University', logo: '/schools/ECSU-logo-horizontal-color.svg' },
  { name: 'Emory Executive Education', logo: '/schools/EMG-logo-horizontal-color.svg' },
  { name: 'Emory University', logo: '/schools/EMUC-logo-horizontal-color.svg' },
  { name: 'Kelley Executive Education Programs', logo: '/schools/KSB-logo-horizontal-knockout.svg' },
  { name: 'Michigan State University', logo: '/schools/MSU Broad Logo Horiz New.svg' },
  { name: 'Nexford University', logo: '/schools/Nexford-logo-horizontal-color.svg' },
  { name: 'Southern Methodist University', logo: '/schools/SMU-logo-horizontal-color-1.svg' },
  { name: 'St. Catherine University', logo: '/schools/St Catherine-logo-horizontal-color.svg' },
  { name: 'University of South Florida', logo: '/schools/USF-logo-horizontal-color.svg' },
  { name: 'University of Louisville', logo: '/schools/University of Louiville.svg' },
  { name: 'Pinellas Technical College', logo: '/schools/ptec.png' },
  { name: 'St. Petersburg College', logo: '/schools/spc.svg' }
]

async function updateLogos() {
  console.log('Updating school logos...\n')
  
  for (const mapping of logoMappings) {
    const { data, error } = await supabase
      .from('schools')
      .update({ logo_url: mapping.logo })
      .eq('name', mapping.name)
      .select()
    
    if (error) {
      console.error(`❌ Error updating ${mapping.name}:`, error.message)
    } else if (data && data.length > 0) {
      console.log(`✅ Updated ${mapping.name}`)
    } else {
      console.log(`⚠️  No school found with name: ${mapping.name}`)
    }
  }
  
  console.log('\n✨ Logo update complete!')
  process.exit(0)
}

updateLogos()
