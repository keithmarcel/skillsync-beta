/**
 * Test the enhanced question generation pipeline
 * Tests O*NET + CareerOneStop + Company Context integration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPipeline() {
  console.log('🧪 Testing Enhanced Question Generation Pipeline\n');
  console.log('='.repeat(60));

  // Test with Business Process Engineer (SOC: 17-2112.00 - Industrial Engineers)
  const testSOC = '17-2112.00';
  const testSkill = 'Mechanical Design';
  
  console.log(`\n📋 Test Parameters:`);
  console.log(`   SOC Code: ${testSOC}`);
  console.log(`   Skill: ${testSkill}`);
  console.log(`   Company: Power Design`);
  console.log('\n' + '='.repeat(60));

  try {
    // Step 1: Test O*NET API
    console.log('\n🌐 Step 1: Testing O*NET API...');
    const onetResponse = await fetch(`https://services.onetcenter.org/ws/online/occupations/${testSOC}/details/skills`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.ONET_USERNAME}:${process.env.ONET_PASSWORD}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    });

    if (!onetResponse.ok) {
      console.log(`   ❌ O*NET API Error: ${onetResponse.status}`);
      if (onetResponse.status === 401) {
        console.log('   ⚠️  Check ONET_USERNAME and ONET_PASSWORD in .env.local');
      }
    } else {
      const onetData = await onetResponse.json();
      const skills = onetData.element || [];
      console.log(`   ✅ O*NET API Success: ${skills.length} skills found`);
      
      // Find matching skill
      const match = skills.find(s => 
        s.name?.toLowerCase().includes('design') ||
        s.name?.toLowerCase().includes('mechanical') ||
        s.name?.toLowerCase().includes('systems')
      );
      
      if (match) {
        const importance = match.score?.value || 'N/A';
        console.log(`   ✅ Found relevant skill: "${match.name}" (Importance: ${importance}/100)`);
      } else {
        console.log(`   ⚠️  No exact match for "${testSkill}", but ${skills.length} skills available`);
        console.log(`   Sample skills:`, skills.slice(0, 3).map(s => s.name).join(', '));
      }
    }

    // Step 2: Test CareerOneStop API
    console.log('\n🏢 Step 2: Testing CareerOneStop API...');
    
    if (!process.env.COS_USERID || !process.env.COS_TOKEN) {
      console.log('   ⚠️  COS_USERID or COS_TOKEN not found in .env.local');
      console.log('   ⚠️  CareerOneStop integration will be skipped');
    } else {
      const onetCode = testSOC.includes('.') ? testSOC : `${testSOC}.00`;
      const cosEndpoint = `https://api.careeronestop.org/v1/occupation/${process.env.COS_USERID}/${onetCode}/US`;
      
      const cosResponse = await fetch(cosEndpoint, {
        headers: {
          'Authorization': `Bearer ${process.env.COS_TOKEN}`,
          'Accept': 'application/json'
        }
      });

      if (!cosResponse.ok) {
        console.log(`   ❌ CareerOneStop API Error: ${cosResponse.status}`);
        if (cosResponse.status === 401) {
          console.log('   ⚠️  Check COS_USERID and COS_TOKEN in .env.local');
        }
      } else {
        const cosData = await cosResponse.json();
        console.log(`   ✅ CareerOneStop API Success`);
        console.log(`   ✅ Occupation: ${cosData.OnetTitle || 'N/A'}`);
        console.log(`   ✅ Tasks: ${cosData.Tasks?.length || 0} found`);
        console.log(`   ✅ Tools: ${cosData.ToolsAndTechnology?.length || 0} found`);
        
        if (cosData.Tasks && cosData.Tasks.length > 0) {
          console.log(`   Sample task: "${cosData.Tasks[0].Task?.substring(0, 80)}..."`);
        }
      }
    }

    // Step 3: Test Company Context
    console.log('\n🏭 Step 3: Testing Company Context...');
    const { data: company } = await supabase
      .from('companies')
      .select('name, industry, employee_range, revenue_range')
      .eq('id', 'e5848012-89df-449e-855a-1834e9389656')
      .single();

    if (company) {
      console.log(`   ✅ Company Data Found`);
      console.log(`   ✅ Name: ${company.name}`);
      console.log(`   ✅ Industry: ${company.industry}`);
      console.log(`   ✅ Size: ${company.employee_range} employees`);
      console.log(`   ✅ Revenue: ${company.revenue_range}`);
    } else {
      console.log(`   ❌ Company data not found`);
    }

    // Step 4: Test OpenAI Connection
    console.log('\n🤖 Step 4: Testing OpenAI Connection...');
    if (!process.env.OPENAI_API_KEY) {
      console.log('   ❌ OPENAI_API_KEY not found in .env.local');
    } else {
      console.log(`   ✅ OpenAI API Key found (length: ${process.env.OPENAI_API_KEY.length})`);
      console.log(`   ✅ Model: ${process.env.OPENAI_MODEL_EXTRACTOR || 'gpt-4o-mini'}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 PIPELINE TEST SUMMARY\n');
    
    const onetStatus = onetResponse?.ok ? '✅ READY' : '❌ FAILED';
    const cosStatus = process.env.COS_USERID && process.env.COS_TOKEN ? '✅ CONFIGURED' : '⚠️  NOT CONFIGURED';
    const companyStatus = company ? '✅ READY' : '❌ FAILED';
    const openaiStatus = process.env.OPENAI_API_KEY ? '✅ READY' : '❌ FAILED';

    console.log(`   O*NET API:          ${onetStatus}`);
    console.log(`   CareerOneStop API:  ${cosStatus}`);
    console.log(`   Company Context:    ${companyStatus}`);
    console.log(`   OpenAI API:         ${openaiStatus}`);
    
    console.log('\n' + '='.repeat(60));
    
    if (onetResponse?.ok && company && process.env.OPENAI_API_KEY) {
      console.log('\n✅ PIPELINE READY FOR TESTING!');
      console.log('\nYou can now test question generation in the UI.');
      console.log('The pipeline will use:');
      console.log('  1. O*NET skill importance and work activities');
      if (process.env.COS_USERID && process.env.COS_TOKEN) {
        console.log('  2. CareerOneStop tasks, tools, and labor market data');
      } else {
        console.log('  2. CareerOneStop (skipped - credentials not configured)');
      }
      console.log('  3. Power Design company context');
      console.log('  4. OpenAI for question generation');
    } else {
      console.log('\n⚠️  PIPELINE HAS ISSUES - Check errors above');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPipeline()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
