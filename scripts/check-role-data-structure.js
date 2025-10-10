import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDataStructure() {
  const { data, error } = await supabase
    .from('jobs')
    .select('title, core_responsibilities, tasks')
    .eq('job_kind', 'featured_role')
    .limit(1)
    .single()

  if (error) {
    console.log('Error:', error)
    return
  }

  console.log('\n📋 Data Structure Check:', data.title)
  console.log('='.repeat(80))
  
  console.log('\n🔍 Core Responsibilities:')
  console.log('Type:', typeof data.core_responsibilities)
  console.log('Is Array:', Array.isArray(data.core_responsibilities))
  if (Array.isArray(data.core_responsibilities)) {
    console.log('Count:', data.core_responsibilities.length)
    console.log('First 3 items:')
    data.core_responsibilities.slice(0, 3).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item}`)
    })
  } else {
    console.log('Value:', JSON.stringify(data.core_responsibilities).substring(0, 200))
  }

  console.log('\n🔍 Tasks:')
  console.log('Type:', typeof data.tasks)
  console.log('Is Array:', Array.isArray(data.tasks))
  if (Array.isArray(data.tasks)) {
    console.log('Count:', data.tasks.length)
    console.log('First 3 items:')
    data.tasks.slice(0, 3).forEach((item, i) => {
      console.log(`  ${i + 1}.`, JSON.stringify(item).substring(0, 100))
    })
  }
}

checkDataStructure()
