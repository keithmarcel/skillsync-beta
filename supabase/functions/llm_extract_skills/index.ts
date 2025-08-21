import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cache for alias dictionary (24h TTL)
let aliasCache: Map<string, string> | null = null
let aliasCacheExpiry = 0

async function loadAliasCache(supabaseClient: any): Promise<Map<string, string>> {
  const now = Date.now()
  
  // Return cached data if still valid
  if (aliasCache && now < aliasCacheExpiry) {
    return aliasCache
  }

  console.log('Loading alias dictionary from database...')
  
  const { data: aliases, error } = await supabaseClient
    .from('skill_aliases')
    .select('alias, skill_id')

  if (error) {
    console.error('Error loading aliases:', error)
    return new Map()
  }

  aliasCache = new Map()
  aliases?.forEach((row: any) => {
    aliasCache!.set(row.alias.toLowerCase(), row.skill_id)
  })

  // Cache for 24 hours
  aliasCacheExpiry = now + (24 * 60 * 60 * 1000)
  
  console.log(`Loaded ${aliasCache.size} aliases into cache`)
  return aliasCache
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractSkillsFromText(text: string, aliasMap: Map<string, string>, skillsMap: Map<string, string>): Set<string> {
  const foundSkills = new Set<string>()
  const normalizedText = normalizeText(text)
  const words = normalizedText.split(' ')
  
  // Check for exact skill name matches (word boundaries)
  for (const [skillName, skillId] of skillsMap) {
    const regex = new RegExp(`\\b${skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (regex.test(normalizedText)) {
      foundSkills.add(skillId)
    }
  }
  
  // Check for alias matches if Lightcast aliases are enabled
  const useLightcastAliases = Deno.env.get('NEXT_PUBLIC_USE_LIGHTCAST_ALIASES') === 'true'
  if (useLightcastAliases && aliasMap.size > 0) {
    for (const [alias, skillId] of aliasMap) {
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (regex.test(normalizedText)) {
        foundSkills.add(skillId)
      }
    }
  }
  
  return foundSkills
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resume_text, job_id, assessment_id } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Load alias cache and skills data
    const aliasMap = await loadAliasCache(supabaseClient)
    
    const { data: dbSkills } = await supabaseClient
      .from('skills')
      .select('id, name')

    if (!dbSkills) {
      throw new Error('Failed to load skills from database')
    }

    // Create skills name map for exact matching
    const skillsMap = new Map<string, string>()
    dbSkills.forEach(skill => {
      skillsMap.set(skill.name.toLowerCase(), skill.id)
    })

    // Step 1: Try exact name and alias matching first
    const directMatches = extractSkillsFromText(resume_text, aliasMap, skillsMap)
    console.log(`Found ${directMatches.size} direct skill matches`)

    let skillMatches: any[] = []
    const matchedSkillIds = new Set<string>()

    // Process direct matches
    for (const skillId of directMatches) {
      const skill = dbSkills.find(s => s.id === skillId)
      if (skill && !matchedSkillIds.has(skillId)) {
        skillMatches.push({
          skill_id: skillId,
          skill_name: skill.name,
          score_pct: 85, // Higher score for direct matches
          band: 'proficient',
          match_type: 'direct'
        })
        matchedSkillIds.add(skillId)
      }
    }

    // Step 2: If we have few matches, fall back to LLM extraction
    const shouldUseLLM = skillMatches.length < 3 || !directMatches.size
    let llmExtractedSkills: string[] = []

    if (shouldUseLLM) {
      console.log('Using LLM fallback for skill extraction')
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: Deno.env.get('OPENAI_MODEL_EXTRACTOR') || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Extract skills from the resume text. Return a JSON array of skill names that match common industry standards. Focus on technical skills, soft skills, and certifications. Be specific and use standard skill names.`
            },
            {
              role: 'user',
              content: resume_text
            }
          ],
          temperature: 0.1,
        }),
      })

      const openaiData = await openaiResponse.json()
      llmExtractedSkills = JSON.parse(openaiData.choices[0].message.content)

      // Match LLM-extracted skills to database
      for (const extractedSkill of llmExtractedSkills) {
        const match = dbSkills.find(skill => 
          skill.name.toLowerCase().includes(extractedSkill.toLowerCase()) ||
          extractedSkill.toLowerCase().includes(skill.name.toLowerCase())
        )
        if (match && !matchedSkillIds.has(match.id)) {
          skillMatches.push({
            skill_id: match.id,
            skill_name: match.name,
            score_pct: 75, // Lower score for LLM matches
            band: 'building',
            match_type: 'llm'
          })
          matchedSkillIds.add(match.id)
        }
      }
    }

    // Store extracted skills in resume_features table
    if (assessment_id) {
      await supabaseClient
        .from('resume_features')
        .upsert({
          assessment_id,
          extracted_skills: llmExtractedSkills,
          direct_matches: Array.from(directMatches),
          notes: `Found ${directMatches.size} direct matches, ${llmExtractedSkills.length} LLM extracted skills`
        })
    }

    // Store skill results if assessment_id provided
    if (assessment_id && skillMatches.length > 0) {
      const skillResults = skillMatches.map(match => ({
        assessment_id,
        skill_id: match.skill_id,
        score_pct: match.score_pct,
        band: match.band
      }))

      await supabaseClient
        .from('assessment_skill_results')
        .upsert(skillResults)

      // Update assessment with overall readiness
      const avgReadiness = skillMatches.reduce((sum, match) => sum + match.score_pct, 0) / skillMatches.length
      const statusTag = avgReadiness >= 85 ? 'role_ready' : avgReadiness >= 50 ? 'close_gaps' : 'needs_development'

      await supabaseClient
        .from('assessments')
        .update({
          readiness_pct: avgReadiness,
          status_tag: statusTag
        })
        .eq('id', assessment_id)
    }

    return new Response(
      JSON.stringify({ 
        extracted_skills: llmExtractedSkills,
        direct_matches: Array.from(directMatches),
        skill_matches: skillMatches,
        readiness_pct: skillMatches.length > 0 ? skillMatches.reduce((sum, match) => sum + match.score_pct, 0) / skillMatches.length : 0,
        match_summary: {
          direct_matches: skillMatches.filter(m => m.match_type === 'direct').length,
          llm_matches: skillMatches.filter(m => m.match_type === 'llm').length,
          total_matches: skillMatches.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
