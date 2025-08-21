import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // OpenAI API call to extract skills
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
            content: `Extract skills from the resume text. Return a JSON array of skill names that match common industry standards. Focus on technical skills, soft skills, and certifications.`
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
    const extractedSkills = JSON.parse(openaiData.choices[0].message.content)

    // Store extracted skills in resume_features table
    if (assessment_id) {
      await supabaseClient
        .from('resume_features')
        .upsert({
          assessment_id,
          extracted_skills: extractedSkills,
          notes: `Extracted ${extractedSkills.length} skills from resume`
        })
    }

    // Match extracted skills to database skills and compute scores
    const { data: dbSkills } = await supabaseClient
      .from('skills')
      .select('id, name')

    const skillMatches = []
    for (const extractedSkill of extractedSkills) {
      const match = dbSkills?.find(skill => 
        skill.name.toLowerCase().includes(extractedSkill.toLowerCase()) ||
        extractedSkill.toLowerCase().includes(skill.name.toLowerCase())
      )
      if (match) {
        skillMatches.push({
          skill_id: match.id,
          skill_name: match.name,
          score_pct: 75, // Default score for resume-extracted skills
          band: 'building'
        })
      }
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
        extracted_skills: extractedSkills,
        skill_matches: skillMatches,
        readiness_pct: skillMatches.length > 0 ? skillMatches.reduce((sum, match) => sum + match.score_pct, 0) / skillMatches.length : 0
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
