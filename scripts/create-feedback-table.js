/**
 * Create feedback table in remote database
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createFeedbackTable() {
  console.log('🔧 Creating feedback table...\n')

  try {
    // Create feedback table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create feedback table for user feedback submissions
        CREATE TABLE IF NOT EXISTS public.feedback (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          user_email TEXT,
          sentiment VARCHAR NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
          message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Add index for querying feedback by user
        CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);

        -- Add index for querying by created_at
        CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

        -- Enable RLS
        ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback;
        DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;
        DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;

        -- Policy: Users can insert their own feedback
        CREATE POLICY "Users can insert their own feedback"
          ON public.feedback
          FOR INSERT
          TO authenticated
          WITH CHECK (auth.uid() = user_id);

        -- Policy: Users can view their own feedback
        CREATE POLICY "Users can view their own feedback"
          ON public.feedback
          FOR SELECT
          TO authenticated
          USING (auth.uid() = user_id);

        -- Policy: Admins can view all feedback
        CREATE POLICY "Admins can view all feedback"
          ON public.feedback
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.profiles
              WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
            )
          );
      `
    })

    if (error) {
      // If exec_sql doesn't exist, try direct table creation
      const { error: createError } = await supabase
        .from('feedback')
        .select('id')
        .limit(0)

      if (createError && createError.code === '42P01') {
        console.log('⚠️  Table does not exist. Creating via direct SQL...')
        
        // Use raw SQL query
        const sql = `
          CREATE TABLE IF NOT EXISTS public.feedback (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            user_email TEXT,
            sentiment VARCHAR NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
            message TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `
        
        console.log('✅ Please run this SQL in Supabase Dashboard SQL Editor:')
        console.log('\n' + sql + '\n')
        console.log('Then run the migration file: 20251002182500_create_feedback_table.sql')
        return
      }
    }

    console.log('✅ Feedback table created successfully!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n📝 Please apply the migration manually:')
    console.log('Run: supabase db push')
    console.log('Or apply: supabase/migrations/20251002182500_create_feedback_table.sql')
  }
}

createFeedbackTable()
