/**
 * O*NET Enrichment for Featured Roles
 * 
 * Fetches and populates O*NET data for featured roles based on their SOC codes:
 * - Core Responsibilities (from O*NET tasks)
 * - Tasks (detailed task list with importance scores)
 * - Tools & Technology (equipment and software used)
 * 
 * Usage:
 *   node scripts/enrich-featured-roles-onet.js [--dry-run] [--role-id=UUID]
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const forceOverwrite = args.includes('--force')
const specificRoleId = args.find(arg => arg.startsWith('--role-id='))?.split('=')[1]

console.log('🎯 O*NET Enrichment for Featured Roles')
console.log('=' .repeat(80))
console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}`)
if (specificRoleId) console.log(`Target: Single role ${specificRoleId}`)
console.log('')

/**
 * Fetch O*NET data from O*NET Web Services API
 */
async function fetchONETData(socCode) {
  const username = process.env.ONET_USERNAME
  const password = process.env.ONET_PASSWORD
  
  if (!username || !password) {
    console.log('   ⚠️  O*NET API credentials not found in environment')
    console.log(`   ONET_USERNAME: ${username ? 'Found' : 'Missing'}`)
    console.log(`   ONET_PASSWORD: ${password ? 'Found' : 'Missing'}`)
    return null
  }

  // O*NET uses format like 43-6014.00
  const onetCode = socCode
  
  try {
    // Create Basic Auth header
    const auth = Buffer.from(`${username}:${password}`).toString('base64')
    
    // Fetch Tasks
    const tasksUrl = `https://services.onetcenter.org/ws/online/occupations/${onetCode}/summary/tasks`
    console.log(`   📡 Fetching tasks from O*NET...`)
    
    const tasksResponse = await fetch(tasksUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    })

    // Fetch Tools & Technology
    const toolsUrl = `https://services.onetcenter.org/ws/online/occupations/${onetCode}/summary/tools_technology`
    console.log(`   📡 Fetching tools from O*NET...`)
    
    const toolsResponse = await fetch(toolsUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    })

    let tasks = []
    let tools = []

    if (tasksResponse.ok) {
      const tasksData = await tasksResponse.json()
      tasks = tasksData.task || []
      console.log(`   ✅ Fetched ${tasks.length} tasks from O*NET`)
    } else {
      console.log(`   ⚠️  Tasks API error: ${tasksResponse.status}`)
    }

    if (toolsResponse.ok) {
      const toolsData = await toolsResponse.json()
      // O*NET returns tools in categories
      const toolCategories = toolsData.category || []
      tools = toolCategories.flatMap(cat => 
        (cat.item || []).map(item => ({
          name: item.name,
          category: cat.title || 'General'
        }))
      )
      console.log(`   ✅ Fetched ${tools.length} tools from O*NET`)
    } else {
      console.log(`   ⚠️  Tools API error: ${toolsResponse.status}`)
    }

    if (tasks.length === 0 && tools.length === 0) {
      console.log(`   ⚠️  No O*NET data available for ${socCode}`)
      return null
    }
    
    return {
      tasks: tasks.map(t => ({
        task: t.statement || t,
        importance: 'High' // O*NET doesn't provide importance in this endpoint
      })),
      tools: tools,
      responsibilities: tasks.slice(0, 10).map(t => t.statement || t)
    }
  } catch (error) {
    console.log(`   ⚠️  O*NET fetch error: ${error.message}`)
    return null
  }
}

/**
 * Refine O*NET data using AI - make concise and fill gaps
 */
async function refineONETDataWithAI(onetData, socCode, title, description) {
  const prompt = `You are an O*NET data refinement expert. You have real O*NET data that needs to be refined: made more concise, professional, and any gaps filled.

ORIGINAL O*NET DATA:
${JSON.stringify(onetData, null, 2)}

ROLE INFORMATION:
- SOC Code: ${socCode}
- Title: ${title}
- Description: ${description || 'Not provided'}

YOUR TASK:
1. Create CORE RESPONSIBILITIES (6-8 items): High-level strategic duties and accountabilities
   - What you're responsible for achieving
   - Outcome-focused, not action-focused
   - Example: "Maintain financial accuracy and compliance" NOT "Enter data into spreadsheets"
   
2. Create DAY-TO-DAY TASKS (10-12 items): Specific, granular daily actions
   - What you actually do on a daily/weekly basis
   - Action-focused, concrete activities
   - Example: "Draft and proofread business correspondence" NOT "Ensure effective communication"
   
3. Organize tools by category (Software, Equipment, Technology)
4. Fill any gaps if O*NET data is incomplete

CRITICAL: Core Responsibilities and Day-to-Day Tasks MUST be distinctly different:
- Responsibilities = Strategic, outcome-oriented, "what you own"
- Tasks = Tactical, action-oriented, "what you do"

Return JSON with this structure:
{
  "core_responsibilities": ["strategic responsibility 1", "strategic responsibility 2", ...],
  "tasks": [{"task": "specific daily action", "importance": "High|Medium|Low"}, ...],
  "tools_and_technology": [{"name": "tool name", "category": "Software|Equipment|Technology"}, ...]
}

GUIDELINES:
- Keep O*NET data as the foundation - only refine and condense
- Make responsibilities outcome-focused (no periods, strategic)
- Make tasks action-focused (specific verbs, concrete activities)
- Ensure tools are industry-standard and realistic
- NO OVERLAP between responsibilities and tasks`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You refine O*NET occupation data to be concise and professional while maintaining accuracy. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0].message.content
    const data = JSON.parse(content)
    
    return {
      responsibilities: data.core_responsibilities || [],
      tasks: data.tasks || [],
      tools: data.tools_and_technology || []
    }
  } catch (error) {
    console.log(`   ❌ AI refinement error: ${error.message}`)
    return null
  }
}

/**
 * Generate O*NET-style data using AI (fallback if API fails)
 */
async function generateONETDataWithAI(socCode, title, description) {
  const prompt = `You are an O*NET occupation data expert. Generate realistic, professional occupation data for the following role.

ROLE INFORMATION:
- SOC Code: ${socCode}
- Title: ${title}
- Description: ${description || 'Not provided'}

Generate the following in JSON format:
1. **core_responsibilities**: Array of 6-8 high-level responsibility statements (concise, professional, no periods)
2. **tasks**: Array of 10-12 specific task objects with format: { "task": "description", "importance": "High" | "Medium" | "Low" }
3. **tools_and_technology**: Array of 8-10 tool/technology objects with format: { "name": "tool name", "category": "Software" | "Equipment" | "Technology" }

GUIDELINES:
- Be specific and realistic for this occupation
- Use professional O*NET-style language
- Focus on actual job duties, not generic descriptions
- Tools should be industry-standard for this role
- Tasks should be measurable and actionable

Return ONLY valid JSON with this structure:
{
  "core_responsibilities": ["responsibility 1", "responsibility 2", ...],
  "tasks": [{"task": "task description", "importance": "High"}, ...],
  "tools_and_technology": [{"name": "tool name", "category": "Software"}, ...]
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an O*NET occupation data expert. Generate realistic, professional occupation data in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0].message.content
    const data = JSON.parse(content)
    
    return {
      responsibilities: data.core_responsibilities || [],
      tasks: data.tasks || [],
      tools: data.tools_and_technology || []
    }
  } catch (error) {
    console.log(`   ❌ AI generation error: ${error.message}`)
    return null
  }
}

/**
 * Transform O*NET tasks into core responsibilities format
 */
function transformToResponsibilities(tasks) {
  if (!tasks || tasks.length === 0) return []
  
  return tasks
    .slice(0, 8) // Top 8 most important
    .map(task => {
      // Clean up task text
      let text = task.Task || task
      if (typeof text === 'object') text = text.Task || ''
      
      // Remove trailing periods, ensure proper capitalization
      text = text.trim()
      if (text.endsWith('.')) text = text.slice(0, -1)
      
      return text
    })
    .filter(text => text.length > 0)
}

/**
 * Transform O*NET tasks into detailed task objects
 */
function transformToTasks(tasks) {
  if (!tasks || tasks.length === 0) return []
  
  return tasks.map(task => {
    if (typeof task === 'string') {
      return { task: task.trim(), importance: null }
    }
    return {
      task: (task.Task || task.task || '').trim(),
      importance: task.Importance || task.importance || null
    }
  }).filter(t => t.task.length > 0)
}

/**
 * Transform O*NET tools into tools & technology format
 */
function transformToTools(tools) {
  if (!tools || tools.length === 0) return []
  
  return tools.map(tool => {
    if (typeof tool === 'string') {
      return { name: tool.trim(), category: 'General' }
    }
    return {
      name: (tool.Tool || tool.name || '').trim(),
      category: tool.Category || tool.category || 'General'
    }
  }).filter(t => t.name.length > 0)
}

/**
 * Update a role with O*NET data
 */
async function updateRoleONETData(roleId, onetData) {
  if (isDryRun) {
    console.log(`   [DRY RUN] Would update role with:`)
    console.log(`     - ${onetData.responsibilities.length} responsibilities`)
    console.log(`     - ${onetData.tasks.length} tasks`)
    console.log(`     - ${onetData.tools.length} tools`)
    return true
  }

  const { error } = await supabase
    .from('jobs')
    .update({
      core_responsibilities: onetData.responsibilities,
      tasks: onetData.tasks,
      tools_and_technology: onetData.tools
    })
    .eq('id', roleId)

  if (error) {
    console.log(`   ❌ Update failed: ${error.message}`)
    return false
  }

  return true
}

/**
 * Main execution
 */
async function main() {
  console.log('📥 Fetching featured roles...\n')
  
  let query = supabase
    .from('jobs')
    .select(`
      id,
      title,
      soc_code,
      long_desc,
      short_desc,
      core_responsibilities,
      tasks,
      tools_and_technology,
      companies (
        name
      )
    `)
    .eq('job_kind', 'featured_role')
    .eq('status', 'published')
    .not('soc_code', 'is', null)

  if (specificRoleId) {
    query = query.eq('id', specificRoleId)
  }

  const { data: roles, error } = await query

  if (error) {
    console.error('❌ Database error:', error)
    process.exit(1)
  }

  if (roles.length === 0) {
    console.log('✅ No featured roles need O*NET enrichment')
    process.exit(0)
  }

  console.log(`Found ${roles.length} role(s) to process\n`)
  console.log('━'.repeat(80))

  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  }

  for (const role of roles) {
    const companyName = role.companies?.name || 'Unknown Company'
    
    console.log(`\n📋 Processing: ${role.title}`)
    console.log(`   Company: ${companyName}`)
    console.log(`   SOC Code: ${role.soc_code}`)
    
    // Check if already has O*NET data (skip unless --force)
    const hasData = role.core_responsibilities?.length > 0 || 
                    role.tasks?.length > 0 || 
                    role.tools_and_technology?.length > 0
    
    if (hasData && !forceOverwrite) {
      console.log(`   ℹ️  Already has O*NET data:`)
      console.log(`     - Responsibilities: ${role.core_responsibilities?.length || 0}`)
      console.log(`     - Tasks: ${role.tasks?.length || 0}`)
      console.log(`     - Tools: ${role.tools_and_technology?.length || 0}`)
      console.log(`   ⏭️  Skipping (use --force to overwrite)`)
      results.skipped++
      continue
    }
    
    if (hasData && forceOverwrite) {
      console.log(`   🔄 Forcing overwrite of existing data`)
    }
    
    // Step 1: Try to fetch real O*NET data from CareerOneStop API
    console.log(`   🌐 Fetching O*NET data from CareerOneStop...`)
    let rawONETData = await fetchONETData(role.soc_code)
    
    const description = role.long_desc || role.short_desc || ''
    let onetData
    
    if (rawONETData && (rawONETData.tasks?.length > 0 || rawONETData.tools?.length > 0)) {
      // Step 2: Refine O*NET data with AI to make it concise
      console.log(`   ✅ O*NET data fetched, refining with AI...`)
      onetData = await refineONETDataWithAI(rawONETData, role.soc_code, role.title, description)
      
      if (!onetData) {
        console.log(`   ⚠️  AI refinement failed, using raw O*NET data`)
        onetData = {
          responsibilities: rawONETData.responsibilities || [],
          tasks: rawONETData.tasks || [],
          tools: rawONETData.tools || []
        }
      }
    } else {
      // Fallback: Generate with AI if O*NET fetch failed
      console.log(`   ⚠️  O*NET data unavailable, generating with AI...`)
      onetData = await generateONETDataWithAI(role.soc_code, role.title, description)
      
      if (!onetData) {
        console.log(`   ❌ Failed to generate O*NET data`)
        results.failed++
        continue
      }
    }

    // Transform data (AI already returns in correct format, but ensure consistency)
    const enrichedData = {
      responsibilities: onetData.responsibilities.filter(r => r && r.length > 0),
      tasks: onetData.tasks.filter(t => t.task && t.task.length > 0),
      tools: onetData.tools.filter(t => t.name && t.name.length > 0)
    }

    console.log(`   ✅ Fetched O*NET data:`)
    console.log(`     - ${enrichedData.responsibilities.length} responsibilities`)
    console.log(`     - ${enrichedData.tasks.length} tasks`)
    console.log(`     - ${enrichedData.tools.length} tools`)
    
    // Update database
    const updated = await updateRoleONETData(role.id, enrichedData)
    
    if (updated) {
      results.success++
    } else {
      results.failed++
    }

    // Rate limiting - wait 2 seconds between API calls
    if (roles.indexOf(role) < roles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log('')
  console.log('━'.repeat(80))
  console.log('\n📊 RESULTS SUMMARY')
  console.log('━'.repeat(80))
  console.log(`✅ Successfully enriched: ${results.success}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⏭️  Skipped (already has data): ${results.skipped}`)
  console.log('')
  
  if (isDryRun) {
    console.log('💡 This was a dry run. Run without --dry-run to apply changes.')
  } else if (results.success > 0) {
    console.log('✅ Database updated successfully!')
    console.log('')
    console.log('📝 NEXT STEPS:')
    console.log('   1. Review O*NET data in featured role detail pages')
    console.log('   2. Phase 2B: Build admin override system for customization')
    console.log('   3. Test skills inheritance from soc_skills table')
  }
  
  console.log('')
  process.exit(0)
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
