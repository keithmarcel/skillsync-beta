const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addSoftwareDeveloperDescriptions() {
  // Short description (13-15 words, ~95 characters)
  const shortDesc = "Design, develop, and test software applications using programming languages and development frameworks.";
  
  // Long description (similar length/detail to other occupations)
  const longDesc = `Research, design, and develop computer and network software or specialized utility programs. Analyze user needs and develop software solutions, applying principles and techniques of computer science, engineering, and mathematical analysis. Update software or enhance existing software capabilities. May work with computer hardware engineers to integrate hardware and software systems, and develop specifications and performance requirements. May maintain databases within an application area, working individually or coordinating database development as part of a team.`;

  console.log('📝 Adding descriptions for Software Developers');
  console.log('==============================================\n');
  
  console.log('Short Description:');
  console.log(`"${shortDesc}"`);
  console.log(`Length: ${shortDesc.split(/\s+/).length} words, ${shortDesc.length} characters\n`);
  
  console.log('Long Description:');
  console.log(`"${longDesc.substring(0, 150)}..."`);
  console.log(`Length: ${longDesc.split(/\s+/).length} words, ${longDesc.length} characters\n`);

  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        short_desc: shortDesc,
        long_desc: longDesc
      })
      .eq('title', 'Software Developers')
      .select();

    if (error) {
      console.error('❌ Error updating:', error);
      return;
    }

    console.log('✅ Successfully updated Software Developers!');
    console.log(`   Updated ${data.length} record(s)\n`);
    
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

addSoftwareDeveloperDescriptions();
