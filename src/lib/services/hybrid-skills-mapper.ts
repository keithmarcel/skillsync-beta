/**
 * Hybrid Skills Mapping Service
 * 
 * Combines O*NET (government validated) + Lightcast (industry current) + AI (semantic matching)
 * to intelligently map skills to jobs, featured roles, and programs.
 * 
 * Architecture:
 * - Layer 1: O*NET foundation (broad, validated skills)
 * - Layer 2: Lightcast enrichment (specific, current skills)  
 * - Layer 3: AI semantic matching (relevance scoring)
 * - Layer 4: Deduplication & ranking (top 10-15 skills)
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { getOpenAIModel } from '@/lib/config/openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface Job {
  id: string
  title: string
  soc_code: string
  long_desc?: string
}

interface Skill {
  id: string
  name: string
  category: string
  source: 'ONET' | 'LIGHTCAST'
  description?: string
}

interface SkillMatch {
  skillId: string
  skillName: string
  source: string
  relevanceScore: number
  importanceLevel: 'critical' | 'important' | 'helpful'
  reasoning: string
}

/**
 * SOC prefix to Lightcast category mapping
 */
const SOC_TO_CATEGORIES: Record<string, string[]> = {
  '11': ['Business Skill', 'Management Skill', 'Leadership Skill'],
  '13': ['Business Skill', 'Financial Skill', 'Analytical Skill'],
  '15': ['Software Skill', 'IT Skill', 'Specialized Skill', 'Technical Skill'],
  '17': ['Engineering Skill', 'Technical Skill', 'Specialized Skill'],
  '19': ['Science Skill', 'Research Skill', 'Analytical Skill'],
  '21': ['Communication Skill', 'Creative Skill'],
  '23': ['Legal Skill', 'Analytical Skill'],
  '25': ['Education Skill', 'Communication Skill'],
  '27': ['Design Skill', 'Creative Skill', 'Technical Skill'],
  '29': ['Healthcare Skill', 'Medical Skill', 'Clinical Skill'],
  '31': ['Healthcare Support Skill', 'Patient Care Skill'],
  '33': ['Security Skill', 'Law Enforcement Skill'],
  '35': ['Food Service Skill', 'Hospitality Skill'],
  '37': ['Maintenance Skill', 'Technical Skill'],
  '39': ['Customer Service Skill', 'Personal Care Skill'],
  '41': ['Sales Skill', 'Communication Skill', 'Business Skill'],
  '43': ['Administrative Skill', 'Office Skill', 'Organizational Skill'],
  '45': ['Agricultural Skill', 'Environmental Skill'],
  '47': ['Construction Skill', 'Trade Skill', 'Technical Skill'],
  '49': ['Installation Skill', 'Repair Skill', 'Technical Skill'],
  '51': ['Production Skill', 'Manufacturing Skill', 'Technical Skill'],
  '53': ['Transportation Skill', 'Logistics Skill', 'Operations Skill']
}

/**
 * Step 1: Get O*NET skills (broad, validated foundation)
 */
async function getONETSkills(socCode: string): Promise<Skill[]> {
  // Get existing O*NET skills from job_skills for this SOC
  const { data: skills } = await supabase
    .from('skills')
    .select('id, name, category, source')
    .eq('source', 'ONET')
    .limit(10)

  return skills || []
}

/**
 * Vendor-specific skills to exclude for standard occupations
 * These are too specific and not universally applicable
 */
const VENDOR_SPECIFIC_PATTERNS = [
  'Amazon', 'AWS', 'Microsoft', 'Google', 'Oracle', 'SAP',
  'Salesforce', 'Adobe', 'IBM', 'Cisco', 'VMware',
  'ServiceNow', 'Workday', 'Tableau', 'PowerBI'
]

/**
 * Step 2: Get Lightcast skills by category (broad, universal skills only)
 */
async function getLightcastSkills(job: Job): Promise<Skill[]> {
  const socPrefix = job.soc_code.substring(0, 2)
  const categories = SOC_TO_CATEGORIES[socPrefix] || ['Specialized Skill']
  
  // Get skills by category
  const { data } = await supabase
    .from('skills')
    .select('id, name, category, source, description')
    .eq('source', 'LIGHTCAST')
    .eq('is_assessable', true)
    .in('category', categories)
    .limit(100) // Get more to filter from
  
  if (!data) return []
  
  // Filter OUT vendor-specific skills for standard occupations
  const broadSkills = data.filter(skill => {
    const skillName = skill.name.toLowerCase()
    
    // Exclude vendor-specific
    if (VENDOR_SPECIFIC_PATTERNS.some(vendor => 
      skillName.includes(vendor.toLowerCase())
    )) {
      return false
    }
    
    // Exclude overly specific product names (contains version numbers)
    if (/\d+\.\d+/.test(skillName)) {
      return false
    }
    
    // Keep broad, universal skills
    return true
  })
  
  return broadSkills.slice(0, 25) as Skill[]
}

/**
 * Step 3: AI semantic matching and ranking
 */
async function rankSkillsWithAI(
  job: Job,
  candidateSkills: Skill[]
): Promise<SkillMatch[]> {
  
  if (candidateSkills.length === 0) {
    return []
  }

  const prompt = `Job Title: ${job.title}
SOC Code: ${job.soc_code}
Description: ${job.long_desc || 'Standard occupation'}

From these ${candidateSkills.length} skills, select the 15 most relevant for this job.
Rate each skill's relevance (0-100) and categorize importance.

Skills:
${candidateSkills.map((s, i) => `${i}. ${s.name} (${s.category}, ${s.source})`).join('\n')}

Return ONLY valid JSON array (no markdown):
[{
  "skillIndex": 0,
  "skillName": "Python",
  "relevanceScore": 95,
  "reasoning": "Core programming language for software development",
  "importanceLevel": "critical"
}]

Rules:
- Select exactly 15 skills (or fewer if less available)
- importanceLevel must be: "critical", "important", or "helpful"
- Prefer BROAD, UNIVERSAL skills (Python, JavaScript, SQL) over vendor-specific (Amazon S3, Microsoft Azure)
- Avoid company-specific products unless absolutely core to the occupation
- Balance O*NET (validated) and LIGHTCAST (current) sources
- For standard occupations, choose skills applicable across most companies`

  try {
    const response = await openai.chat.completions.create({
      model: getOpenAIModel(), // gpt-4o-mini
      messages: [
        {
          role: 'system',
          content: 'You are an expert career counselor and skills analyst. Match skills to jobs based on O*NET occupational standards and current industry requirements. Return valid JSON only.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    })

    const content = response.choices[0].message.content || '[]'
    
    // Strip markdown code fences if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const aiMatches = JSON.parse(cleanContent)
    
    // Map AI results to our format
    return aiMatches.map((match: any) => ({
      skillId: candidateSkills[match.skillIndex]?.id || '',
      skillName: match.skillName,
      source: candidateSkills[match.skillIndex]?.source || 'LIGHTCAST',
      relevanceScore: match.relevanceScore,
      importanceLevel: match.importanceLevel,
      reasoning: match.reasoning
    })).filter((m: SkillMatch) => m.skillId) // Remove invalid matches

  } catch (error) {
    console.error('AI matching failed:', error)
    
    // Fallback: Return top skills by source priority (O*NET first, then Lightcast)
    return candidateSkills
      .slice(0, 15)
      .map(skill => ({
        skillId: skill.id,
        skillName: skill.name,
        source: skill.source,
        relevanceScore: skill.source === 'ONET' ? 80 : 70,
        importanceLevel: skill.source === 'ONET' ? 'important' as const : 'helpful' as const,
        reasoning: 'Fallback matching (AI unavailable)'
      }))
  }
}

/**
 * Main function: Get intelligently matched skills for a job
 */
export async function getHybridSkillsForJob(job: Job): Promise<SkillMatch[]> {
  console.log(`\n🔍 Hybrid skills mapping for: ${job.title} (${job.soc_code})`)

  // Layer 1: O*NET foundation
  const onetSkills = await getONETSkills(job.soc_code)
  console.log(`  📚 O*NET skills: ${onetSkills.length}`)

  // Layer 2: Lightcast enrichment
  const lightcastSkills = await getLightcastSkills(job)
  console.log(`  💡 Lightcast skills: ${lightcastSkills.length}`)

  // Combine and deduplicate
  const allSkills = [...onetSkills, ...lightcastSkills]
  const uniqueSkills = Array.from(
    new Map(allSkills.map(s => [s.name.toLowerCase(), s])).values()
  )
  
  console.log(`  🔗 Combined unique skills: ${uniqueSkills.length}`)

  // Layer 3: AI semantic matching
  const rankedSkills = await rankSkillsWithAI(job, uniqueSkills)
  console.log(`  🤖 AI-ranked skills: ${rankedSkills.length}`)

  return rankedSkills
}

/**
 * Save matched skills to job_skills table
 */
export async function saveSkillsToJob(
  jobId: string,
  skillMatches: SkillMatch[]
): Promise<{ success: boolean; count: number }> {
  
  const jobSkills = skillMatches.map(match => ({
    job_id: jobId,
    skill_id: match.skillId,
    importance_level: match.importanceLevel,
    proficiency_threshold: match.importanceLevel === 'critical' ? 80 : 
                          match.importanceLevel === 'important' ? 70 : 60,
    weight: match.relevanceScore / 100,
    onet_data_source: {
      source: match.source,
      relevance: match.relevanceScore,
      reasoning: match.reasoning,
      ai_matched: true
    }
  }))

  const { error } = await supabase
    .from('job_skills')
    .upsert(jobSkills, { onConflict: 'job_id,skill_id' })

  if (error) {
    console.error('Error saving skills:', error)
    return { success: false, count: 0 }
  }

  return { success: true, count: jobSkills.length }
}
