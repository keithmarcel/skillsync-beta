#!/usr/bin/env node

/**
 * Comprehensive Crosswalk Coverage Audit
 * 
 * Audits the entire system to ensure:
 * 1. All jobs have crosswalk entries
 * 2. All crosswalk entries have programs
 * 3. All programs have valid data
 * 4. Reports coverage gaps systematically
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function auditCrosswalkCoverage() {
  console.log('🔍 COMPREHENSIVE CROSSWALK COVERAGE AUDIT\n')
  console.log('=' .repeat(80))
  
  const issues = []
  const stats = {
    totalJobs: 0,
    jobsWithSOC: 0,
    jobsWithCrosswalk: 0,
    jobsWithPrograms: 0,
    totalCrosswalkEntries: 0,
    crosswalkWithPrograms: 0,
    totalPrograms: 0,
    programsWithValidData: 0
  }

  // ============================================================================
  // STEP 1: Audit All Jobs
  // ============================================================================
  console.log('\n📋 STEP 1: Auditing All Jobs')
  console.log('-'.repeat(80))
  
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, soc_code, job_kind, status')
    .eq('status', 'published')
    .order('title')

  stats.totalJobs = jobs?.length || 0
  console.log(`Total published jobs: ${stats.totalJobs}`)

  const jobsWithoutSOC = []
  const jobsWithoutCrosswalk = []
  const jobsWithoutPrograms = []

  for (const job of jobs || []) {
    // Check SOC code
    if (!job.soc_code) {
      jobsWithoutSOC.push(job)
      continue
    }
    stats.jobsWithSOC++

    // Check crosswalk
    const { data: crosswalk } = await supabase
      .from('cip_soc_crosswalk')
      .select('cip_code')
      .eq('soc_code', job.soc_code)

    if (!crosswalk || crosswalk.length === 0) {
      jobsWithoutCrosswalk.push(job)
      issues.push({
        type: 'MISSING_CROSSWALK',
        severity: 'HIGH',
        job: job.title,
        soc: job.soc_code,
        message: `No crosswalk entries for SOC ${job.soc_code}`
      })
      continue
    }
    stats.jobsWithCrosswalk++

    // Check programs
    const cipCodes = crosswalk.map(c => c.cip_code)
    const { data: programs } = await supabase
      .from('programs')
      .select('id, name, short_desc')
      .in('cip_code', cipCodes)
      .eq('status', 'published')

    // Filter out bad programs
    const validPrograms = programs?.filter(p => {
      const hasValidName = p.name && !p.name.startsWith('Skills:') && !p.name.startsWith('Build:')
      const hasDescription = p.short_desc
      return hasValidName && hasDescription
    }) || []

    if (validPrograms.length === 0) {
      jobsWithoutPrograms.push({
        ...job,
        cipCodes,
        totalPrograms: programs?.length || 0,
        validPrograms: 0
      })
      issues.push({
        type: 'NO_VALID_PROGRAMS',
        severity: 'MEDIUM',
        job: job.title,
        soc: job.soc_code,
        cipCodes: cipCodes.join(', '),
        totalPrograms: programs?.length || 0,
        message: `Has crosswalk but no valid programs (${programs?.length || 0} total, 0 valid)`
      })
    } else {
      stats.jobsWithPrograms++
    }
  }

  console.log(`\nJobs with SOC codes: ${stats.jobsWithSOC}/${stats.totalJobs}`)
  console.log(`Jobs with crosswalk: ${stats.jobsWithCrosswalk}/${stats.jobsWithSOC}`)
  console.log(`Jobs with valid programs: ${stats.jobsWithPrograms}/${stats.jobsWithCrosswalk}`)

  // ============================================================================
  // STEP 2: Audit Crosswalk Table
  // ============================================================================
  console.log('\n\n📊 STEP 2: Auditing Crosswalk Table')
  console.log('-'.repeat(80))

  const { data: allCrosswalk } = await supabase
    .from('cip_soc_crosswalk')
    .select('soc_code, cip_code, match_strength')
    .order('soc_code')

  stats.totalCrosswalkEntries = allCrosswalk?.length || 0
  console.log(`Total crosswalk entries: ${stats.totalCrosswalkEntries}`)

  const crosswalkMap = new Map()
  allCrosswalk?.forEach(entry => {
    if (!crosswalkMap.has(entry.soc_code)) {
      crosswalkMap.set(entry.soc_code, [])
    }
    crosswalkMap.get(entry.soc_code).push(entry)
  })

  console.log(`Unique SOC codes in crosswalk: ${crosswalkMap.size}`)

  const crosswalkWithoutPrograms = []
  for (const [socCode, entries] of crosswalkMap) {
    const cipCodes = entries.map(e => e.cip_code)
    
    const { data: programs } = await supabase
      .from('programs')
      .select('id, name, short_desc')
      .in('cip_code', cipCodes)
      .eq('status', 'published')

    const validPrograms = programs?.filter(p => {
      const hasValidName = p.name && !p.name.startsWith('Skills:') && !p.name.startsWith('Build:')
      const hasDescription = p.short_desc
      return hasValidName && hasDescription
    }) || []

    if (validPrograms.length > 0) {
      stats.crosswalkWithPrograms++
    } else {
      crosswalkWithoutPrograms.push({
        soc: socCode,
        cipCodes,
        totalPrograms: programs?.length || 0
      })
      issues.push({
        type: 'CROSSWALK_NO_PROGRAMS',
        severity: 'MEDIUM',
        soc: socCode,
        cipCodes: cipCodes.join(', '),
        message: `Crosswalk exists but no valid programs for CIP codes: ${cipCodes.join(', ')}`
      })
    }
  }

  console.log(`Crosswalk entries with programs: ${stats.crosswalkWithPrograms}/${crosswalkMap.size}`)

  // ============================================================================
  // STEP 3: Audit Programs
  // ============================================================================
  console.log('\n\n📚 STEP 3: Auditing Programs')
  console.log('-'.repeat(80))

  const { data: allPrograms } = await supabase
    .from('programs')
    .select('id, name, cip_code, short_desc, status')
    .eq('status', 'published')

  stats.totalPrograms = allPrograms?.length || 0
  console.log(`Total published programs: ${stats.totalPrograms}`)

  const invalidPrograms = []
  allPrograms?.forEach(program => {
    const hasValidName = program.name && !program.name.startsWith('Skills:') && !program.name.startsWith('Build:')
    const hasDescription = program.short_desc
    const hasCIP = program.cip_code

    if (hasValidName && hasDescription && hasCIP) {
      stats.programsWithValidData++
    } else {
      invalidPrograms.push({
        name: program.name,
        issues: [
          !hasValidName && 'Invalid name',
          !hasDescription && 'Missing description',
          !hasCIP && 'Missing CIP code'
        ].filter(Boolean)
      })
    }
  })

  console.log(`Programs with valid data: ${stats.programsWithValidData}/${stats.totalPrograms}`)
  console.log(`Programs with issues: ${invalidPrograms.length}`)

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log('\n\n' + '='.repeat(80))
  console.log('📊 SUMMARY REPORT')
  console.log('='.repeat(80))

  console.log('\n🎯 COVERAGE METRICS:')
  console.log(`  Jobs → SOC codes: ${stats.jobsWithSOC}/${stats.totalJobs} (${Math.round(stats.jobsWithSOC/stats.totalJobs*100)}%)`)
  console.log(`  Jobs → Crosswalk: ${stats.jobsWithCrosswalk}/${stats.jobsWithSOC} (${Math.round(stats.jobsWithCrosswalk/stats.jobsWithSOC*100)}%)`)
  console.log(`  Jobs → Programs: ${stats.jobsWithPrograms}/${stats.jobsWithCrosswalk} (${Math.round(stats.jobsWithPrograms/stats.jobsWithCrosswalk*100)}%)`)
  console.log(`  Crosswalk → Programs: ${stats.crosswalkWithPrograms}/${crosswalkMap.size} (${Math.round(stats.crosswalkWithPrograms/crosswalkMap.size*100)}%)`)
  console.log(`  Programs Valid: ${stats.programsWithValidData}/${stats.totalPrograms} (${Math.round(stats.programsWithValidData/stats.totalPrograms*100)}%)`)

  console.log('\n⚠️  ISSUES FOUND:')
  console.log(`  Total issues: ${issues.length}`)
  console.log(`  High severity: ${issues.filter(i => i.severity === 'HIGH').length}`)
  console.log(`  Medium severity: ${issues.filter(i => i.severity === 'MEDIUM').length}`)

  // ============================================================================
  // DETAILED ISSUES
  // ============================================================================
  if (issues.length > 0) {
    console.log('\n\n' + '='.repeat(80))
    console.log('🔴 DETAILED ISSUES')
    console.log('='.repeat(80))

    // Group by type
    const issuesByType = {}
    issues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = []
      }
      issuesByType[issue.type].push(issue)
    })

    for (const [type, typeIssues] of Object.entries(issuesByType)) {
      console.log(`\n${type} (${typeIssues.length} issues):`)
      typeIssues.slice(0, 10).forEach(issue => {
        console.log(`  • ${issue.job || issue.soc}: ${issue.message}`)
      })
      if (typeIssues.length > 10) {
        console.log(`  ... and ${typeIssues.length - 10} more`)
      }
    }
  }

  // ============================================================================
  // RECOMMENDATIONS
  // ============================================================================
  console.log('\n\n' + '='.repeat(80))
  console.log('💡 RECOMMENDATIONS')
  console.log('='.repeat(80))

  if (jobsWithoutSOC.length > 0) {
    console.log(`\n1. Add SOC codes to ${jobsWithoutSOC.length} jobs`)
  }

  if (jobsWithoutCrosswalk.length > 0) {
    console.log(`\n2. Add crosswalk entries for ${jobsWithoutCrosswalk.length} SOC codes:`)
    jobsWithoutCrosswalk.slice(0, 5).forEach(job => {
      console.log(`   • ${job.soc_code}: ${job.title}`)
    })
    if (jobsWithoutCrosswalk.length > 5) {
      console.log(`   ... and ${jobsWithoutCrosswalk.length - 5} more`)
    }
  }

  if (jobsWithoutPrograms.length > 0) {
    console.log(`\n3. Add programs or fix CIP codes for ${jobsWithoutPrograms.length} jobs:`)
    jobsWithoutPrograms.slice(0, 5).forEach(job => {
      console.log(`   • ${job.title} (CIP: ${job.cipCodes.join(', ')})`)
    })
    if (jobsWithoutPrograms.length > 5) {
      console.log(`   ... and ${jobsWithoutPrograms.length - 5} more`)
    }
  }

  if (invalidPrograms.length > 0) {
    console.log(`\n4. Fix ${invalidPrograms.length} programs with data issues`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Audit complete!')
  console.log('='.repeat(80) + '\n')

  return {
    stats,
    issues,
    jobsWithoutSOC,
    jobsWithoutCrosswalk,
    jobsWithoutPrograms,
    crosswalkWithoutPrograms,
    invalidPrograms
  }
}

// Run if called directly
if (require.main === module) {
  auditCrosswalkCoverage()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Error:', err)
      process.exit(1)
    })
}

module.exports = { auditCrosswalkCoverage }
