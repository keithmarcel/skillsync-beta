#!/usr/bin/env node

/**
 * Simple migration applier using Supabase SQL execution
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing credentials. Need:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.log('\n📋 Apply migration manually via Supabase Dashboard:');
  console.log('   1. Go to SQL Editor');
  console.log('   2. Run this SQL:\n');
  
  const migrationPath = join(__dirname, '../supabase/migrations/20251009000000_enhance_feedback_table.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(sql);
  
  process.exit(1);
}

const migrationSQL = `
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS route_path TEXT;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS feedback_level INTEGER CHECK (feedback_level BETWEEN 1 AND 5);
CREATE INDEX IF NOT EXISTS idx_feedback_level ON public.feedback(feedback_level);
CREATE INDEX IF NOT EXISTS idx_feedback_route_path ON public.feedback(route_path);
`;

async function applyMigration() {
  console.log('🚀 Applying feedback migration...\n');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ query: migrationSQL })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log('✅ Migration applied successfully!\n');
    console.log('🎉 Feedback widget is now fully functional with:');
    console.log('   - Route tracking (route_path)');
    console.log('   - Numeric ratings (feedback_level: 1-5)');
    console.log('   - Emoji mapping (😟=1, 😐=3, 😍=5)\n');

  } catch (err) {
    console.error('❌ Could not apply via API:', err.message);
    console.log('\n📋 Please apply manually via Supabase Dashboard SQL Editor:\n');
    console.log(migrationSQL);
    console.log('\n');
  }

  process.exit(0);
}

applyMigration();
