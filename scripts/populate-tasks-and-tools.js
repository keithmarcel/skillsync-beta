/**
 * Populate Day-to-Day Tasks and Tools & Technology using AI
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function populateTasksAndTools() {
  console.log('🤖 Generating Day-to-Day Tasks and Tools with AI...\n');
  
  const roles = [
    {
      id: '42d898f5-06d3-465d-81dc-2d8f49c25d61',
      title: 'Assistant Property Manager',
      socCode: '11-9141.00'
    },
    {
      id: '4dd6bc75-f6a0-4d68-9d69-e18a500a9746',
      title: 'Business Process Engineer',
      socCode: '17-2112.00'
    }
  ];
  
  for (const role of roles) {
    console.log(`📋 ${role.title}\n`);
    
    // Get role description
    const { data: roleData } = await supabase
      .from('jobs')
      .select('long_desc, core_responsibilities')
      .eq('id', role.id)
      .single();
    
    // Call AI to generate tasks and tools
    const response = await fetch('http://localhost:3000/api/admin/skills-extractor/soc-process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        socCode: role.socCode,
        jobTitle: role.title,
        jobDescription: roleData.long_desc
      })
    });
    
    const result = await response.json();
    
    // Extract tasks from O*NET data
    const tasks = result.onetData?.tasks || [];
    console.log(`  ✅ Found ${tasks.length} tasks from O*NET`);
    
    // Generate tools using AI based on role
    const toolsPrompt = `List 10-12 specific tools, software, and technology commonly used by a ${role.title}. 
    
Return ONLY a JSON array of tool names (strings), no explanations:
["Tool 1", "Tool 2", ...]

Focus on:
- Software applications
- Technology platforms  
- Industry-specific tools
- Communication tools
- Productivity software`;

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const toolsResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: toolsPrompt }],
      temperature: 0.7
    });
    
    const toolsText = toolsResponse.choices[0].message.content.trim();
    let tools = [];
    try {
      tools = JSON.parse(toolsText.replace(/```json\n?|\n?```/g, ''));
    } catch (e) {
      console.error('  ❌ Failed to parse tools JSON');
      tools = [];
    }
    
    console.log(`  ✅ Generated ${tools.length} tools with AI\n`);
    
    // Update the role
    await supabase
      .from('jobs')
      .update({
        tasks: JSON.stringify(tasks.slice(0, 12)), // Top 12 tasks
        tools_and_technology: tools.slice(0, 12).map(tool => ({ name: tool }))
      })
      .eq('id', role.id);
    
    console.log(`  ✅ Updated database\n`);
  }
  
  console.log('✅ All roles updated with tasks and tools!');
}

populateTasksAndTools()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
