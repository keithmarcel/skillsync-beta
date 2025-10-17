/**
 * Check skills table schema
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  console.log('🔍 Checking skills table schema...\n')

  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error:', error.message)
    } else if (data && data.length > 0) {
      console.log('Sample row:')
      console.log(JSON.stringify(data[0], null, 2))
      console.log('\nColumn names:', Object.keys(data[0]))
    } else {
      console.log('No rows in table')
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkSchema()
