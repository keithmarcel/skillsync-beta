#!/usr/bin/env node
/**
 * Check O*NET data coverage for all jobs
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCoverage() {
  console.log('🔍 Checking O*NET Data Coverage\n')
  
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('title, soc_code, core_responsibilities, tasks, tools_and_technology, job_kind')
    .eq('status', 'published')
    .order('title')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Total Jobs: ${jobs.length}\n`)
  
  let withResponsibilities = 0
  let withTasks = 0
  let withTools = 0
  let withNone = []
  let occupations = jobs.filter(j => j.job_kind === 'occupation')
  let featuredRoles = jobs.filter(j => j.job_kind === 'featured_role')
  
  jobs.forEach(job => {
    const hasResp = job.core_responsibilities && (
      typeof job.core_responsibilities === 'string' 
        ? job.core_responsibilities.length > 2 
        : job.core_responsibilities.length > 0
    )
    const hasTasks = job.tasks && (
      Array.isArray(job.tasks) 
        ? job.tasks.length > 0 
        : typeof job.tasks === 'object' && Object.keys(job.tasks).length > 0
    )
    const hasTools = job.tools_and_technology && (
      Array.isArray(job.tools_and_technology) 
        ? job.tools_and_technology.length > 0 
        : typeof job.tools_and_technology === 'object' && Object.keys(job.tools_and_technology).length > 0
    )
    
    if (hasResp) withResponsibilities++
    if (hasTasks) withTasks++
    if (hasTools) withTools++
    
    if (!hasResp && !hasTasks && !hasTools) {
      withNone.push({ title: job.title, kind: job.job_kind, soc: job.soc_code })
    }
  })
  
  console.log('📊 Coverage Summary:')
  console.log(`  Core Responsibilities: ${withResponsibilities}/${jobs.length} (${Math.round(withResponsibilities/jobs.length*100)}%)`)
  console.log(`  Tasks: ${withTasks}/${jobs.length} (${Math.round(withTasks/jobs.length*100)}%)`)
  console.log(`  Tools & Technology: ${withTools}/${jobs.length} (${Math.round(withTools/jobs.length*100)}%)`)
  
  console.log(`\n📋 By Job Type:`)
  console.log(`  Occupations: ${occupations.length}`)
  console.log(`  Featured Roles: ${featuredRoles.length}`)
  
  if (withNone.length > 0) {
    console.log(`\n⚠️  Jobs Missing ALL O*NET Data (${withNone.length}):`)
    withNone.forEach(job => {
      console.log(`  - ${job.title} (${job.kind}) [${job.soc || 'No SOC'}]`)
    })
  } else {
    console.log('\n✅ All jobs have at least some O*NET data!')
  }
  
  console.log('\n')
}

checkCoverage().catch(console.error)
