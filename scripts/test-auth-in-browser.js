// Run this in your browser console while logged in to debug auth issues
// Copy and paste this entire script into the browser console at localhost:3000

console.log('🔍 Testing Auth State...\n');

// Check if Supabase client is available
const checkSupabase = async () => {
  try {
    // Get the session from localStorage
    const authKey = Object.keys(localStorage).find(key => key.includes('supabase.auth.token'));
    
    if (authKey) {
      const authData = JSON.parse(localStorage.getItem(authKey));
      console.log('✅ Found auth session in localStorage');
      console.log('User ID:', authData?.currentSession?.user?.id);
      console.log('Email:', authData?.currentSession?.user?.email);
      console.log('Session expires:', new Date(authData?.currentSession?.expires_at * 1000).toLocaleString());
    } else {
      console.log('❌ No auth session found in localStorage');
      console.log('You may need to sign in again');
    }
    
    // Check React state (if available)
    console.log('\n📋 Checking React Auth Context...');
    console.log('Try opening React DevTools and look for AuthProvider');
    console.log('Check the profile state for:');
    console.log('  - role: should be "super_admin"');
    console.log('  - admin_role: should be "super_admin"');
    console.log('  - isAdmin: should be true');
    console.log('  - isSuperAdmin: should be true');
    
  } catch (error) {
    console.error('Error checking auth:', error);
  }
};

checkSupabase();

console.log('\n💡 If admin tools are not showing:');
console.log('1. Clear browser cache and localStorage');
console.log('2. Sign out and sign back in');
console.log('3. Check that useAuth hook is returning isAdmin=true');
