/**
 * Complete ALL Power Design roles with full data
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COMPANY_ID = 'e5848012-89df-449e-855a-1834e9389656';

// Salary data for all roles (BLS Tampa Bay area)
const SALARY_DATA = {
  '11-9021.00': { median: 98420, min: 64230, max: 152680 }, // Construction Managers
  '11-9141.00': { median: 62840, min: 38920, max: 102570 }, // Property Managers
  '17-2112.00': { median: 88950, min: 58420, max: 128350 }  // Industrial Engineers
};

async function completeAllRoles() {
  console.log('🚀 Completing ALL Power Design roles...\n');

  try {
    // Get all Power Design featured roles
    const { data: roles } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', COMPANY_ID)
      .eq('job_kind', 'featured_role')
      .order('title');

    console.log(`Found ${roles.length} roles to process\n`);

    for (const role of roles) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 ${role.title}`);
      console.log(`${'='.repeat(60)}\n`);

      const updates = {};

      // 1. Add median salary if missing
      if (!role.median_wage_usd && role.soc_code && SALARY_DATA[role.soc_code]) {
        const salaryData = SALARY_DATA[role.soc_code];
        updates.median_wage_usd = salaryData.median;
        console.log(`💰 Adding median salary: $${salaryData.median.toLocaleString()}`);
      } else if (role.median_wage_usd) {
        console.log(`✅ Median salary already set: $${role.median_wage_usd.toLocaleString()}`);
      }

      // 2. Fix core_responsibilities - remove empty items
      if (role.core_responsibilities) {
        let responsibilities = [];
        if (typeof role.core_responsibilities === 'string') {
          try {
            responsibilities = JSON.parse(role.core_responsibilities);
          } catch (e) {
            responsibilities = role.core_responsibilities.split('\n').filter(r => r.trim());
          }
        } else if (Array.isArray(role.core_responsibilities)) {
          responsibilities = role.core_responsibilities;
        }

        // Remove empty items and clean up
        responsibilities = responsibilities
          .filter(r => r && typeof r === 'string' && r.trim() !== '')
          .map(r => r.trim());

        if (responsibilities.length > 0) {
          updates.core_responsibilities = JSON.stringify(responsibilities);
          console.log(`✅ Cleaned ${responsibilities.length} core responsibilities`);
        }
      }

      // 3. Generate tasks if missing or empty
      const hasTasks = role.tasks && (
        (typeof role.tasks === 'string' && JSON.parse(role.tasks).length > 0) ||
        (Array.isArray(role.tasks) && role.tasks.length > 0)
      );

      if (!hasTasks) {
        console.log(`📝 Generating tasks with AI...`);
        
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const tasksPrompt = `List 10-12 specific day-to-day tasks for a ${role.title}.

Return ONLY a JSON array of task descriptions (strings):
["Task 1", "Task 2", ...]

Focus on daily operational tasks and specific activities.`;

        const tasksResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: tasksPrompt }],
          temperature: 0.7
        });

        const tasksText = tasksResponse.choices[0].message.content.trim();
        try {
          const tasks = JSON.parse(tasksText.replace(/\`\`\`json\\n?|\\n?\`\`\`/g, ''));
          updates.tasks = JSON.stringify(tasks);
          console.log(\`  ✅ Generated \${tasks.length} tasks\`);
        } catch (e) {
          console.error('  ❌ Failed to parse tasks JSON');
        }
      } else {
        console.log(`✅ Tasks already populated`);
      }

      // 4. Generate tools if missing or empty
      const hasTools = role.tools_and_technology && role.tools_and_technology.length > 0;

      if (!hasTools) {
        console.log(`🔧 Generating tools with AI...`);
        
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const toolsPrompt = `List 10-12 specific tools, software, and technology for a ${role.title}.

Return ONLY a JSON array of tool names (strings):
["Tool 1", "Tool 2", ...]

Focus on software, platforms, and industry-specific tools.`;

        const toolsResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: toolsPrompt }],
          temperature: 0.7
        });

        const toolsText = toolsResponse.choices[0].message.content.trim();
        try {
          const tools = JSON.parse(toolsText.replace(/\`\`\`json\\n?|\\n?\`\`\`/g, ''));
          updates.tools_and_technology = tools.map(tool => ({ name: tool }));
          console.log(\`  ✅ Generated \${tools.length} tools\`);
        } catch (e) {
          console.error('  ❌ Failed to parse tools JSON');
        }
      } else {
        console.log(`✅ Tools already populated`);
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        console.log(`\n📝 Updating database...`);
        await supabase
          .from('jobs')
          .update(updates)
          .eq('id', role.id);
        console.log(`✅ Updated!`);
      } else {
        console.log(`\n✅ No updates needed - role is complete!`);
      }
    }

    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`🎉 ALL POWER DESIGN ROLES COMPLETE!`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  }
}

completeAllRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
