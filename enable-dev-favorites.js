const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Use service role key to modify RLS policies
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function enableDevFavorites() {
  console.log('Creating development RLS policy for favorites...')
  
  try {
    // Create a permissive policy for development
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Allow all for development" ON public.favorites
        FOR ALL USING (true) WITH CHECK (true);
      `
    })
    
    if (error) {
      console.error('Error creating policy:', error)
      
      // Alternative approach: try direct SQL execution
      console.log('Trying alternative approach...')
      const { error: altError } = await supabase
        .from('favorites')
        .select('*')
        .limit(1)
      
      console.log('Current access test:', altError ? 'Failed' : 'Success')
    } else {
      console.log('✅ Development policy created successfully')
    }
  } catch (err) {
    console.error('Failed to create policy:', err)
  }
}

enableDevFavorites().catch(console.error)
