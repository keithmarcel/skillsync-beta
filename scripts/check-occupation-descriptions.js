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
    .select('title, long_desc, short_desc')
    .eq('job_kind', 'occupation')
    .limit(3)

  if (error) {
    console.log('Error:', error)
    return
  }

  console.log('\n📋 Occupation Descriptions Check\n')
  console.log('='.repeat(80))

  data.forEach(job => {
    console.log(`\n${job.title}`)
    console.log('  Long Desc:', job.long_desc ? `✅ (${job.long_desc.length} chars)` : '❌ Missing')
    console.log('  Short Desc:', job.short_desc ? `✅ (${job.short_desc.length} chars)` : '❌ Missing')
    
    if (job.long_desc) {
      console.log('\n  Long Desc Preview:')
      console.log('  ' + job.long_desc.substring(0, 300) + '...')
    }
    
    if (job.short_desc) {
      console.log('\n  Short Desc:')
      console.log('  ' + job.short_desc)
    }
  })

  console.log('\n' + '='.repeat(80))
}

checkDescriptions()
