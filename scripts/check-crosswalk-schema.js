#!/usr/bin/env node

/**
 * Check Crosswalk Schema - Query actual database for skills relationships
 * 
 * This script queries the remote Supabase database to understand:
 * 1. Jobs table structure (SOC codes, job_kind enum)
 * 2. Skills table structure
 * 3. job_skills junction table
 * 4. program_skills junction table
 * 5. Programs table structure (CIP codes)
 * 
 * Purpose: Document true schema before implementing crosswalk queries
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  console.log('🔍 Checking Crosswalk Schema in Remote Database...\n')

  try {
    // 1. Check jobs table structure
    console.log('📊 JOBS TABLE STRUCTURE:')
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1)
    
    if (jobsError) {
      console.error('❌ Jobs query error:', jobsError)
    } else if (jobs && jobs.length > 0) {
      console.log('✅ Jobs table columns:', Object.keys(jobs[0]))
      console.log('   Sample job_kind:', jobs[0].job_kind)
      console.log('   Sample soc_code:', jobs[0].soc_code)
    }

    // 2. Check job_skills junction table
    console.log('\n📊 JOB_SKILLS JUNCTION TABLE:')
    const { data: jobSkills, error: jobSkillsError } = await supabase
      .from('job_skills')
      .select('*')
      .limit(1)
    
    if (jobSkillsError) {
      console.error('❌ job_skills query error:', jobSkillsError)
    } else if (jobSkills && jobSkills.length > 0) {
      console.log('✅ job_skills columns:', Object.keys(jobSkills[0]))
    } else {
      console.log('⚠️  job_skills table exists but is empty')
    }

    // 3. Check program_skills junction table
    console.log('\n📊 PROGRAM_SKILLS JUNCTION TABLE:')
    const { data: programSkills, error: programSkillsError } = await supabase
      .from('program_skills')
      .select('*')
      .limit(1)
    
    if (programSkillsError) {
      console.error('❌ program_skills query error:', programSkillsError)
    } else if (programSkills && programSkills.length > 0) {
      console.log('✅ program_skills columns:', Object.keys(programSkills[0]))
    } else {
      console.log('⚠️  program_skills table exists but is empty')
    }

    // 4. Check programs table structure
    console.log('\n📊 PROGRAMS TABLE STRUCTURE:')
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('*')
      .limit(1)
    
    if (programsError) {
      console.error('❌ Programs query error:', programsError)
    } else if (programs && programs.length > 0) {
      console.log('✅ Programs table columns:', Object.keys(programs[0]))
      console.log('   Sample cip_code:', programs[0].cip_code)
    }

    // 5. Check skills table structure
    console.log('\n📊 SKILLS TABLE STRUCTURE:')
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .limit(1)
    
    if (skillsError) {
      console.error('❌ Skills query error:', skillsError)
    } else if (skills && skills.length > 0) {
      console.log('✅ Skills table columns:', Object.keys(skills[0]))
      console.log('   Sample skill:', skills[0].name)
      console.log('   Sample source:', skills[0].source)
    }

    // 6. Count relationships
    console.log('\n📊 RELATIONSHIP COUNTS:')
    
    const { count: jobsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
    console.log(`   Total jobs: ${jobsCount}`)

    const { count: occupationsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('job_kind', 'occupation')
    console.log(`   Occupations (HDOs): ${occupationsCount}`)

    const { count: featuredRolesCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('job_kind', 'featured_role')
    console.log(`   Featured Roles: ${featuredRolesCount}`)

    const { count: programsCount } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true })
    console.log(`   Programs: ${programsCount}`)

    const { count: skillsCount } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true })
    console.log(`   Skills: ${skillsCount}`)

    const { count: jobSkillsCount } = await supabase
      .from('job_skills')
      .select('*', { count: 'exact', head: true })
    console.log(`   Job-Skills relationships: ${jobSkillsCount}`)

    const { count: programSkillsCount } = await supabase
      .from('program_skills')
      .select('*', { count: 'exact', head: true })
    console.log(`   Program-Skills relationships: ${programSkillsCount}`)

    // 7. Sample crosswalk query - Featured Roles by SOC
    console.log('\n📊 SAMPLE CROSSWALK QUERY (Featured Roles by SOC):')
    const { data: sampleOccupation } = await supabase
      .from('jobs')
      .select('id, title, soc_code')
      .eq('job_kind', 'occupation')
      .not('soc_code', 'is', null)
      .limit(1)
      .single()

    if (sampleOccupation) {
      console.log(`   Sample HDO: ${sampleOccupation.title} (${sampleOccupation.soc_code})`)
      
      const { data: relatedRoles, count: relatedCount } = await supabase
        .from('jobs')
        .select('id, title', { count: 'exact' })
        .eq('job_kind', 'featured_role')
        .eq('soc_code', sampleOccupation.soc_code)

      console.log(`   Related Featured Roles: ${relatedCount}`)
      if (relatedRoles && relatedRoles.length > 0) {
        relatedRoles.forEach(role => {
          console.log(`     - ${role.title}`)
        })
      }
    }

    console.log('\n✅ Schema check complete!')

  } catch (error) {
    console.error('❌ Error checking schema:', error)
  }
}

checkSchema()
