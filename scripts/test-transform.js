import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function transformProgramToCard(program) {
  return {
    id: program.id,
    title: program.name,
    school: program.school?.name || 'Unknown School',
    schoolLogo: program.school?.logo_url || '',
    programType: program.program_type || 'Program',
    format: program.format || 'On-campus',
    duration: program.duration_text || 'Duration varies',
    description: program.short_desc || '',
    programUrl: program.program_url || '',
    
    // Skills mapped from program
    skillsMapped: program.skills?.map(ps => ps.skill?.name || '').filter(Boolean) || [],
    
    // Mock data for fields not in database yet
    applicationLink: program.program_url || '#',
    aboutSchoolLink: program.school?.about_url || '#'
  }
}

async function testTransform() {
  console.log('Fetching and transforming programs...\n')
  
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      school:schools!inner(*)
    `)
    .eq('is_featured', true)
    .eq('status', 'published')
    .eq('school.is_published', true)
    .limit(6)
    .order('name')
  
  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }
  
  console.log('Raw data from query:')
  data.forEach(p => {
    console.log(`\nProgram: ${p.name}`)
    console.log(`  School object:`, p.school)
  })
  
  console.log('\n\n=== TRANSFORMED DATA ===\n')
  
  const transformed = data.map(transformProgramToCard)
  
  transformed.forEach(p => {
    console.log(`\nProgram: ${p.title}`)
    console.log(`  School: ${p.school}`)
    console.log(`  School Logo: ${p.schoolLogo || 'EMPTY'}`)
  })
  
  process.exit(0)
}

testTransform()
