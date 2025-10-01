/**
 * Program Skills Enrichment Service
 * 
 * Enriches programs with skills using:
 * 1. CIP → SOC inheritance (O*NET validated skills)
 * 2. AI course description analysis
 * 3. Deduplication and weighting
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface Skill {
  id: string
  name: string
  weight: number
  source: 'CIP_SOC_INHERITANCE' | 'COURSE_ANALYSIS'
  confidence: number
  inherited_from_soc?: string
}

/**
 * Step 1: Get related SOC codes for a CIP code
 */
export async function getRelatedSOCsForCIP(cipCode: string): Promise<string[]> {
  // TODO: Implement CIP-SOC crosswalk lookup
  // For now, use a simple mapping based on CIP category
  
  const cipCategory = cipCode.substring(0, 2)
  
  // Example mappings (expand this based on actual crosswalk data)
  const categoryToSOCs: Record<string, string[]> = {
    '11': ['15-1252.00', '15-1232.00'], // Computer Science → Software Dev, IT Support
    '52': ['13-2011.00', '11-3031.00'], // Business → Accountants, Financial Managers
    '51': ['29-1141.00', '29-2061.00'], // Health → Nurses, LPNs
    '43': ['23-2011.00', '43-6014.00'], // Legal → Paralegals, Secretaries
    '47': ['47-2111.00', '47-2031.00']  // Construction → Electricians, Carpenters
  }
  
  return categoryToSOCs[cipCategory] || []
}

/**
 * Step 2: Inherit skills from related SOC codes
 */
export async function inheritSkillsFromSOCs(socCodes: string[]): Promise<Skill[]> {
  const allSkills: Skill[] = []
  
  for (const socCode of socCodes) {
    // Get job for this SOC
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('soc_code', socCode)
      .single()
    
    if (!job) continue
    
    // Get skills for this job
    const { data: jobSkills } = await supabase
      .from('job_skills')
      .select('*, skills(*)')
      .eq('job_id', job.id)
    
    if (!jobSkills) continue
    
    for (const js of jobSkills) {
      allSkills.push({
        id: js.skills.id,
        name: js.skills.name,
        weight: js.weight || 0.5,
        source: 'CIP_SOC_INHERITANCE',
        confidence: 1.0,
        inherited_from_soc: socCode
      })
    }
  }
  
  return deduplicateSkills(allSkills)
}

/**
 * Step 3: Extract skills from course descriptions using AI
 */
export async function extractSkillsFromCourses(
  courseDescriptions: string[]
): Promise<Skill[]> {
  
  if (courseDescriptions.length === 0) return []
  
  const prompt = `Analyze these course descriptions and identify specific skills taught:

${courseDescriptions.slice(0, 10).join('\n\n')}

Return ONLY a JSON array of skills with confidence scores:
[{
  "skill_name": "Python Programming",
  "confidence": 0.9
}]

Focus on:
- Technical skills (programming languages, tools, software)
- Professional skills (project management, analysis, communication)
- Domain knowledge (accounting, nursing, legal research)

Avoid generic skills like "teamwork" or "problem solving".`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a curriculum analyst. Extract specific, assessable skills from course descriptions. Return valid JSON only.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
    
    const content = response.choices[0].message.content || '[]'
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const extractedSkills = JSON.parse(cleanContent)
    
    // Match to existing skills in database
    return await matchToTaxonomy(extractedSkills)
    
  } catch (error) {
    console.error('Error extracting skills from courses:', error)
    return []
  }
}

/**
 * Match extracted skill names to our taxonomy
 */
async function matchToTaxonomy(
  extractedSkills: Array<{ skill_name: string; confidence: number }>
): Promise<Skill[]> {
  
  const matched: Skill[] = []
  
  for (const extracted of extractedSkills) {
    // Try exact match first
    let { data: skill } = await supabase
      .from('skills')
      .select('id, name')
      .ilike('name', extracted.skill_name)
      .single()
    
    // Try fuzzy match if no exact match
    if (!skill) {
      const { data: fuzzyMatches } = await supabase
        .from('skills')
        .select('id, name')
        .ilike('name', `%${extracted.skill_name.split(' ')[0]}%`)
        .limit(1)
      
      skill = fuzzyMatches?.[0]
    }
    
    if (skill) {
      matched.push({
        id: skill.id,
        name: skill.name,
        weight: extracted.confidence,
        source: 'COURSE_ANALYSIS',
        confidence: extracted.confidence
      })
    }
  }
  
  return matched
}

/**
 * Deduplicate skills and average weights
 */
function deduplicateSkills(skills: Skill[]): Skill[] {
  const skillMap = new Map<string, Skill>()
  
  for (const skill of skills) {
    if (skillMap.has(skill.id)) {
      const existing = skillMap.get(skill.id)!
      // Average the weights
      existing.weight = (existing.weight + skill.weight) / 2
      // Keep higher confidence
      existing.confidence = Math.max(existing.confidence, skill.confidence)
    } else {
      skillMap.set(skill.id, { ...skill })
    }
  }
  
  return Array.from(skillMap.values())
}

/**
 * Main function: Enrich program with skills
 */
export async function enrichProgramWithSkills(
  programId: string
): Promise<{ success: boolean; skillsAdded: number }> {
  
  console.log(`\n📚 Enriching program ${programId} with skills...`)
  
  // Get program details
  const { data: program } = await supabase
    .from('programs')
    .select('*, courses(*)')
    .eq('id', programId)
    .single()
  
  if (!program) {
    throw new Error('Program not found')
  }
  
  console.log(`  Program: ${program.name}`)
  console.log(`  CIP: ${program.cip_code}`)
  
  // Step 1: Get skills from CIP → SOC inheritance
  const socCodes = await getRelatedSOCsForCIP(program.cip_code)
  console.log(`  Related SOCs: ${socCodes.join(', ')}`)
  
  const inheritedSkills = await inheritSkillsFromSOCs(socCodes)
  console.log(`  Inherited skills: ${inheritedSkills.length}`)
  
  // Step 2: Get skills from course descriptions
  const courseDescriptions = program.courses?.map((c: any) => c.description).filter(Boolean) || []
  const courseSkills = await extractSkillsFromCourses(courseDescriptions)
  console.log(`  Course-extracted skills: ${courseSkills.length}`)
  
  // Step 3: Combine and deduplicate
  const allSkills = deduplicateSkills([...inheritedSkills, ...courseSkills])
  console.log(`  Total unique skills: ${allSkills.length}`)
  
  // Step 4: Save to database
  for (const skill of allSkills) {
    await supabase
      .from('program_skills')
      .upsert({
        program_id: programId,
        skill_id: skill.id,
        weight: skill.weight,
        source: skill.source,
        confidence: skill.confidence
      }, { onConflict: 'program_id,skill_id' })
  }
  
  console.log(`  ✅ Enrichment complete`)
  
  return {
    success: true,
    skillsAdded: allSkills.length
  }
}

/**
 * Batch enrich all programs
 */
export async function enrichAllPrograms(): Promise<{
  processed: number
  successful: number
  totalSkills: number
}> {
  
  console.log('\n🚀 Batch enriching all programs...\n')
  
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name')
    .order('name')
  
  if (!programs) {
    return { processed: 0, successful: 0, totalSkills: 0 }
  }
  
  let successful = 0
  let totalSkills = 0
  
  for (const program of programs) {
    try {
      const result = await enrichProgramWithSkills(program.id)
      if (result.success) {
        successful++
        totalSkills += result.skillsAdded
      }
      
      // Delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`  ❌ Error enriching ${program.name}:`, error)
    }
  }
  
  console.log(`\n✅ Batch enrichment complete`)
  console.log(`  Processed: ${programs.length}`)
  console.log(`  Successful: ${successful}`)
  console.log(`  Total skills: ${totalSkills}`)
  
  return {
    processed: programs.length,
    successful,
    totalSkills
  }
}
