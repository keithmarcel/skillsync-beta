import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Job title is required' },
        { status: 400 }
      )
    }

    const prompt = `You are an O*NET SOC code classification expert. Analyze this job and suggest the most appropriate SOC code.

Job Title: ${title}
Description: ${description || 'Not provided'}

Return JSON with this exact structure:
{
  "soc_code": "XX-XXXX.XX",
  "soc_title": "Official O*NET title",
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation of why this SOC code is the best match",
  "alternatives": [
    {
      "soc_code": "XX-XXXX.XX",
      "title": "Alternative O*NET title",
      "reason": "Why this might also fit"
    }
  ]
}

IMPORTANT:
- Use real O*NET SOC codes in XX-XXXX.XX format (e.g., 15-1252.00)
- Consider primary job duties, required skills, education level, and industry
- Provide 2-3 alternatives if applicable
- Confidence levels:
  * high: Clear match with strong alignment
  * medium: Good match but some ambiguity
  * low: Best guess but significant uncertainty`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an O*NET SOC classification expert. You provide accurate SOC code recommendations based on job titles and descriptions. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const suggestion = JSON.parse(response.choices[0].message.content || '{}')

    // Validate the SOC code exists in our database
    const { data: socExists } = await supabase
      .from('jobs')
      .select('soc_code')
      .eq('soc_code', suggestion.soc_code)
      .limit(1)
      .single()

    // Add validation flag
    suggestion.validated = !!socExists

    return NextResponse.json(suggestion)
  } catch (error) {
    console.error('SOC suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate SOC suggestion' },
      { status: 500 }
    )
  }
}
