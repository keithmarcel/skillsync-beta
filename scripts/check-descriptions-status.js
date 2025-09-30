const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  const { data: programs } = await supabase
    .from('programs')
    .select('name, short_desc')
    .order('name')
    .limit(10);
  
  console.log('📊 Sample of updated short descriptions:\n');
  programs?.forEach((p, i) => {
    const wordCount = p.short_desc?.split(/\s+/).length || 0;
    const charCount = p.short_desc?.length || 0;
    console.log(`${i+1}. ${p.name}`);
    console.log(`   "${p.short_desc}"`);
    console.log(`   (${wordCount} words, ${charCount} chars)\n`);
  });
  
  // Count programs with good descriptions
  const { data: all } = await supabase
    .from('programs')
    .select('short_desc');
  
  const withGoodDesc = all?.filter(p => {
    if (!p.short_desc) return false;
    const wordCount = p.short_desc.split(/\s+/).length;
    return wordCount >= 13 && wordCount <= 15;
  }).length || 0;
  
  const withAnyDesc = all?.filter(p => p.short_desc).length || 0;
  
  console.log('='.repeat(50));
  console.log(`✅ Programs with descriptions: ${withAnyDesc}/${all?.length}`);
  console.log(`✅ Programs with 13-15 word descriptions: ${withGoodDesc}/${all?.length}`);
  console.log('='.repeat(50));
}

checkStatus();
