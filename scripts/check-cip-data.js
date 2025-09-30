#!/usr/bin/env node

/**
 * Check CIP codes and crosswalk data in database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCipData() {
  console.log('🔍 Checking CIP data in database...\n');

  // Check CIP codes
  const { data: cipCodes, error: cipError } = await supabase
    .from('cip_codes')
    .select('*')
    .limit(5);

  if (cipError) {
    console.error('❌ Error fetching CIP codes:', cipError);
  } else {
    console.log(`✅ CIP Codes table: ${cipCodes?.length || 0} sample records`);
    if (cipCodes && cipCodes.length > 0) {
      console.log('Sample:', cipCodes[0]);
    }
  }

  // Check crosswalk
  const { data: crosswalk, error: crosswalkError } = await supabase
    .from('cip_soc_crosswalk')
    .select('*')
    .limit(5);

  if (crosswalkError) {
    console.error('❌ Error fetching crosswalk:', crosswalkError);
  } else {
    console.log(`\n✅ CIP-SOC Crosswalk table: ${crosswalk?.length || 0} sample records`);
    if (crosswalk && crosswalk.length > 0) {
      console.log('Sample:', crosswalk[0]);
    }
  }

  // Check programs with CIP codes
  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select('id, name, cip_code')
    .not('cip_code', 'is', null)
    .limit(5);

  if (programsError) {
    console.error('❌ Error fetching programs:', programsError);
  } else {
    console.log(`\n✅ Programs with CIP codes: ${programs?.length || 0} sample records`);
    if (programs && programs.length > 0) {
      console.log('Sample:', programs[0]);
    }
  }

  process.exit(0);
}

checkCipData().catch(console.error);
