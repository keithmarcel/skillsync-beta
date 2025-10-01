const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearQuizzes() {
  console.log('🗑️  Clearing all quiz data...\n');

  try {
    // 1. Delete quiz responses
    const { error: responsesError } = await supabase
      .from('quiz_responses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (responsesError) {
      console.error('Error deleting quiz responses:', responsesError);
    } else {
      console.log('✅ Deleted all quiz responses');
    }

    // 2. Delete quiz questions
    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (questionsError) {
      console.error('Error deleting quiz questions:', questionsError);
    } else {
      console.log('✅ Deleted all quiz questions');
    }

    // 3. Delete quiz sections
    const { error: sectionsError } = await supabase
      .from('quiz_sections')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (sectionsError) {
      console.error('Error deleting quiz sections:', sectionsError);
    } else {
      console.log('✅ Deleted all quiz sections');
    }

    // 4. Delete assessments
    const { error: assessmentsError } = await supabase
      .from('assessments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (assessmentsError) {
      console.error('Error deleting assessments:', assessmentsError);
    } else {
      console.log('✅ Deleted all assessments');
    }

    // 5. Delete assessment skill results
    const { error: skillResultsError } = await supabase
      .from('assessment_skill_results')
      .delete()
      .neq('assessment_id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (skillResultsError) {
      console.error('Error deleting assessment skill results:', skillResultsError);
    } else {
      console.log('✅ Deleted all assessment skill results');
    }

    // 6. Delete quizzes
    const { error: quizzesError } = await supabase
      .from('quizzes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (quizzesError) {
      console.error('Error deleting quizzes:', quizzesError);
    } else {
      console.log('✅ Deleted all quizzes');
    }

    console.log('\n✅ All quiz and assessment data cleared!');
    console.log('You can now generate fresh quizzes.');

  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

clearQuizzes();
