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
    const { job_id, skills_count = 5 } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get job with associated skills
    const { data: job } = await supabaseClient
      .from('jobs')
      .select(`
        *,
        job_skills(
          weight,
          skills(id, name, description, category)
        )
      `)
      .eq('id', job_id)
      .single()

    if (!job) {
      throw new Error('Job not found')
    }

    // Get top skills by weight
    const topSkills = job.job_skills
      .sort((a, b) => (b.weight || 1) - (a.weight || 1))
      .slice(0, skills_count)

    // Generate quiz questions for each skill
    const quizSections = []
    
    for (const jobSkill of topSkills) {
      const skill = jobSkill.skills
      
      const questionPrompt = `
      Generate 3 multiple choice questions to assess proficiency in: ${skill.name}
      
      Context: ${skill.description || 'No description available'}
      Category: ${skill.category || 'General'}
      Job Role: ${job.title}
      
      Requirements:
      - Questions should test practical knowledge and application
      - Include 4 answer choices (A, B, C, D)
      - Vary difficulty levels (1 easy, 1 medium, 1 hard)
      - Make questions relevant to ${job.title} role
      
      Return JSON format:
      {
        "questions": [
          {
            "stem": "Question text here?",
            "choices": {"A": "Choice A", "B": "Choice B", "C": "Choice C", "D": "Choice D"},
            "answer_key": "A",
            "difficulty": "easy"
          }
        ]
      }
      `

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
              content: 'You are an expert at creating skills assessment questions. Generate practical, job-relevant multiple choice questions that accurately test competency levels.'
            },
            {
              role: 'user',
              content: questionPrompt
            }
          ],
          temperature: 0.3,
        }),
      })

      const openaiData = await openaiResponse.json()
      const questionsData = JSON.parse(openaiData.choices[0].message.content)
      
      quizSections.push({
        skill_id: skill.id,
        skill_name: skill.name,
        questions: questionsData.questions
      })
    }

    return new Response(
      JSON.stringify({ 
        job_title: job.title,
        quiz_sections: quizSections,
        total_questions: quizSections.reduce((sum, section) => sum + section.questions.length, 0)
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
