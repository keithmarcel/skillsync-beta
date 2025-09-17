const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyRLSPolicies() {
  console.log('🔒 Applying RLS policies for favorites table...\n')
  
  const policies = [
    // Enable RLS
    `ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;`,
    
    // Drop existing policies if they exist
    `DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;`,
    `DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;`,
    `DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;`,
    
    // Create new policies
    `CREATE POLICY "Users can view own favorites" ON public.favorites
     FOR SELECT USING (auth.uid() = user_id);`,
    
    `CREATE POLICY "Users can insert own favorites" ON public.favorites
     FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    
    `CREATE POLICY "Users can delete own favorites" ON public.favorites
     FOR DELETE USING (auth.uid() = user_id);`,
    
    // Grant permissions
    `GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;`,
    `GRANT USAGE ON SCHEMA public TO authenticated;`
  ]
  
  for (const [index, sql] of policies.entries()) {
    try {
      console.log(`Executing policy ${index + 1}/${policies.length}...`)
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        console.error(`❌ Error in policy ${index + 1}:`, error.message)
      } else {
        console.log(`✅ Policy ${index + 1} applied successfully`)
      }
    } catch (err) {
      // Try direct SQL execution
      try {
        const { error } = await supabase.from('_').select().limit(0) // This will fail but we can use the connection
        // Since rpc might not work, let's try a different approach
        console.log(`⚠️  RPC not available, policy ${index + 1} needs manual application`)
      } catch (e) {
        console.log(`⚠️  Policy ${index + 1} needs manual application via Supabase Dashboard`)
      }
    }
  }
  
  console.log('\n📋 Manual SQL to run in Supabase Dashboard SQL Editor:')
  console.log('=' .repeat(60))
  policies.forEach(sql => console.log(sql))
  console.log('=' .repeat(60))
  
  process.exit(0)
}

applyRLSPolicies()
