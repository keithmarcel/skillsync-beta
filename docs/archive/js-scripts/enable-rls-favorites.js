const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function enableRLSOnFavorites() {
  console.log('🔒 Enabling RLS on favorites table...')
  
  // Use the REST API directly to execute SQL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const sqlCommands = [
    'ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;',
    `CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);`,
    'GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;'
  ]
  
  for (const [index, sql] of sqlCommands.entries()) {
    try {
      console.log(`Executing command ${index + 1}/${sqlCommands.length}: ${sql.substring(0, 50)}...`)
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        },
        body: JSON.stringify({ sql })
      })
      
      if (response.ok) {
        console.log(`✅ Command ${index + 1} executed successfully`)
      } else {
        const error = await response.text()
        console.log(`❌ Command ${index + 1} failed: ${error}`)
      }
    } catch (err) {
      console.error(`❌ Exception in command ${index + 1}:`, err.message)
    }
  }
  
  // Test RLS after enabling
  console.log('\n🧪 Testing RLS after enabling...')
  const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  
  const { data, error } = await anonSupabase
    .from('favorites')
    .select('*')
    .limit(1)
    
  if (error && error.message.includes('RLS')) {
    console.log('✅ RLS is now working - anonymous access blocked')
  } else if (error) {
    console.log('❌ Unexpected error:', error.message)
  } else {
    console.log('⚠️  RLS may still not be working - anonymous access still allowed')
  }
}

enableRLSOnFavorites().then(() => process.exit(0))
