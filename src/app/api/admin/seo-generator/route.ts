import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      company, 
      category,
      location_city,
      location_state,
      median_wage_usd,
      short_desc,
      long_desc,
      key_responsibilities,
      requirements,
      benefits,
      skills,
      core_responsibilities,
      tasks,
      tools_and_technology
    } = body;

    // Build context from all available data
    const context = `
Job Title: ${title || 'Not provided'}
Company: ${company || 'Not provided'}
Category: ${category || 'Not provided'}
Location: ${location_city}, ${location_state}
Salary: ${median_wage_usd ? `$${median_wage_usd.toLocaleString()}` : 'Not provided'}

Short Description: ${short_desc || 'Not provided'}

Long Description: ${long_desc || 'Not provided'}

Key Responsibilities: ${key_responsibilities || 'Not provided'}

Requirements: ${requirements || 'Not provided'}

Benefits: ${benefits || 'Not provided'}

Skills: ${skills && skills.length > 0 ? skills.map((s: any) => s.name).join(', ') : 'Not provided'}

Core Responsibilities: ${core_responsibilities && Array.isArray(core_responsibilities) ? core_responsibilities.join(', ') : 'Not provided'}

Day-to-Day Tasks: ${tasks && Array.isArray(tasks) ? tasks.map((t: any) => t.task || t).join(', ') : 'Not provided'}

Tools & Technology: ${tools_and_technology && Array.isArray(tools_and_technology) ? tools_and_technology.map((t: any) => t.name || t).join(', ') : 'Not provided'}
`;

    const prompt = `You are an expert SEO specialist. Based on the following job posting data, generate optimized SEO metadata that follows best practices.

${context}

Generate the following SEO fields in JSON format:

1. **seo_title**: An engaging, keyword-rich title (50-60 characters max) that includes the job title, company name, and location. Format: "[Job Title] at [Company] | [Location]"

2. **meta_description**: A compelling description (150-160 characters max) that summarizes the role, highlights key benefits, and includes a call-to-action. Should entice clicks from search results.

3. **og_title**: A social media optimized title (60-90 characters) that's slightly more engaging than the SEO title. Can be more conversational.

4. **og_description**: A social media description (150-200 characters) that's more engaging and benefit-focused than the meta description. Should work well when shared on LinkedIn, Facebook, etc.

5. **slug**: A URL-friendly slug using lowercase, hyphens, no special characters. Format: "job-title-company-location"

Best practices to follow:
- Use action words and power words
- Include location for local SEO
- Highlight unique selling points
- Keep within character limits
- Make it compelling and click-worthy
- Use proper grammar and punctuation
- Include salary range if competitive
- Mention company name for brand recognition

Return ONLY valid JSON with these exact keys: seo_title, meta_description, og_title, og_description, slug

Example format:
{
  "seo_title": "Senior Software Engineer at TechCorp | Tampa, FL",
  "meta_description": "Join TechCorp as a Senior Software Engineer in Tampa. Work with cutting-edge tech, competitive salary, and great benefits. Apply now!",
  "og_title": "We're Hiring: Senior Software Engineer at TechCorp 🚀",
  "og_description": "Ready to level up your career? Join our innovative team in Tampa and work on exciting projects with the latest technologies. Competitive pay and amazing benefits!",
  "slug": "senior-software-engineer-techcorp-tampa"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const seoData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data: seoData,
    });
  } catch (error: any) {
    console.error('SEO generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate SEO metadata',
      },
      { status: 500 }
    );
  }
}
