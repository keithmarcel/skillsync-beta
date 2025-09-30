#!/usr/bin/env node

// Check current database status
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkStatus() {
  console.log('🔍 CHECKING CURRENT DATABASE STATUS...\n');

  try {
    // Check if is_published column exists
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, is_published, is_trusted_partner')
      .limit(3);

    if (error && error.message.includes('is_published')) {
      console.log('❌ STATUS: is_published column does NOT exist');
      console.log('💡 SOLUTION: Run the SQL migration in FIX_COMPANY_PUBLISHING.sql');
      return;
    }

    if (error) {
      console.error('❌ Unexpected error:', error);
      return;
    }

    console.log('✅ STATUS: is_published column exists');

    // Check current values
    const publishedCount = companies.filter(c => c.is_published === true).length;
    const unpublishedCount = companies.filter(c => c.is_published === false).length;
    const nullCount = companies.filter(c => c.is_published === null).length;

    console.log(`📊 Current status:`);
    console.log(`   Published: ${publishedCount}`);
    console.log(`   Unpublished: ${unpublishedCount}`);
    console.log(`   NULL: ${nullCount}`);

    if (unpublishedCount > 0) {
      console.log('\n⚠️  Some companies are unpublished - this explains why they don\'t show in the app');
    }

  } catch (err) {
    console.error('❌ Error checking status:', err);
  }
}

checkStatus().catch(console.error);
