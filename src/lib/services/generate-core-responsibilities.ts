import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCoreResponsibilities(
  occupationTitle: string,
  socCode: string,
  tasks?: any[],
  skills?: any[]
): Promise<string[]> {
  try {
    const tasksContext = tasks?.slice(0, 5).map(t => t.TaskDescription).join('\n- ') || 'Not available';
    const skillsContext = skills?.slice(0, 8).map(s => s.skill?.name || s.name).join(', ') || 'Not available';

    const prompt = `Generate 5-7 core responsibilities for a ${occupationTitle} (SOC: ${socCode}).

Context:
- Key tasks: ${tasksContext}
- Required skills: ${skillsContext}

Format as concise bullet points (without bullet symbols) focusing on:
1. Key accountabilities and outcomes
2. Strategic responsibilities beyond daily tasks
3. Leadership or coordination duties
4. Quality and compliance responsibilities
5. Continuous improvement activities

Return ONLY the responsibility statements, one per line, without numbering or bullets.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in occupational analysis and job descriptions. Generate professional, accurate core responsibilities.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';
    const responsibilities = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+\./))
      .slice(0, 7);

    return responsibilities;
  } catch (error) {
    console.error('Error generating core responsibilities:', error);
    return [];
  }
}
