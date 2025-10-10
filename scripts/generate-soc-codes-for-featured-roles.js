/**
 * SOC Code Generation Script for Featured Roles
 * 
 * Purpose: Analyze existing Featured Roles and assign appropriate SOC codes
 * using AI to match job titles and descriptions to O*NET taxonomy.
 * 
 * Usage:
 *   node scripts/generate-soc-codes-for-featured-roles.js [--dry-run] [--role-id=UUID]
 * 
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --role-id    Process only a specific role (useful for testing)
 * 
 * Process:
 *   1. Fetch all featured roles without SOC codes (or all if --force)
 *   2. For each role, use AI to analyze title + description
 *   3. Match to appropriate SOC code from O*NET taxonomy
 *   4. Update database with assigned SOC code
 *   5. Log results for review
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
const forceAll = args.includes('--force')
const specificRoleId = args.find(arg => arg.startsWith('--role-id='))?.split('=')[1]

console.log('🎯 SOC Code Generation Script')
console.log('================================')
console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}`)
if (specificRoleId) console.log(`Target: Single role ${specificRoleId}`)
console.log('')

/**
 * O*NET SOC Taxonomy Reference
 * This is a subset of common SOC codes - the AI will use these as reference
 */
const SOC_TAXONOMY_REFERENCE = `
# O*NET SOC Code Taxonomy (2018)

## Management Occupations (11-xxxx)
11-1021.00 - General and Operations Managers
11-2021.00 - Marketing Managers
11-2022.00 - Sales Managers
11-3021.00 - Computer and Information Systems Managers
11-3031.00 - Financial Managers
11-3071.00 - Transportation, Storage, and Distribution Managers
11-9021.00 - Construction Managers
11-9111.00 - Medical and Health Services Managers
11-9199.00 - Managers, All Other

## Business and Financial Operations (13-xxxx)
13-1023.00 - Purchasing Agents, Except Wholesale, Retail, and Farm Products
13-1111.00 - Management Analysts
13-1161.00 - Market Research Analysts and Marketing Specialists
13-2011.00 - Accountants and Auditors
13-2051.00 - Financial Analysts
13-2052.00 - Personal Financial Advisors
13-2072.00 - Loan Officers

## Computer and Mathematical (15-xxxx)
15-1211.00 - Computer Systems Analysts
15-1212.00 - Information Security Analysts
15-1232.00 - Computer User Support Specialists
15-1244.00 - Network and Computer Systems Administrators
15-1251.00 - Computer Programmers
15-1252.00 - Software Developers
15-1256.00 - Software Developers and Software Quality Assurance Analysts and Testers
15-1299.00 - Computer Occupations, All Other

## Architecture and Engineering (17-xxxx)
17-2051.00 - Civil Engineers
17-2071.00 - Electrical Engineers
17-2112.00 - Industrial Engineers
17-2141.00 - Mechanical Engineers
17-3011.00 - Architectural and Civil Drafters
17-3023.00 - Electrical and Electronic Engineering Technologists and Technicians
17-3027.00 - Mechanical Engineering Technologists and Technicians

## Legal (23-xxxx)
23-1011.00 - Lawyers
23-2011.00 - Paralegals and Legal Assistants

## Education (25-xxxx)
25-2021.00 - Elementary School Teachers, Except Special Education
25-2031.00 - Secondary School Teachers, Except Special and Career/Technical Education
25-3021.00 - Self-Enrichment Teachers
25-9031.00 - Instructional Coordinators

## Healthcare Practitioners (29-xxxx)
29-1141.00 - Registered Nurses
29-1171.00 - Nurse Practitioners
29-2055.00 - Surgical Technologists
29-2061.00 - Licensed Practical and Licensed Vocational Nurses

## Healthcare Support (31-xxxx)
31-1131.00 - Nursing Assistants
31-9092.00 - Medical Assistants

## Sales and Related (41-xxxx)
41-1011.00 - First-Line Supervisors of Retail Sales Workers
41-1012.00 - First-Line Supervisors of Non-Retail Sales Workers
41-3031.00 - Securities, Commodities, and Financial Services Sales Agents
41-3099.00 - Sales Representatives, Services, All Other
41-4011.00 - Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products
41-4012.00 - Sales Representatives, Wholesale and Manufacturing, Except Technical and Scientific Products

## Office and Administrative Support (43-xxxx)
43-1011.00 - First-Line Supervisors of Office and Administrative Support Workers
43-3031.00 - Bookkeeping, Accounting, and Auditing Clerks
43-4051.00 - Customer Service Representatives
43-6011.00 - Executive Secretaries and Executive Administrative Assistants
43-6014.00 - Secretaries and Administrative Assistants, Except Legal, Medical, and Executive
43-9061.00 - Office Clerks, General

## Construction and Extraction (47-xxxx)
47-1011.00 - First-Line Supervisors of Construction Trades and Extraction Workers
47-2031.00 - Carpenters
47-2073.00 - Operating Engineers and Other Construction Equipment Operators
47-2111.00 - Electricians
47-2152.00 - Plumbers, Pipefitters, and Steamfitters

## Installation, Maintenance, and Repair (49-xxxx)
49-1011.00 - First-Line Supervisors of Mechanics, Installers, and Repairers
49-2094.00 - Electrical and Electronics Repairers, Commercial and Industrial Equipment
49-3023.00 - Automotive Service Technicians and Mechanics
49-9071.00 - Maintenance and Repair Workers, General

## Transportation and Material Moving (53-xxxx)
53-1047.00 - First-Line Supervisors of Transportation Workers
53-3032.00 - Heavy and Tractor-Trailer Truck Drivers
53-3033.00 - Light Truck Drivers
53-7062.00 - Laborers and Freight, Stock, and Material Movers, Hand
`

/**
 * Use AI to determine the best SOC code match for a job role
 */
async function generateSOCCode(title, description, companyName) {
  const prompt = `You are an expert in the O*NET SOC (Standard Occupational Classification) taxonomy. 
Your task is to analyze a job role and assign the most appropriate SOC code.

JOB ROLE INFORMATION:
- Title: ${title}
- Company: ${companyName || 'Not specified'}
- Description: ${description || 'Not provided'}

O*NET SOC TAXONOMY REFERENCE:
${SOC_TAXONOMY_REFERENCE}

INSTRUCTIONS:
1. Analyze the job title and description carefully
2. Match it to the most appropriate SOC code from the taxonomy above
3. If the exact role isn't listed, choose the closest match
4. Consider the primary duties and responsibilities
5. Respond with ONLY the SOC code in format XX-XXXX.XX

IMPORTANT: 
- Return ONLY the SOC code, nothing else
- Use the full 8-character format (e.g., 11-1021.00)
- If uncertain between two codes, choose the more specific one
- For hybrid roles, choose the code that best represents the primary function

SOC CODE:`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in occupational classification. Respond only with the SOC code in format XX-XXXX.XX'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 20
    })

    const socCode = response.choices[0].message.content.trim()
    
    // Validate format (XX-XXXX.XX)
    const socPattern = /^\d{2}-\d{4}\.\d{2}$/
    if (!socPattern.test(socCode)) {
      console.error(`⚠️  Invalid SOC code format: ${socCode}`)
      return null
    }

    return socCode
  } catch (error) {
    console.error('❌ AI generation error:', error.message)
    return null
  }
}

/**
 * Fetch featured roles that need SOC codes
 */
async function getFeaturedRoles() {
  let query = supabase
    .from('jobs')
    .select(`
      id,
      title,
      short_desc,
      long_desc,
      soc_code,
      company_id,
      companies (
        name
      )
    `)
    .eq('job_kind', 'featured_role')
    .eq('status', 'published')

  // Filter by specific role if provided
  if (specificRoleId) {
    query = query.eq('id', specificRoleId)
  } else if (!forceAll) {
    // Only get roles without SOC codes
    query = query.is('soc_code', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ Database error:', error)
    return []
  }

  return data
}

/**
 * Update a role's SOC code in the database
 */
async function updateRoleSOCCode(roleId, socCode) {
  if (isDryRun) {
    console.log(`   [DRY RUN] Would update role ${roleId} with SOC code ${socCode}`)
    return true
  }

  const { error } = await supabase
    .from('jobs')
    .update({ soc_code: socCode })
    .eq('id', roleId)

  if (error) {
    console.error(`   ❌ Update failed:`, error.message)
    return false
  }

  return true
}

/**
 * Main execution
 */
async function main() {
  console.log('📥 Fetching featured roles...\n')
  
  const roles = await getFeaturedRoles()
  
  if (roles.length === 0) {
    console.log('✅ No featured roles need SOC code assignment')
    console.log('   Use --force to regenerate all SOC codes')
    process.exit(0)
  }

  console.log(`Found ${roles.length} role(s) to process\n`)
  console.log('━'.repeat(80))
  console.log('')

  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  }

  for (const role of roles) {
    const companyName = role.companies?.name || 'Unknown Company'
    const description = role.long_desc || role.short_desc || ''
    
    console.log(`\n📋 Processing: ${role.title}`)
    console.log(`   Company: ${companyName}`)
    console.log(`   Current SOC: ${role.soc_code || 'None'}`)
    
    // Generate SOC code
    console.log(`   🤖 Analyzing with AI...`)
    const socCode = await generateSOCCode(role.title, description, companyName)
    
    if (!socCode) {
      console.log(`   ❌ Failed to generate SOC code`)
      results.failed++
      continue
    }

    console.log(`   ✅ Matched to: ${socCode}`)
    
    // Update database
    const updated = await updateRoleSOCCode(role.id, socCode)
    
    if (updated) {
      results.success++
    } else {
      results.failed++
    }

    // Rate limiting - wait 1 second between API calls
    if (roles.indexOf(role) < roles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log('')
  console.log('━'.repeat(80))
  console.log('\n📊 RESULTS SUMMARY')
  console.log('━'.repeat(80))
  console.log(`✅ Successfully processed: ${results.success}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⏭️  Skipped: ${results.skipped}`)
  console.log('')
  
  if (isDryRun) {
    console.log('💡 This was a dry run. Run without --dry-run to apply changes.')
  } else {
    console.log('✅ Database updated successfully!')
    console.log('')
    console.log('📝 NEXT STEPS:')
    console.log('   1. Review assigned SOC codes in admin interface')
    console.log('   2. Run skills inheritance to populate role skills from SOC')
    console.log('   3. Test crosswalk queries to verify relationships')
  }
  
  console.log('')
  process.exit(0)
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
