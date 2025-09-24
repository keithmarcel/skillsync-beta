const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use service role for admin tasks like user creation/deletion
const adminSupabase = createClient(supabaseUrl, serviceKey);

async function runRLSEndToEndTest() {
  console.log('🚀 Starting RLS End-to-End Test...');

  const testId = Date.now();
  const user1Email = `test-user-1-${testId}@example.com`;
  const user2Email = `test-user-2-${testId}@example.com`;
  const password = 'password123';
  const favoriteJobId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // A real job ID from the DB

  let user1, user2;

  try {
    // 1. Create Test Users
    console.log(`\n[1/5] Creating test users...`);
    const { data: user1Data, error: user1Error } = await adminSupabase.auth.admin.createUser({
      email: user1Email,
      password: password,
      email_confirm: true,
    });
    if (user1Error) throw new Error(`Failed to create user 1: ${user1Error.message}`);
    user1 = user1Data.user;
    console.log(`✅ User 1 created: ${user1.email} (ID: ${user1.id})`);

    const { data: user2Data, error: user2Error } = await adminSupabase.auth.admin.createUser({
      email: user2Email,
      password: password,
      email_confirm: true,
    });
    if (user2Error) throw new Error(`Failed to create user 2: ${user2Error.message}`);
    user2 = user2Data.user;
    console.log(`✅ User 2 created: ${user2.email} (ID: ${user2.id})`);

    // 2. Insert a Favorite for User 1 (as admin)
    console.log(`\n[2/5] Inserting favorite for User 1...`);
    const { error: insertError } = await adminSupabase.from('favorites').insert({
      user_id: user1.id,
      entity_kind: 'job',
      entity_id: favoriteJobId,
    });
    if (insertError) throw new Error(`Failed to insert favorite: ${insertError.message}`);
    console.log(`✅ Favorite inserted for User 1.`);

    // 3. Perform Read Tests
    console.log(`\n[3/5] Performing read tests...`);

    // Test A: Anonymous client
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: anonData, error: anonError } = await anonClient
      .from('favorites')
      .select('*')
      .eq('user_id', user1.id);
    console.log(`  - Test A (Anonymous): Fetching User 1's favorite...`);
    if (anonData && anonData.length > 0) {
      console.error(`  ❌ FAILED: Anonymous user could read data.`);
    } else {
      console.log(`  ✅ PASSED: Anonymous user was blocked (as expected).`);
    }

    // Test B: Correct authenticated user
    const user1Client = createClient(supabaseUrl, anonKey);
    const { error: signIn1Error } = await user1Client.auth.signInWithPassword({ email: user1Email, password });
    if (signIn1Error) throw new Error(`User 1 sign-in failed: ${signIn1Error.message}`);
    const { data: user1FavData, error: user1FavError } = await user1Client
      .from('favorites')
      .select('*')
      .eq('user_id', user1.id);
    console.log(`  - Test B (Correct User): Fetching User 1's favorite...`);
    if (user1FavData && user1FavData.length > 0) {
      console.log(`  ✅ PASSED: Correct user could read their own data.`);
    } else {
      console.error(`  ❌ FAILED: Correct user could not read their own data.`, user1FavError || '');
    }

    // Test C: Incorrect authenticated user
    const user2Client = createClient(supabaseUrl, anonKey);
    const { error: signIn2Error } = await user2Client.auth.signInWithPassword({ email: user2Email, password });
    if (signIn2Error) throw new Error(`User 2 sign-in failed: ${signIn2Error.message}`);
    const { data: user2FavData, error: user2FavError } = await user2Client
      .from('favorites')
      .select('*')
      .eq('user_id', user1.id); // Attempting to read User 1's data
    console.log(`  - Test C (Incorrect User): User 2 fetching User 1's favorite...`);
    if (user2FavData && user2FavData.length > 0) {
      console.error(`  ❌ FAILED: Incorrect user could read other user's data.`);
    } else {
      console.log(`  ✅ PASSED: Incorrect user was blocked (as expected).`);
    }

  } catch (error) {
    console.error(`\n🚨 An error occurred during the test:`, error.message);
  } finally {
    // 4. & 5. Clean up
    console.log(`\n[4/5] Cleaning up favorite record...`);
    if (user1) {
      await adminSupabase.from('favorites').delete().eq('user_id', user1.id);
      console.log('✅ Favorite record deleted.');
    }
    console.log(`\n[5/5] Cleaning up test users...`);
    if (user1) {
      await adminSupabase.auth.admin.deleteUser(user1.id);
      console.log(`✅ User 1 deleted.`);
    }
    if (user2) {
      await adminSupabase.auth.admin.deleteUser(user2.id);
      console.log(`✅ User 2 deleted.`);
    }
    console.log('\n🏁 Test complete.');
  }
}

runRLSEndToEndTest();
