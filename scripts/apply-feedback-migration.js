#!/usr/bin/env node

/**
 * Apply feedback table migration
 * Adds route_path and feedback_level columns to feedback table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = `
-- Enhance feedback table with route context and feedback level
-- Migration: 20251009000000_enhance_feedback_table.sql

-- Add route_path column to track where feedback was submitted
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS route_path TEXT;

-- Add feedback_level column to store numeric rating (1-5 scale)
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS feedback_level INTEGER CHECK (feedback_level BETWEEN 1 AND 5);

-- Add index for querying by feedback level
CREATE INDEX IF NOT EXISTS idx_feedback_level ON public.feedback(feedback_level);

-- Add index for querying by route path
CREATE INDEX IF NOT EXISTS idx_feedback_route_path ON public.feedback(route_path);

-- Add comment explaining emoji to level mapping
COMMENT ON COLUMN public.feedback.feedback_level IS 'Feedback level: 1=😟 (negative), 3=😐 (neutral), 5=😍 (positive)';
COMMENT ON COLUMN public.feedback.route_path IS 'Route path where feedback was submitted (e.g., /jobs, /programs/123)';
`;

async function applyMigration() {
  console.log('🚀 Applying feedback table migration...\n');
  
  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });

    if (error) {
      // If exec_sql RPC doesn't exist, try direct query
      console.log('⚠️  exec_sql RPC not found, trying direct execution...\n');
      
      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX') || statement.includes('COMMENT ON')) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          if (stmtError) {
            console.error(`❌ Error: ${stmtError.message}`);
          } else {
            console.log('✅ Success\n');
          }
        }
      }
    } else {
      console.log('✅ Migration applied successfully!\n');
    }

    // Verify the columns exist
    console.log('🔍 Verifying migration...\n');
    const { data: testData, error: testError } = await supabase
      .from('feedback')
      .select('route_path, feedback_level')
      .limit(1);

    if (testError) {
      console.error('❌ Verification failed:', testError.message);
      console.log('\n⚠️  Migration may need to be applied manually via Supabase Dashboard');
      console.log('📋 Copy the SQL from: supabase/migrations/20251009000000_enhance_feedback_table.sql');
    } else {
      console.log('✅ Migration verified! New columns are accessible.\n');
      console.log('📊 Feedback widget is now fully functional with:');
      console.log('   - Route tracking (route_path)');
      console.log('   - Numeric ratings (feedback_level: 1-5)');
      console.log('   - Emoji mapping (😟=1, 😐=3, 😍=5)\n');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n📋 Please apply migration manually via Supabase Dashboard:');
    console.log('   1. Go to SQL Editor');
    console.log('   2. Copy SQL from: supabase/migrations/20251009000000_enhance_feedback_table.sql');
    console.log('   3. Execute the SQL\n');
  }

  process.exit(0);
}

applyMigration();
