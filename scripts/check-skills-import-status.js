const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  const { count: total } = await supabase
    .from('skills')
    .select('*', { count: 'exact', head: true });
  
  const { count: lightcast } = await supabase
    .from('skills')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'LIGHTCAST');
  
  const { count: onet } = await supabase
    .from('skills')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'ONET');
  
  console.log('📊 Skills Import Status');
  console.log('======================\n');
  console.log(`Total skills: ${total}`);
  console.log(`Lightcast: ${lightcast}`);
  console.log(`O*NET: ${onet}`);
  console.log(`\nTarget: 34,796 (Lightcast)`);
  console.log(`Progress: ${((lightcast / 34796) * 100).toFixed(1)}%`);
}

checkStatus();
