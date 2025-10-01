require('dotenv').config({ path: '.env.local' });

const LIGHTCAST_AUTH_URL = 'https://auth.emsicloud.com/connect/token';
const LIGHTCAST_API_BASE = 'https://emsiservices.com/skills';

async function checkLightcastResponse() {
  try {
    // Authenticate
    const authResp = await fetch(LIGHTCAST_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.LIGHTCAST_CLIENT_ID,
        client_secret: process.env.LIGHTCAST_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'emsi_open',
      }),
    });
    
    const authData = await authResp.json();
    const token = authData.access_token;
    
    console.log('🔍 Checking Lightcast API Response Structure\n');
    
    // Get a few skills to inspect
    const skillsResp = await fetch(`${LIGHTCAST_API_BASE}/versions/latest/skills?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const skillsData = await skillsResp.json();
    
    console.log('Sample Skills from API:');
    console.log('======================\n');
    
    if (skillsData.data && skillsData.data.length > 0) {
      skillsData.data.slice(0, 3).forEach((skill, i) => {
        console.log(`Skill ${i + 1}: ${skill.name}`);
        console.log('Fields available:');
        console.log(`  - id: ${skill.id}`);
        console.log(`  - name: ${skill.name}`);
        console.log(`  - type: ${skill.type?.name || 'N/A'}`);
        console.log(`  - category: ${skill.category?.name || 'N/A'}`);
        console.log(`  - description: ${skill.description || 'NOT PROVIDED'}`);
        console.log(`  - infoUrl: ${skill.infoUrl || 'NOT PROVIDED'}`);
        console.log('');
      });
      
      // Check if ANY have descriptions
      const withDesc = skillsData.data.filter(s => s.description);
      console.log(`\nSkills with descriptions: ${withDesc.length} / ${skillsData.data.length}`);
      
      if (withDesc.length > 0) {
        console.log('\nExample with description:');
        console.log(`  ${withDesc[0].name}`);
        console.log(`  ${withDesc[0].description}`);
      } else {
        console.log('\n❌ NO DESCRIPTIONS PROVIDED BY LIGHTCAST API');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkLightcastResponse();
