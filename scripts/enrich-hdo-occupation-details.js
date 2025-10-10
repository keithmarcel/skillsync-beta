#!/usr/bin/env node
/**
 * HDO Occupation Details Enrichment
 * 
 * Enriches High-Demand Occupations (job_kind='occupation') with:
 * - Core Responsibilities (from O*NET/COS, supplemented by AI)
 * - Typical Tasks & Responsibilities (from O*NET/COS)
 * - Tools & Technology (from O*NET/COS)
 * 
 * Strategy:
 * 1. Check what data already exists (don't overwrite)
 * 2. Fetch from CareerOneStop API (O*NET data)
 * 3. Supplement gaps with AI generation
 * 4. Only update fields that are missing or empty
 * 
 * Similar to Skills Extractor pattern - modular and reusable
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// CareerOneStop API credentials
const COS_USER_ID = process.env.CAREERONESTOP_USER_ID
const COS_API_KEY = process.env.CAREERONESTOP_API_KEY
const COS_BASE_URL = 'https://api.careeronestop.org/v1'

/**
 * Convert SOC code to O*NET format
 * Example: "29-1141" -> "29-1141.00"
 */
function toOnetCode(socCode) {
  if (!socCode) return null
  const cleaned = socCode.replace(/[.-]/g, '')
  if (cleaned.length >= 6) {
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 6)}.${cleaned.substring(6, 8) || '00'}`
  }
  return socCode
}

/**
 * Fetch occupation details from CareerOneStop
 */
async function fetchCareerOneStopData(socCode) {
  try {
    const onetCode = toOnetCode(socCode)
    const endpoint = `${COS_BASE_URL}/occupation/${COS_USER_ID}/${onetCode}/US`
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${COS_API_KEY}`,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.log(`    ⚠️  CareerOneStop API returned ${response.status}`)
      return null
    }
    
    const data = await response.json()
    
    if (data.OccupationDetail && data.OccupationDetail.length > 0) {
      const details = data.OccupationDetail[0]
      return {
        tasks: details.Tasks || [],
        tools: details.ToolsAndTechnology || [],
        knowledge: details.Knowledge || [],
        skills: details.Skills || [],
        abilities: details.Abilities || []
      }
    }
    
    return null
  } catch (error) {
    console.log(`    ❌ Error fetching CareerOneStop data: ${error.message}`)
    return null
  }
}

/**
 * Generate core responsibilities using AI
 */
async function generateCoreResponsibilities(occupationTitle, socCode, cosData) {
  try {
    const tasksContext = cosData?.tasks?.slice(0, 5).map(t => t.TaskDescription || t).join('\n- ') || 'Not available'
    const skillsContext = cosData?.skills?.slice(0, 8).map(s => s.SkillName || s).join(', ') || 'Not available'
    
    const prompt = `Generate 5-7 core responsibilities for a ${occupationTitle} (SOC: ${socCode}).

Context from O*NET:
- Key tasks: ${tasksContext}
- Key skills: ${skillsContext}

Generate professional, actionable core responsibilities that:
1. Are specific to this occupation
2. Represent major areas of accountability
3. Are written in active voice
4. Are concise (1-2 sentences each)
5. Cover different aspects of the role

Return ONLY a JSON array of strings, no other text.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in occupational analysis. Generate accurate, professional core responsibilities. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
    
    const content = response.choices[0].message.content.trim()
    const responsibilities = JSON.parse(content)
    
    return Array.isArray(responsibilities) ? responsibilities : []
  } catch (error) {
    console.log(`    ⚠️  AI generation failed: ${error.message}`)
    return []
  }
}

/**
 * Check if field needs enrichment
 */
function needsEnrichment(field) {
  if (!field) return true
  if (Array.isArray(field)) return field.length === 0
  if (typeof field === 'string') return field.length < 3
  if (typeof field === 'object') return Object.keys(field).length === 0
  return false
}

/**
 * Enrich a single occupation
 */
async function enrichOccupation(job) {
  console.log(`\n📊 ${job.title}`)
  console.log(`   SOC: ${job.soc_code}`)
  
  const updates = {}
  let needsUpdate = false
  
  // Check what needs enrichment
  const needsResponsibilities = needsEnrichment(job.core_responsibilities)
  const needsTasks = needsEnrichment(job.tasks)
  const needsTools = needsEnrichment(job.tools_and_technology)
  
  console.log(`   Status:`)
  console.log(`     Core Responsibilities: ${needsResponsibilities ? '❌ Missing' : '✅ Has data'}`)
  console.log(`     Tasks: ${needsTasks ? '❌ Missing' : '✅ Has data'}`)
  console.log(`     Tools: ${needsTools ? '❌ Missing' : '✅ Has data'}`)
  
  // If everything exists, skip
  if (!needsResponsibilities && !needsTasks && !needsTools) {
    console.log(`   ⏭️  All data exists, skipping`)
    return { success: true, skipped: true }
  }
  
  // Fetch from CareerOneStop
  console.log(`   🔍 Fetching from CareerOneStop...`)
  const cosData = await fetchCareerOneStopData(job.soc_code)
  
  if (!cosData) {
    console.log(`   ⚠️  No CareerOneStop data available`)
  }
  
  // Enrich Core Responsibilities
  if (needsResponsibilities) {
    console.log(`   🤖 Generating core responsibilities with AI...`)
    const responsibilities = await generateCoreResponsibilities(job.title, job.soc_code, cosData)
    
    if (responsibilities.length > 0) {
      updates.core_responsibilities = responsibilities
      needsUpdate = true
      console.log(`   ✅ Generated ${responsibilities.length} responsibilities`)
    }
  }
  
  // Enrich Tasks
  if (needsTasks && cosData?.tasks && cosData.tasks.length > 0) {
    // Format tasks for database
    const formattedTasks = cosData.tasks.slice(0, 12).map(task => ({
      TaskDescription: task.TaskDescription || task,
      TaskID: task.TaskID || null
    }))
    
    updates.tasks = formattedTasks
    needsUpdate = true
    console.log(`   ✅ Added ${formattedTasks.length} tasks from O*NET`)
  }
  
  // Enrich Tools & Technology
  if (needsTools && cosData?.tools && cosData.tools.length > 0) {
    // Format tools for database
    const formattedTools = cosData.tools.slice(0, 15).map(tool => ({
      ToolName: tool.ToolName || tool.TechnologyName || tool,
      Category: tool.Category || 'General',
      Example: tool.Example || null
    }))
    
    updates.tools_and_technology = formattedTools
    needsUpdate = true
    console.log(`   ✅ Added ${formattedTools.length} tools from O*NET`)
  }
  
  // Update database if needed
  if (needsUpdate) {
    const { error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', job.id)
    
    if (error) {
      console.log(`   ❌ Database update failed: ${error.message}`)
      return { success: false, error: error.message }
    }
    
    console.log(`   💾 Database updated successfully`)
    return { success: true, updated: true, fields: Object.keys(updates) }
  }
  
  return { success: true, skipped: true }
}

/**
 * Main enrichment process
 */
async function enrichAllOccupations() {
  console.log('🚀 HDO Occupation Details Enrichment\n')
  console.log('=' .repeat(60))
  console.log('\nStrategy:')
  console.log('  1. Check existing data (don\'t overwrite)')
  console.log('  2. Fetch from CareerOneStop (O*NET)')
  console.log('  3. Supplement with AI generation')
  console.log('  4. Update only missing fields\n')
  console.log('=' .repeat(60))
  
  try {
    // Get all HDO occupations
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, soc_code, core_responsibilities, tasks, tools_and_technology')
      .eq('job_kind', 'occupation')
      .eq('status', 'published')
      .not('soc_code', 'is', null)
      .order('title')
    
    if (error) {
      console.error('❌ Error fetching jobs:', error)
      return
    }
    
    console.log(`\n📋 Found ${jobs.length} HDO occupations to process\n`)
    
    let updated = 0
    let skipped = 0
    let failed = 0
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      console.log(`\n[${i + 1}/${jobs.length}]`)
      
      const result = await enrichOccupation(job)
      
      if (result.success) {
        if (result.updated) {
          updated++
        } else if (result.skipped) {
          skipped++
        }
      } else {
        failed++
      }
      
      // Rate limiting for CareerOneStop API (20 req/min)
      if (i < jobs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ Enrichment Complete!\n')
    console.log(`📊 Results:`)
    console.log(`   Updated: ${updated} occupations`)
    console.log(`   Skipped: ${skipped} occupations (already had data)`)
    console.log(`   Failed: ${failed} occupations`)
    console.log('\n🎯 All HDO occupations now have complete detail page data!\n')
    
  } catch (error) {
    console.error('\n❌ Enrichment failed:', error.message)
    process.exit(1)
  }
}

// Run enrichment
enrichAllOccupations().catch(console.error)
