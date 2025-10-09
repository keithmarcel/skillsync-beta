/**
 * Seed Power Design Invitations
 * 
 * Creates employer invitations from Power Design to your user
 * to demonstrate the invitation flow
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedInvitations() {
  try {
    console.log('🎯 Seeding Power Design invitations...\n');
    
    // Get your user ID (from console logs)
    const yourUserId = '72b464ef-1814-4942-b69e-2bdffd390e61';
    const { data: userData } = await supabase.auth.admin.getUserById(yourUserId);
    
    if (!userData || !userData.user) {
      console.error('❌ User not found');
      return;
    }
    
    const user = { id: userData.user.id, email: userData.user.email };
    console.log(`✓ Found user: ${user.email} (${user.id})\n`);
    
    // Get Power Design company
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .ilike('name', '%power design%')
      .single();
    
    if (!company) {
      console.error('❌ Power Design company not found');
      return;
    }
    
    console.log(`✓ Found company: ${company.name} (${company.id})\n`);
    
    // Get Power Design featured roles
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, application_url')
      .eq('company_id', company.id)
      .eq('job_kind', 'featured_role')
      .limit(3);
    
    if (!jobs || jobs.length === 0) {
      return;
    }
    
    console.log(`✓ Found ${jobs.length} featured roles\n`);
    
    // Get user's assessments (or use any assessment as placeholder)
    let { data: assessments } = await supabase
      .from('assessments')
      .select('id, job_id, proficiency_level, readiness_pct')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });
    
    // If no assessments, get any assessment as placeholder
    if (!assessments || assessments.length === 0) {
      console.log('⚠️  No assessments found for user, using placeholder assessments\n');
      const { data: anyAssessments } = await supabase
        .from('assessments')
        .select('id, job_id, proficiency_level, readiness_pct')
        .limit(3);
      assessments = anyAssessments && anyAssessments.length > 0 ? anyAssessments : null;
    } else {
      console.log(`✓ Found ${assessments.length} assessments\n`);
    }
    
    if (!assessments || assessments.length === 0) {
      console.log('⚠️  No assessments in database, creating invitations without assessment links\n');
    }
    
    // Create invitations for each job
    const invitations = [];
    const statuses = ['pending', 'sent', 'applied'];
    
    for (let i = 0; i < Math.min(jobs.length, 3); i++) {
      const job = jobs[i];
      const assessment = assessments && assessments.length > 0 ? assessments[i % assessments.length] : null;
      const status = statuses[i % statuses.length];
      const proficiency = assessment?.readiness_pct || (85 + i * 3); // 85%, 88%, 91%
      
      const invitation = {
        user_id: user.id,
        company_id: company.id,
        job_id: job.id,
        assessment_id: assessment?.id || null,
        proficiency_pct: proficiency,
        application_url: job.application_url || 'https://powerdesigninc.us/careers',
        message: `Hi! We were impressed by your ${proficiency}% proficiency score and would love to invite you to apply for our ${job.title} position. Your skills align perfectly with what we're looking for!`,
        status: status,
        is_read: status !== 'pending',
        invited_at: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(), // Stagger by days
        viewed_at: status !== 'pending' ? new Date(Date.now() - (i * 12 * 60 * 60 * 1000)).toISOString() : null,
        responded_at: status === 'applied' ? new Date(Date.now() - (i * 6 * 60 * 60 * 1000)).toISOString() : null,
      };
      
      invitations.push(invitation);
    }
    
    // Insert invitations
    const { data: inserted, error } = await supabase
      .from('employer_invitations')
      .upsert(invitations, {
        onConflict: 'user_id,job_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('❌ Error inserting invitations:', error);
      return;
    }
    
    console.log(`\n✅ Successfully created ${inserted.length} invitations!\n`);
    
    // Display summary
    console.log('📋 Invitation Summary:');
    console.log('─'.repeat(60));
    inserted.forEach((inv, i) => {
      const job = jobs.find(j => j.id === inv.job_id);
      console.log(`${i + 1}. ${job.title}`);
      console.log(`   Status: ${inv.status}`);
      console.log(`   Proficiency: ${inv.proficiency_pct}%`);
      console.log(`   Invited: ${new Date(inv.invited_at).toLocaleDateString()}`);
      console.log('');
    });
    
    console.log('✨ You can now view these invitations in:');
    console.log('   - User dashboard: /dashboard (Invitations tab)');
    console.log('   - Employer admin: /admin/employer/invitations\n');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the script
seedInvitations()
  .then(() => {
    console.log('Script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
