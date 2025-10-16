-- Assessment Management Refactor - Phase 1: Question Types & Ordering
-- Adds support for multiple question types, answer examples, and drag-and-drop ordering

-- Add question_type column with 4 types
ALTER TABLE quiz_questions 
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'multiple_choice' 
CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'long_answer'));

-- Add good_answer_example for short_answer and long_answer questions
-- This is used by AI to score open-ended responses
ALTER TABLE quiz_questions 
ADD COLUMN IF NOT EXISTS good_answer_example TEXT;

-- Add max_length for answer validation
-- 200 chars for short_answer, 1000 for long_answer
ALTER TABLE quiz_questions 
ADD COLUMN IF NOT EXISTS max_length INTEGER DEFAULT 200;

-- Add display_order for drag-and-drop question reordering
ALTER TABLE quiz_questions 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add importance_level (1-5 scale matching job_skills)
ALTER TABLE quiz_questions
ADD COLUMN IF NOT EXISTS importance_level INTEGER DEFAULT 3 CHECK (importance_level BETWEEN 1 AND 5);

-- Add difficulty level (easy, medium, hard, expert)
ALTER TABLE quiz_questions
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert'));

-- Add options array for multiple choice questions (stored as JSONB)
ALTER TABLE quiz_questions
ADD COLUMN IF NOT EXISTS options JSONB;

-- Create index on display_order for efficient sorting
CREATE INDEX IF NOT EXISTS idx_quiz_questions_display_order 
ON quiz_questions(section_id, display_order);

-- Update existing questions to have sequential display_order
-- This ensures smooth transition for existing data
DO $$
DECLARE
  section_record RECORD;
  question_record RECORD;
  order_counter INTEGER;
BEGIN
  -- For each section, assign sequential order to questions
  FOR section_record IN 
    SELECT DISTINCT section_id FROM quiz_questions WHERE display_order = 0
  LOOP
    order_counter := 1;
    FOR question_record IN 
      SELECT id FROM quiz_questions 
      WHERE section_id = section_record.section_id 
      ORDER BY created_at
    LOOP
      UPDATE quiz_questions 
      SET display_order = order_counter 
      WHERE id = question_record.id;
      order_counter := order_counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Add display_order to quiz_sections for section ordering
ALTER TABLE quiz_sections
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add missing columns to quizzes table
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS required_proficiency_pct NUMERIC DEFAULT 90,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comment explaining the schema
COMMENT ON COLUMN quiz_questions.question_type IS 'Type of question: multiple_choice, true_false, short_answer, long_answer';
COMMENT ON COLUMN quiz_questions.good_answer_example IS 'Example answer for AI scoring (short_answer and long_answer only)';
COMMENT ON COLUMN quiz_questions.max_length IS 'Maximum character length for answer (200 for short_answer, 1000 for long_answer)';
COMMENT ON COLUMN quiz_questions.display_order IS 'Order for displaying questions (supports drag-and-drop reordering)';
COMMENT ON COLUMN quiz_questions.importance_level IS 'Importance level 1-5 (1=Optional, 2=Nice-to-have, 3=Helpful, 4=Important, 5=Critical)';
COMMENT ON COLUMN quiz_questions.difficulty IS 'Difficulty level: easy (0.8x), medium (1.0x), hard (1.5x), expert (2.0x)';
COMMENT ON COLUMN quiz_questions.options IS 'Answer options for multiple choice questions (array of 4 strings stored as JSONB)';
COMMENT ON COLUMN quiz_sections.display_order IS 'Order for displaying sections';
COMMENT ON COLUMN quizzes.title IS 'Assessment title';
COMMENT ON COLUMN quizzes.description IS 'Assessment description';
COMMENT ON COLUMN quizzes.status IS 'Assessment status: draft, published, or archived';
COMMENT ON COLUMN quizzes.required_proficiency_pct IS 'Required proficiency - minimum score to be considered qualified for this role (default 90%)';
