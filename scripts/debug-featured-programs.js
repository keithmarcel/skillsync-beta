import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function debugFeaturedPrograms() {
  console.log('Fetching featured programs...\n')
  
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
  
  console.log(`Found ${data.length} featured programs:\n`)
  
  data.forEach(program => {
    console.log(`Program: ${program.name}`)
    console.log(`  ID: ${program.id}`)
    console.log(`  Status: ${program.status}`)
    console.log(`  Is Featured: ${program.is_featured}`)
    console.log(`  School: ${program.school?.name || 'No school'}`)
    console.log(`  School Logo: ${program.school?.logo_url || 'NO LOGO'}`)
    console.log(`  School Published: ${program.school?.is_published}`)
    console.log('---')
  })
  
  process.exit(0)
}

debugFeaturedPrograms()
