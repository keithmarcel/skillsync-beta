#!/usr/bin/env node

/**
 * Check recent feedback submissions
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFeedback() {
  console.log('🔍 Fetching recent feedback submissions...\n');

  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('📭 No feedback submissions found\n');
      process.exit(0);
    }

    console.log(`📊 Found ${data.length} recent submission(s):\n`);
    console.log('='.repeat(80));

    data.forEach((item, index) => {
      console.log(`\n#${index + 1} - Submission ID: ${item.id}`);
      console.log('-'.repeat(80));
      console.log(`📅 Date:           ${new Date(item.created_at).toLocaleString()}`);
      console.log(`😊 Sentiment:      ${item.sentiment}`);
      console.log(`⭐ Level:          ${item.feedback_level || 'N/A'} / 5`);
      console.log(`📍 Route:          ${item.route_path || 'N/A'}`);
      console.log(`👤 User ID:        ${item.user_id || 'Anonymous'}`);
      console.log(`📧 Email:          ${item.user_email || 'N/A'}`);
      console.log(`💬 Message:        ${item.message || '(no comment)'}`);
      console.log('-'.repeat(80));
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Feedback data is being captured correctly!\n');

    // Show emoji mapping
    console.log('📊 Emoji to Level Mapping:');
    console.log('   😟 Negative = 1');
    console.log('   😐 Neutral  = 3');
    console.log('   😍 Positive = 5\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  process.exit(0);
}

checkFeedback();
