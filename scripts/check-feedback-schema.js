/**
 * Check the actual feedback table schema in remote database
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  console.log('🔍 Checking feedback table schema...\n')

  try {
    // Query to get table columns
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'feedback'
        ORDER BY ordinal_position;
      `
    })

    if (error) {
      // Try alternative method
      console.log('Using alternative method to check schema...')
      const { data: testData, error: testError } = await supabase
        .from('feedback')
        .select('*')
        .limit(0)
      
      if (testError) {
        console.error('❌ Error:', testError)
      } else {
        console.log('✅ Table exists but cannot query schema directly')
        console.log('Try inserting a test record to see what columns are expected')
      }
      return
    }

    console.log('📋 Feedback table columns:')
    console.table(data)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkSchema()
