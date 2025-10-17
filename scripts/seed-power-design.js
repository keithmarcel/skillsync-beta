/**
 * Seed Power Design Company + 2 Featured Roles for Demo
 * 
 * Company: Power Design Inc.
 * Role 1: Business Process Engineer
 * Role 2: Assistant Property Manager
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedPowerDesign() {
  console.log('🚀 Starting Power Design seed...\n');

  try {
    // 1. CREATE COMPANY
    console.log('📊 Creating Power Design company...');
    
    const companyData = {
      name: 'Power Design',
      logo_url: 'https://www.powerdesigninc.us/hubfs/PD_Logo_Horizontal_Color.svg',
      is_trusted_partner: true,
      hq_city: 'St. Petersburg',
      hq_state: 'FL',
      industry: 'Construction & Design-Build',
      employee_range: '1000-5000',
      bio: `Power Design is a National Design Build Contractor, focused on innovative construction across multiple trades: electrical, mechanical, plumbing, and systems technologies. Since 1989, we've disrupted the industry by putting next-generation ideas to powerful, practical use because we care. We design breakthrough solutions that push the limits of what's possible by harnessing the collaborative power of our teams to elevate experiences and empower the communities where we live and work.`,
      is_published: true,
      custom_quiz_enabled: true
    };

    // Check if company already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select()
      .eq('name', 'Power Design')
      .single();

    let company;
    if (existingCompany) {
      console.log('  Company already exists, using existing...');
      company = existingCompany;
    } else {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      if (companyError) {
        console.error('❌ Error creating company:', companyError);
        throw companyError;
      }
      company = newCompany;
    }

    console.log('✅ Company created:', company.name, `(ID: ${company.id})\n`);

    // 2. CREATE ROLE 1: Business Process Engineer
    console.log('📋 Creating Role 1: Business Process Engineer...');
    
    const role1Data = {
      job_kind: 'featured_role',
      title: 'Business Process Engineer',
      company_id: company.id,
      soc_code: '17-2112.00', // Industrial Engineers
      job_type: 'Full-time',
      category: 'Engineering',
      location_city: 'St. Petersburg',
      location_state: 'FL',
      work_location_type: 'Onsite',
      short_desc: 'Help optimize and improve business processes across Power Design\'s operations using engineering principles and data analysis.',
      long_desc: `As a Business Process Engineer at Power Design, you'll play a critical role in optimizing our operations across electrical, mechanical, plumbing, and systems technologies. You'll analyze workflows, identify inefficiencies, and implement solutions that enhance productivity and quality across our national design-build projects.

Working at our St. Petersburg headquarters, you'll collaborate with cross-functional teams to streamline processes, reduce costs, and improve project delivery timelines. This role combines engineering expertise with business acumen to drive continuous improvement initiatives.`,
      core_responsibilities: `- Analyze current business processes and identify areas for improvement
- Design and implement process optimization solutions
- Develop and maintain process documentation and standard operating procedures
- Collaborate with project teams to ensure process compliance
- Conduct data analysis to measure process performance and ROI
- Lead process improvement initiatives using Lean/Six Sigma methodologies
- Train team members on new processes and best practices
- Monitor and report on key performance indicators (KPIs)`,
      education_level: 'Bachelor\'s degree',
      work_experience: '2-4 years',
      status: 'published',
      is_published: true,
      is_featured: true,
      required_proficiency_pct: 90,
      visibility_threshold_pct: 85,
      application_url: 'https://www.powerdesigninc.us/open-positions/business-process-engineer_r10679-1'
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

    console.log('✅ Role 1 created:', role1.title, `(ID: ${role1.id})\n`);

    // 3. CREATE ROLE 2: Assistant Property Manager
    console.log('📋 Creating Role 2: Assistant Property Manager...');
    
    const role2Data = {
      job_kind: 'featured_role',
      title: 'Assistant Property Manager',
      company_id: company.id,
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

    const { data: role2, error: role2Error } = await supabase
      .from('jobs')
      .insert(role2Data)
      .select()
      .single();

    if (role2Error) {
      console.error('❌ Error creating role 2:', role2Error);
      throw role2Error;
    }

    console.log('✅ Role 2 created:', role2.title, `(ID: ${role2.id})\n`);

    // 4. SUMMARY
    console.log('🎉 SEED COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`  Company: ${company.name} (${company.id})`);
    console.log(`  Role 1: ${role1.title} (${role1.id})`);
    console.log(`  Role 2: ${role2.title} (${role2.id})\n`);
    console.log('🚀 Next Steps:');
    console.log('  1. Generate AI quizzes for both roles');
    console.log('  2. Test assessment flow');
    console.log('  3. Demo ready!\n');

    return {
      company,
      role1,
      role2
    };

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedPowerDesign()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = { seedPowerDesign };
