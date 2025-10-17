/**
 * Create 2 Demo Roles for Power Design from actual job postings
 * 
 * Role 1: Assistant Property Manager
 * Role 2: Business Process Engineer
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDemoRoles() {
  console.log('🚀 Creating Power Design Demo Roles...\n');

  const companyId = 'e5848012-89df-449e-855a-1834e9389656'; // Power Design, Inc

  try {
    // ROLE 1: Assistant Property Manager
    console.log('📋 Creating Role 1: Assistant Property Manager...');
    
    const role1Data = {
      job_kind: 'featured_role',
      title: 'Assistant Property Manager',
      company_id: companyId,
      soc_code: '11-9141.00', // Property, Real Estate, and Community Association Managers
      job_type: 'Full-time',
      category: 'Property Management',
      location_city: 'St. Petersburg',
      location_state: 'FL',
      work_location_type: 'Onsite',
      short_desc: 'Support property management operations for Power Design\'s real estate portfolio, coordinating maintenance, vendors, and administrative tasks.',
      long_desc: `Power Design has an exciting opportunity for an Assistant Property Manager to join our organization in beautiful St. Petersburg, FL. This person will help oversee and manage all company real estate assets. This role is responsible for the successful operations of all company real estate property while working directly with the property manager to organize, plan and execute goals.

You'll be part of a dynamic team managing our growing portfolio of properties, ensuring smooth day-to-day operations, vendor coordination, and administrative excellence. This role offers great growth potential within our expanding real estate operations.`,
      core_responsibilities: `- Assist Property Manager with all aspects of day-to-day operations and administrative support
- Vendor contract administration, bid summaries, and budget/variance report review
- Periodic property inspections and vendor walks
- Coordinate and organize all incoming work orders
- Creation and maintenance of filing and organizing system for Property Management documents
- Accurately prepare correspondence, purchase orders and other documents
- Prepare and maintain summary Excel spreadsheets
- Manage heavy incoming and outgoing e-mail traffic
- Heavy Calendar Management
- Prepare project meeting minutes when applicable
- Prepare monthly expense reports for Property Manager and other team members
- Run errands as needed or requested
- Plan and coordinate property management events
- Manage, update, close out work orders as needed`,
      education_level: 'Associate\'s degree',
      work_experience: '1-3 years',
      status: 'published',
      is_published: true,
      is_featured: true,
      required_proficiency_pct: 90,
      visibility_threshold_pct: 85,
      application_url: 'https://www.powerdesigninc.us/open-positions/assistant-property-manager_r10705-1'
    };

    const { data: role1, error: role1Error } = await supabase
      .from('jobs')
      .insert(role1Data)
      .select()
      .single();

    if (role1Error) {
      console.error('❌ Error creating role 1:', role1Error);
      throw role1Error;
    }

    console.log(`✅ Role 1 created: ${role1.title} (ID: ${role1.id})\n`);

    // ROLE 2: Business Process Engineer
    console.log('📋 Creating Role 2: Business Process Engineer...');
    
    const role2Data = {
      job_kind: 'featured_role',
      title: 'Business Process Engineer',
      company_id: companyId,
      soc_code: '17-2112.00', // Industrial Engineers
      job_type: 'Full-time',
      category: 'Engineering',
      location_city: 'St. Petersburg',
      location_state: 'FL',
      work_location_type: 'Onsite',
      short_desc: 'Optimize and improve business processes across Power Design\'s operations using engineering principles and data analysis.',
      long_desc: `As a Business Process Engineer at Power Design, you'll play a critical role in optimizing our operations across electrical, mechanical, plumbing, and systems technologies. You'll analyze workflows, identify inefficiencies, and implement solutions that enhance productivity and quality across our national design-build projects.

Working at our St. Petersburg headquarters, you'll collaborate with cross-functional teams to streamline processes, reduce costs, and improve project delivery timelines. This role combines engineering expertise with business acumen to drive continuous improvement initiatives.`,
      core_responsibilities: `- Analyze current business processes and identify areas for improvement
- Design and implement process optimization solutions
- Develop and maintain process documentation and standard operating procedures
- Collaborate with project teams to ensure process compliance
- Conduct data analysis to measure process performance and ROI
- Lead process improvement initiatives using Lean/Six Sigma methodologies
- Train team members on new processes and best practices
- Monitor and report on key performance indicators (KPIs)
- Facilitate cross-functional workshops to identify bottlenecks
- Create process maps and workflow diagrams
- Implement automation solutions where applicable
- Support change management initiatives`,
      education_level: 'Bachelor\'s degree',
      work_experience: '2-4 years',
      status: 'published',
      is_published: true,
      is_featured: true,
      required_proficiency_pct: 90,
      visibility_threshold_pct: 85,
      application_url: 'https://www.powerdesigninc.us/open-positions/business-process-engineer_r10679-1'
    };

    const { data: role2, error: role2Error } = await supabase
      .from('jobs')
      .insert(role2Data)
      .select()
      .single();

    if (role2Error) {
      console.error('❌ Error creating role 2:', role2Error);
      throw role2Error;
    }

    console.log(`✅ Role 2 created: ${role2.title} (ID: ${role2.id})\n`);

    // Now create quizzes for both roles
    console.log('🎯 Creating assessments for both roles...\n');

    for (const role of [role1, role2]) {
      console.log(`📝 Creating quiz for: ${role.title}`);
      
      // Get skills for this SOC code
      const { data: socSkills } = await supabase
        .from('soc_skills')
        .select('skill_id, skill:skills(id, name)')
        .eq('soc_code', role.soc_code)
        .order('display_order')
        .limit(8);

      if (!socSkills || socSkills.length === 0) {
        console.log(`  ⚠️ No skills found for SOC ${role.soc_code} - skipping quiz\n`);
        continue;
      }

      console.log(`  ✅ Found ${socSkills.length} skills`);

      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          job_id: role.id,
          company_id: companyId,
          title: `${role.title} Assessment`,
          description: `Skills assessment for ${role.title} role at Power Design`,
          soc_code: role.soc_code,
          status: 'published',
          ai_generated: true,
          estimated_minutes: 15,
          questions_per_assessment: 15
        })
        .select()
        .single();

      if (quizError) {
        console.error(`  ❌ Error creating quiz:`, quizError);
        continue;
      }

      console.log(`  ✅ Quiz created (ID: ${quiz.id})`);

      // Create quiz sections
      const sections = socSkills.map((s, i) => ({
        quiz_id: quiz.id,
        skill_id: s.skill_id,
        order_index: i,
        questions_per_section: 5
      }));

      const { error: sectionsError } = await supabase
        .from('quiz_sections')
        .insert(sections);

      if (sectionsError) {
        console.error(`  ❌ Error creating sections:`, sectionsError);
      } else {
        console.log(`  ✅ Created ${sections.length} sections\n`);
      }
    }

    console.log('🎉 DEMO ROLES SETUP COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`  Company: Power Design, Inc`);
    console.log(`  Role 1: ${role1.title} (${role1.id})`);
    console.log(`  Role 2: ${role2.title} (${role2.id})`);
    console.log(`\n🚀 Next Steps:`);
    console.log(`  1. Login as employeradmin-powerdesign@skillsync.com`);
    console.log(`  2. Go to Listed Roles tab - verify both roles appear`);
    console.log(`  3. Go to Assessments tab - verify both quizzes exist`);
    console.log(`  4. Generate AI questions for each quiz`);
    console.log(`  5. Test assessment flow!\n`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createDemoRoles()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = { createDemoRoles };
