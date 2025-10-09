import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateRelatedJobTitles(
  occupationTitle: string,
  socCode: string
): Promise<string[]> {
  try {
    const prompt = `Generate 6-8 related job titles for "${occupationTitle}" (SOC: ${socCode}).

Include variations in:
1. Seniority levels (Junior, Senior, Lead, Principal)
2. Specializations within the field
3. Industry-specific variations
4. Alternative common titles for the same role

Return ONLY the job titles, one per line, without numbering or explanations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in occupational classifications and job market analysis. Generate accurate, relevant job titles.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '';
    const titles = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+\./))
      .slice(0, 8);

    return titles;
  } catch (error) {
    console.error('Error generating related job titles:', error);
    return [];
  }
}
