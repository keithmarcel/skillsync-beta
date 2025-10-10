/**
 * Fix Featured Role Descriptions
 * 
 * Problem: Featured roles have short descriptions in long_desc field
 * Solution: 
 * 1. Move current long_desc → short_desc
 * 2. Generate proper detailed long_desc using AI based on role info
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

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')

console.log('📝 Fixing Featured Role Descriptions')
console.log('=' .repeat(80))
console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}`)
console.log('')

async function generateLongDescription(role) {
  const prompt = `Generate a detailed, professional job description (2-3 sentences, 200-300 characters) for this role:

Title: ${role.title}
Company: ${role.companies?.name || 'Not specified'}
SOC Code: ${role.soc_code}
Current Short Summary: ${role.long_desc}

Core Responsibilities: ${JSON.stringify(role.core_responsibilities?.slice(0, 3) || [])}

Requirements:
- 2-3 sentences
- 200-300 characters
- Professional tone
- Include key responsibilities and requirements
- Focus on what the role does and its impact
- Similar style to O*NET descriptions

Return ONLY the description text, no JSON, no extra formatting.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You write professional, detailed job descriptions in O*NET style. Return only the description text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 200
    })

    return response.choices[0].message.content.trim()
  } catch (error) {
    console.log(`   ⚠️  AI generation error: ${error.message}`)
    return null
  }
}

async function fixDescriptions() {
  console.log('📥 Fetching featured roles...\n')

  const { data: roles, error } = await supabase
    .from('jobs')
    .select('id, title, soc_code, long_desc, short_desc, core_responsibilities, companies(name)')
    .eq('job_kind', 'featured_role')

  if (error) {
    console.error('❌ Error fetching roles:', error)
    return
  }

  if (!roles || roles.length === 0) {
    console.log('⚠️  No featured roles found')
    return
  }

  console.log(`Found ${roles.length} featured role(s)\n`)
  console.log('━'.repeat(80))

  const results = {
    success: 0,
    failed: 0
  }

  for (const role of roles) {
    console.log(`\n📋 ${role.title}`)
    console.log(`   Company: ${role.companies?.name || 'N/A'}`)
    console.log(`   Current long_desc: "${role.long_desc?.substring(0, 80)}..."`)
    console.log(`   Current short_desc: ${role.short_desc || 'Missing'}`)

    // Step 1: Current long_desc becomes short_desc
    const newShortDesc = role.long_desc
    
    // Step 2: Generate detailed long_desc
    console.log(`   🤖 Generating detailed long description...`)
    const newLongDesc = await generateLongDescription(role)

    if (!newLongDesc) {
      console.log(`   ❌ Failed to generate long description`)
      results.failed++
      continue
    }

    console.log(`   ✅ Generated: "${newLongDesc.substring(0, 80)}..." (${newLongDesc.length} chars)`)

    if (isDryRun) {
      console.log(`   [DRY RUN] Would update:`)
      console.log(`     short_desc: "${newShortDesc}"`)
      console.log(`     long_desc: "${newLongDesc}"`)
      results.success++
    } else {
      // Update database
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          short_desc: newShortDesc,
          long_desc: newLongDesc
        })
        .eq('id', role.id)

      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`)
        results.failed++
      } else {
        console.log(`   ✅ Updated successfully`)
        results.success++
      }
    }

    // Rate limiting
    if (roles.indexOf(role) < roles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log('')
  console.log('━'.repeat(80))
  console.log('\n📊 RESULTS SUMMARY')
  console.log('━'.repeat(80))
  console.log(`✅ Successfully updated: ${results.success}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log('')
  
  if (isDryRun) {
    console.log('💡 This was a dry run. Run without --dry-run to apply changes.')
  } else if (results.success > 0) {
    console.log('✅ Descriptions fixed successfully!')
  }
}

fixDescriptions()
