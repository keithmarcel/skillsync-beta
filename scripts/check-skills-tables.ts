/**
 * Check Skills Tables in Remote Database
 * Checks for existing skills data across all skills-related tables
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSkillsTables() {
  console.log('🔍 Checking Skills-Related Tables...\n')

  const tables = [
    'skills',
    'soc_skills',
    'job_skills',
    'program_skills',
    'occupation_skills',
    'assessment_skills'
  ]

  const results: any = {}

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        results[table] = { exists: false, error: error.message }
      } else {
        results[table] = { exists: true, count }
        
        // Get sample data if table has rows
        if (count && count > 0) {
          const { data: sample } = await supabase
            .from(table)
            .select('*')
            .limit(3)
          
          results[table].sample = sample
        }
      }
    } catch (err: any) {
      results[table] = { exists: false, error: err.message }
    }
  }

  // Print results
  console.log('📊 Table Status:\n')
  for (const [table, info] of Object.entries(results)) {
    const tableInfo = info as any
    if (tableInfo.exists) {
      console.log(`✅ ${table}: ${tableInfo.count} rows`)
      if (tableInfo.sample && tableInfo.sample.length > 0) {
        console.log(`   Sample columns: ${Object.keys(tableInfo.sample[0]).join(', ')}`)
      }
    } else {
      console.log(`❌ ${table}: ${tableInfo.error}`)
    }
  }

  // Check for any other tables with 'skill' in the name
  console.log('\n🔍 Checking for other skill-related tables...\n')
  
  const { data: allTables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .ilike('table_name', '%skill%')

  if (!tablesError && allTables) {
    console.log('Found tables with "skill" in name:')
    allTables.forEach((t: any) => console.log(`  - ${t.table_name}`))
  }

  // Check programs table for any skill-related columns
  console.log('\n🔍 Checking programs table structure...\n')
  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select('*')
    .limit(1)

  if (!programsError && programs && programs.length > 0) {
    console.log('Programs table columns:')
    Object.keys(programs[0]).forEach(col => {
      if (col.toLowerCase().includes('skill') || col.toLowerCase().includes('cip')) {
        console.log(`  ⭐ ${col}: ${programs[0][col]}`)
      } else {
        console.log(`  - ${col}`)
      }
    })
  }
}

checkSkillsTables()
  .then(() => {
    console.log('\n✅ Check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
