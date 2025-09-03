const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applySchemaFix() {
  console.log('Applying schema fixes to remote database...')
  
  try {
    // Add missing columns
    console.log('Adding new columns...')
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.jobs 
        ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS employment_outlook text,
        ADD COLUMN IF NOT EXISTS education_level text,
        ADD COLUMN IF NOT EXISTS work_experience text,
        ADD COLUMN IF NOT EXISTS on_job_training text,
        ADD COLUMN IF NOT EXISTS job_openings_annual integer,
        ADD COLUMN IF NOT EXISTS growth_rate_percent numeric,
        ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
        ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
      `
    })
    
    // Update existing featured roles
    console.log('Updating featured roles flag...')
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ is_featured: true })
      .eq('job_kind', 'featured_role')
    
    if (updateError) {
      console.error('Error updating featured roles:', updateError)
    } else {
      console.log('✓ Updated featured roles flag')
    }
    
    console.log('✅ Schema fixes applied successfully!')
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error)
  }
  
  process.exit(0)
}

applySchemaFix()
