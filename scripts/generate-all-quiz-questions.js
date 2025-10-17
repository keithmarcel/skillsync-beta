/**
 * Generate AI questions for all Power Design quiz sections
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateAllQuestions() {
  console.log('🤖 Generating AI questions for all Power Design quizzes...\n');

  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Get all Power Design quizzes
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, title')
      .eq('company_id', 'e5848012-89df-449e-855a-1834e9389656');

    console.log(`Found ${quizzes.length} quizzes\n`);

    for (const quiz of quizzes) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 ${quiz.title}`);
      console.log(`${'='.repeat(60)}\n`);

      // Get sections for this quiz
      const { data: sections } = await supabase
        .from('quiz_sections')
        .select('id, skill:skills(id, name, category)')
        .eq('quiz_id', quiz.id)
        .order('order_index');

      console.log(`Found ${sections.length} sections\n`);

      for (const section of sections) {
        console.log(`  🔹 ${section.skill.name}`);

        // Check if questions already exist
        const { count: existingCount } = await supabase
          .from('quiz_questions')
          .select('*', { count: 'exact', head: true })
          .eq('section_id', section.id);

        if (existingCount > 0) {
          console.log(`     ✅ Already has ${existingCount} questions - skipping\n`);
          continue;
        }

        // Generate questions with AI
        const prompt = `Generate 5 multiple-choice questions to assess "${section.skill.name}" skill.

Context:
- Skill: ${section.skill.name}
- Category: ${section.skill.category || 'Professional'}
- Difficulty: Mix of intermediate and expert level
- Target: Working professionals

Requirements:
- Questions should test practical application and real-world scenarios
- Each question has 4 options (A, B, C, D)
- Only ONE correct answer per question
- Include brief explanation for correct answer
- Avoid repetitive questions - each must test different aspect
- Focus on job-relevant knowledge and skills

Return ONLY valid JSON array (no markdown, no code blocks):
[{
  "stem": "Question text here?",
  "choices": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
  "answer_key": "B",
  "explanation": "Brief explanation of why B is correct",
  "difficulty": "intermediate"
}]`;

        try {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
          });

          const content = response.choices[0].message.content.trim();
          // Remove markdown code blocks if present
          const jsonText = content.replace(/```json\n?|\n?```/g, '');
          const questions = JSON.parse(jsonText);

          // Insert questions into database
          const questionsToInsert = questions.map((q) => ({
            section_id: section.id,
            stem: q.stem,
            choices: q.choices,
            answer_key: q.answer_key,
            explanation: q.explanation,
            difficulty: q.difficulty || 'intermediate',
            points: 1
          }));

          const { error: insertError } = await supabase
            .from('quiz_questions')
            .insert(questionsToInsert);

          if (insertError) {
            console.error(`     ❌ Error inserting questions:`, insertError);
          } else {
            console.log(`     ✅ Generated ${questions.length} questions`);
          }

        } catch (error) {
          console.error(`     ❌ Error generating questions:`, error.message);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      console.log('');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 QUESTION GENERATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nAll quizzes now have AI-generated questions!');
    console.log('Ready to test the assessment experience!\n');

  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  }
}

generateAllQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
