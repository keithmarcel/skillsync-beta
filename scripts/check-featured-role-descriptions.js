import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDescriptions() {
  const { data, error } = await supabase
    .from('jobs')
    .select('title, long_desc, short_desc, core_responsibilities, tasks')
    .eq('job_kind', 'featured_role')

  if (error) {
    console.log('Error:', error)
    return
  }

  console.log('\n📋 Featured Role Descriptions Check\n')
  console.log('='.repeat(80))

  data.forEach(job => {
    console.log(`\n${job.title}`)
    console.log('  Long Desc:', job.long_desc ? `✅ (${job.long_desc.length} chars)` : '❌ Missing')
    console.log('  Short Desc:', job.short_desc ? `✅ (${job.short_desc.length} chars)` : '❌ Missing')
    console.log('  Core Responsibilities:', job.core_responsibilities ? `✅ (${job.core_responsibilities.length} items)` : '❌ Missing')
    console.log('  Tasks:', job.tasks ? `✅ (${job.tasks.length} items)` : '❌ Missing')
    
    if (job.long_desc) {
      console.log('  Preview:', job.long_desc.substring(0, 100) + '...')
    }
  })

  console.log('\n' + '='.repeat(80))
}

checkDescriptions()
