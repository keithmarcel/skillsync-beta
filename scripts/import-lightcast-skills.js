const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🌟 Lightcast Skills Import');
console.log('==========================\n');

const LIGHTCAST_API_BASE = 'https://emsiservices.com/skills';
const LIGHTCAST_AUTH_URL = 'https://auth.emsicloud.com/connect/token';

let accessToken = null;
let tokenExpiry = 0;

async function authenticate() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  console.log('🔐 Authenticating with Lightcast...');
  
  const response = await fetch(LIGHTCAST_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.LIGHTCAST_CLIENT_ID,
      client_secret: process.env.LIGHTCAST_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'emsi_open',
    }),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.statusText}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
  
  console.log('✅ Authenticated successfully\n');
  return accessToken;
}

async function fetchAllSkills() {
  const token = await authenticate();
  
  console.log('📥 Fetching all skills from Lightcast...');
  console.log('Note: This may take a few minutes for 30k+ skills\n');
  
  // Lightcast API may paginate or return all at once
  // Try fetching with limit parameter
  const response = await fetch(`${LIGHTCAST_API_BASE}/versions/latest/skills?limit=50000`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch skills: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error('No skills returned from Lightcast API. Check credentials and API access.');
  }
  
  console.log(`✅ Fetched ${data.data.length} skills\n`);
  
  return data.data;
}

async function importSkills() {
  try {
    // Fetch skills from Lightcast
    const lightcastSkills = await fetchAllSkills();
    
    console.log('💾 Importing skills to database...');
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < lightcastSkills.length; i++) {
      const skill = lightcastSkills[i];
      
      if (i % 100 === 0) {
        console.log(`Progress: ${i}/${lightcastSkills.length} (${((i/lightcastSkills.length)*100).toFixed(1)}%)`);
      }
      
      try {
        // Check if skill already exists by lightcast_id
        const { data: existing } = await supabase
          .from('skills')
          .select('id')
          .eq('lightcast_id', skill.id)
          .single();
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Insert new skill
        const { error } = await supabase
          .from('skills')
          .insert({
            name: skill.name,
            lightcast_id: skill.id,
            category: skill.category?.name || skill.type?.name || 'General',
            description: skill.description || '',
            source: 'LIGHTCAST',
            source_version: 'latest',
            is_active: true,
          });
        
        if (error) {
          console.error(`Error importing ${skill.name}:`, error.message);
          errors++;
        } else {
          imported++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (err) {
        console.error(`Error processing skill ${skill.name}:`, err);
        errors++;
      }
    }
    
    console.log('\n==========================');
    console.log('🎉 Import Complete!');
    console.log('==========================\n');
    console.log(`✅ Imported: ${imported}`);
    console.log(`⏭️  Skipped (existing): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    
    // Verify total
    const { count: totalSkills } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total skills in database: ${totalSkills}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importSkills();
