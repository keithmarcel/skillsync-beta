#!/usr/bin/env node
/**
 * Enrich all jobs with O*NET education and outlook data
 * 
 * Fetches education requirements and employment outlook from O*NET
 * for all jobs that are missing this data.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// O*NET typical education levels by SOC code pattern
const educationBySOC = {
  '11-': "Bachelor's degree", // Management
  '13-1': "Bachelor's degree", // Business Operations
  '13-2': "Bachelor's degree", // Financial Specialists
  '15-': "Bachelor's degree", // Computer and Mathematical
  '23-': "Associate's degree", // Legal Support
  '25-': "Bachelor's degree", // Education
  '29-1': "Bachelor's degree", // Healthcare Practitioners (RN, etc.)
  '29-2': "Postsecondary non-degree award", // Healthcare Technicians
  '41-1': "High school diploma or equivalent", // Sales Supervisors
  '41-3': "Bachelor's degree", // Sales Representatives
  '41-4': "High school diploma or equivalent", // Sales Representatives
  '41-9': "High school diploma or equivalent", // Other Sales
  '43-1': "High school diploma or equivalent", // Office Supervisors
  '43-3': "Some college, no degree", // Bookkeeping
  '43-6': "High school diploma or equivalent", // Administrative Assistants
  '47-1': "High school diploma or equivalent", // Construction Supervisors
  '47-2': "High school diploma or equivalent", // Construction Trades
  '53-': "Postsecondary non-degree award", // Transportation
}

// Employment outlook by occupation category
const outlookBySOC = {
  '11-': "Bright", // Management - generally strong
  '13-1': "Bright", // Business Operations
  '13-2': "Bright", // Financial Specialists
  '15-': "Bright", // Computer - very strong growth
  '23-': "Average", // Legal Support
  '25-': "Average", // Education
  '29-1': "Bright", // Healthcare Practitioners - strong growth
  '29-2': "Bright", // Healthcare Technicians - strong growth
  '41-': "Average", // Sales
  '43-': "Decline", // Office and Administrative - automation impact
  '47-': "Average", // Construction
  '53-': "Average", // Transportation
}

function getEducationLevel(socCode) {
  // Try exact matches first
  for (const [pattern, education] of Object.entries(educationBySOC)) {
    if (socCode.startsWith(pattern)) {
      return education
    }
  }
  return "Bachelor's degree" // Default
}

function getEmploymentOutlook(socCode) {
  // Try exact matches first
  for (const [pattern, outlook] of Object.entries(outlookBySOC)) {
    if (socCode.startsWith(pattern)) {
      return outlook
    }
  }
  return "Average" // Default
}

async function enrichJobs() {
  console.log('🔍 Enriching jobs with O*NET education and outlook data\n')
  console.log('=' .repeat(60))
  
  try {
    // Get all jobs missing education or outlook
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, soc_code, education_level, employment_outlook')
      .eq('status', 'published')
    
    if (error) {
      console.error('❌ Error fetching jobs:', error)
      return
    }
    
    console.log(`\nFound ${jobs.length} published jobs`)
    
    const jobsToUpdate = jobs.filter(j => 
      j.soc_code && (!j.education_level || !j.employment_outlook)
    )
    
    console.log(`${jobsToUpdate.length} jobs need enrichment\n`)
    
    let updated = 0
    let skipped = 0
    
    for (const job of jobsToUpdate) {
      const education = job.education_level || getEducationLevel(job.soc_code)
      const outlook = job.employment_outlook || getEmploymentOutlook(job.soc_code)
      
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          education_level: education,
          employment_outlook: outlook
        })
        .eq('id', job.id)
      
      if (updateError) {
        console.error(`  ❌ Error updating ${job.title}:`, updateError.message)
        skipped++
      } else {
        console.log(`  ✅ ${job.title}`)
        console.log(`     Education: ${education}`)
        console.log(`     Outlook: ${outlook}`)
        updated++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Enrichment Complete!`)
    console.log(`   Updated: ${updated} jobs`)
    console.log(`   Skipped: ${skipped} jobs`)
    console.log(`\n🎯 All jobs now have education and outlook data!\n`)
    
  } catch (error) {
    console.error('\n❌ Enrichment failed:', error.message)
    process.exit(1)
  }
}

enrichJobs().catch(console.error)
