/**
 * O*NET Data Enrichment Pipeline - Unified for Featured Roles & Occupations
 * 
 * This script fetches real O*NET data and refines it with AI to create:
 * - Strategic Core Responsibilities (outcome-focused)
 * - Tactical Day-to-Day Tasks (action-focused)
 * - Industry-standard Tools & Technology
 * 
 * Usage:
 *   node scripts/enrich-jobs-onet.js [--force] [--dry-run] [--job-id=xxx] [--featured-roles] [--occupations]
 * 
 * Flags:
 *   --force: Overwrite existing data
 *   --dry-run: Preview changes without updating database
 *   --job-id=xxx: Process single job by ID
 *   --featured-roles: Process only featured roles (default: both)
 *   --occupations: Process only occupations (default: both)
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const forceOverwrite = args.includes('--force')
const specificJobId = args.find(arg => arg.startsWith('--job-id='))?.split('=')[1]
const onlyFeaturedRoles = args.includes('--featured-roles')
const onlyOccupations = args.includes('--occupations')

console.log('🎯 O*NET Enrichment Pipeline - Unified')
console.log('=' .repeat(80))
console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}`)
if (specificJobId) console.log(`Target: Single job ${specificJobId}`)
if (onlyFeaturedRoles) console.log('Scope: Featured Roles only')
if (onlyOccupations) console.log('Scope: Occupations only')
console.log('')

/**
 * Fetch O*NET data from O*NET Web Services API
 */
async function fetchONETData(socCode) {
  const username = process.env.ONET_USERNAME
  const password = process.env.ONET_PASSWORD
  
  if (!username || !password) {
    console.log('   ⚠️  O*NET API credentials not found in environment')
    return null
  }

  const onetCode = socCode
  
  try {
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
        importance: 'High'
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

    const result = JSON.parse(response.choices[0].message.content)
    
    return {
      responsibilities: result.core_responsibilities || [],
      tasks: result.tasks || [],
      tools: result.tools_and_technology || []
    }
  } catch (error) {
    console.log(`   ⚠️  AI refinement error: ${error.message}`)
    return null
  }
}

/**
 * Generate O*NET-style data with AI (fallback when API unavailable)
 */
async function generateONETDataWithAI(socCode, title, description) {
  const prompt = `Generate realistic O*NET-style occupation data for:

SOC Code: ${socCode}
Title: ${title}
Description: ${description || 'Not provided'}

Create professional, industry-standard data with clear differentiation:

1. CORE RESPONSIBILITIES (6-8 items): Strategic, outcome-focused duties
   - What you're accountable for achieving
   - High-level ownership areas
   
2. DAY-TO-DAY TASKS (10-12 items): Tactical, action-focused activities
   - Specific daily/weekly actions
   - Concrete, measurable tasks
   
3. TOOLS & TECHNOLOGY (8-12 items): Industry-standard tools
   - Categorized by Software, Equipment, or Technology
   - Real tools used in this occupation

Return JSON:
{
  "core_responsibilities": ["strategic responsibility 1", ...],
  "tasks": [{"task": "specific action", "importance": "High|Medium|Low"}, ...],
  "tools_and_technology": [{"name": "tool name", "category": "Software|Equipment|Technology"}, ...]
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You generate realistic O*NET-style occupation data. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0].message.content)
    
    return {
      responsibilities: result.core_responsibilities || [],
      tasks: result.tasks || [],
      tools: result.tools_and_technology || []
    }
  } catch (error) {
    console.log(`   ⚠️  AI generation error: ${error.message}`)
    return null
  }
}

/**
 * Update a job with O*NET data
 */
async function updateJobONETData(jobId, onetData) {
  if (isDryRun) {
    console.log(`   [DRY RUN] Would update job with:`)
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
    .eq('id', jobId)

  if (error) {
    console.log(`   ❌ Update failed: ${error.message}`)
    return false
  }

  return true
}

/**
 * Main enrichment process
 */
async function enrichJobs() {
  console.log('📥 Fetching jobs...\n')

  // Build query based on filters
  let query = supabase
    .from('jobs')
    .select('id, title, soc_code, job_kind, long_desc, short_desc, core_responsibilities, tasks, tools_and_technology, companies(name)')
    .not('soc_code', 'is', null)

  // Apply job kind filters
  if (onlyFeaturedRoles) {
    query = query.eq('job_kind', 'featured_role')
  } else if (onlyOccupations) {
    query = query.eq('job_kind', 'occupation')
  }

  // Apply specific job filter
  if (specificJobId) {
    query = query.eq('id', specificJobId)
  }

  const { data: jobs, error } = await query

  if (error) {
    console.error('❌ Error fetching jobs:', error)
    return
  }

  if (!jobs || jobs.length === 0) {
    console.log('⚠️  No jobs found matching criteria')
    return
  }

  console.log(`Found ${jobs.length} job(s) to process\n`)
  console.log('━'.repeat(80))

  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  }

  for (const job of jobs) {
    const jobType = job.job_kind === 'featured_role' ? 'Featured Role' : 'Occupation'
    const companyName = job.companies?.name || 'N/A'
    
    console.log(`\n📋 Processing: ${job.title}`)
    console.log(`   Type: ${jobType}`)
    if (job.job_kind === 'featured_role') {
      console.log(`   Company: ${companyName}`)
    }
    console.log(`   SOC Code: ${job.soc_code}`)

    // Check if already has data
    const hasData = job.core_responsibilities && job.tasks && job.tools_and_technology
    
    if (hasData && !forceOverwrite) {
      console.log(`   ⏭️  Already has O*NET data, skipping (use --force to overwrite)`)
      results.skipped++
      continue
    }

    if (hasData && forceOverwrite) {
      console.log(`   🔄 Forcing overwrite of existing data`)
    }

    // Step 1: Try to fetch real O*NET data
    console.log(`   🌐 Fetching O*NET data from Web Services API...`)
    let rawONETData = await fetchONETData(job.soc_code)

    const description = job.long_desc || job.short_desc || ''
    let onetData

    if (rawONETData && (rawONETData.tasks?.length > 0 || rawONETData.tools?.length > 0)) {
      // Step 2: Refine O*NET data with AI
      console.log(`   ✅ O*NET data fetched, refining with AI...`)
      onetData = await refineONETDataWithAI(rawONETData, job.soc_code, job.title, description)

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
      onetData = await generateONETDataWithAI(job.soc_code, job.title, description)

      if (!onetData) {
        console.log(`   ❌ Failed to generate O*NET data`)
        results.failed++
        continue
      }
    }

    // Transform data
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
    const updated = await updateJobONETData(job.id, enrichedData)
    
    if (updated) {
      results.success++
    } else {
      results.failed++
    }

    // Rate limiting - wait 2 seconds between API calls
    if (jobs.indexOf(job) < jobs.length - 1) {
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
    console.log('   1. Review O*NET data in job detail pages')
    console.log('   2. Verify content differentiation (responsibilities vs tasks)')
    console.log('   3. Check tools coverage across all jobs')
  }
}

// Run the enrichment
enrichJobs()
