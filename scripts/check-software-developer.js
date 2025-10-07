const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSoftwareDeveloper() {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, long_desc, short_desc, median_wage_usd')
    .ilike('title', '%software developer%')
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Software Developer Job:');
  console.log('======================');
  console.log('Title:', data.title);
  console.log('Median Wage:', data.median_wage_usd);
  console.log('Long Desc:', data.long_desc ? `${data.long_desc.substring(0, 100)}...` : 'NULL');
  console.log('Short Desc:', data.short_desc || 'NULL');
}

checkSoftwareDeveloper();
