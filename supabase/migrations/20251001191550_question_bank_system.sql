-- Question Bank System Migration
-- Enables dynamic assessment assembly with anti-cheating features

-- Add question bank metadata to quiz_questions
ALTER TABLE quiz_questions
ADD COLUMN IF NOT EXISTS is_bank_question BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- Track user question history for anti-repeat
CREATE TABLE IF NOT EXISTS user_question_history (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  seen_at TIMESTAMP DEFAULT NOW(),
  was_correct BOOLEAN,
  PRIMARY KEY (user_id, question_id, assessment_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_questions ON user_question_history(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_question_last_used ON quiz_questions(last_used_at) WHERE is_bank_question = true;
CREATE INDEX IF NOT EXISTS idx_bank_questions ON quiz_questions(section_id, is_bank_question) WHERE is_bank_question = true;

-- Comments for documentation
COMMENT ON COLUMN quiz_questions.is_bank_question IS 'True if question is part of question bank (not tied to specific assessment)';
COMMENT ON COLUMN quiz_questions.times_used IS 'Number of times this question has been used in assessments';
COMMENT ON COLUMN quiz_questions.last_used_at IS 'Last time this question was included in an assessment';
COMMENT ON TABLE user_question_history IS 'Tracks which questions users have seen to prevent repetition';
