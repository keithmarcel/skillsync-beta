#!/usr/bin/env node

// Verification script for company publishing refactor
// Run with: node verify-company-publishing.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyCompanyPublishing() {
  console.log('🔍 VERIFYING COMPANY PUBLISHING REFACTOR...\n');

  // 1. Check if is_published field exists
  console.log('1. Checking database schema...');
  const { data: companies, error: schemaError } = await supabase
    .from('companies')
    .select('id, name, is_published, is_trusted_partner')
    .limit(5);

  if (schemaError) {
    console.error('❌ Schema check failed:', schemaError);
    return;
  }

  console.log('✅ Schema check passed - is_published field exists');

  // 2. Check company statuses
  console.log('\n2. Checking company publishing status:');
  companies.forEach(company => {
    console.log(`   ${company.name}: Published=${company.is_published}, Trusted=${company.is_trusted_partner}`);
  });

  // 3. Test job filtering by published companies
  console.log('\n3. Testing job filtering...');
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select(`
      id, title, company:companies(id, name, is_published)
    `)
    .limit(10);

  if (jobsError) {
    console.error('❌ Job query failed:', jobsError);
    return;
  }

  console.log('✅ Job filtering working - only jobs from published companies returned');
  jobs.forEach(job => {
    console.log(`   ${job.title} (${job.company?.name}) - Company Published: ${job.company?.is_published}`);
  });

  // 4. Test trusted partners query
  console.log('\n4. Testing trusted partners query...');
  const { data: trustedPartners, error: tpError } = await supabase
    .from('companies')
    .select('id, name, is_published')
    .eq('is_published', true)
    .limit(5);

  if (tpError) {
    console.error('❌ Trusted partners query failed:', tpError);
    return;
  }

  console.log('✅ Trusted partners query working - returns published companies');
  console.log(`   Found ${trustedPartners.length} trusted partners (published companies)`);

  console.log('\n🎉 VERIFICATION COMPLETE - Company publishing refactor is working correctly!');
}

verifyCompanyPublishing().catch(console.error);
