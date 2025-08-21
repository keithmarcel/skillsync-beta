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
    const { assessment_id } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get assessment data with skill results
    const { data: assessment } = await supabaseClient
      .from('assessments')
      .select(`
        *,
        jobs(title, job_kind),
        assessment_skill_results(
          score_pct,
          band,
          skills(name)
        )
      `)
      .eq('id', assessment_id)
      .single()

    if (!assessment) {
      throw new Error('Assessment not found')
    }

    // Prepare data for AI summary
    const skillResults = assessment.assessment_skill_results
    const proficientSkills = skillResults.filter(r => r.band === 'proficient')
    const buildingSkills = skillResults.filter(r => r.band === 'building')
    const needsDevSkills = skillResults.filter(r => r.band === 'needs_dev')

    const summaryPrompt = `
    Generate a 2-3 sentence encouraging summary for a user's skills assessment results:
    
    Job: ${assessment.jobs.title} (${assessment.jobs.job_kind})
    Overall Readiness: ${assessment.readiness_pct}%
    Status: ${assessment.status_tag}
    
    Proficient Skills (${proficientSkills.length}): ${proficientSkills.map(s => s.skills.name).join(', ')}
    Building Skills (${buildingSkills.length}): ${buildingSkills.map(s => s.skills.name).join(', ')}
    Needs Development (${needsDevSkills.length}): ${needsDevSkills.map(s => s.skills.name).join(', ')}
    
    Be encouraging and specific about their strengths while acknowledging areas for growth.
    `

    // OpenAI API call for summary
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL_SUMMARY') || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a career coach providing encouraging feedback on skills assessments. Be positive, specific, and actionable in 2-3 sentences.'
          },
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    })

    const openaiData = await openaiResponse.json()
    const summary = openaiData.choices[0].message.content

    return new Response(
      JSON.stringify({ 
        summary,
        assessment_data: {
          readiness_pct: assessment.readiness_pct,
          status_tag: assessment.status_tag,
          proficient_count: proficientSkills.length,
          building_count: buildingSkills.length,
          needs_dev_count: needsDevSkills.length
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
