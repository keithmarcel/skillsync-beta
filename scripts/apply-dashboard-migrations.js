#!/usr/bin/env node

/**
 * Apply dashboard migrations to the database
 * Run: node scripts/apply-dashboard-migrations.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration(filename) {
  const filepath = path.join(__dirname, '..', 'supabase', 'migrations', filename)
  const sql = fs.readFileSync(filepath, 'utf-8')
  
  console.log(`\n📝 Running: ${filename}`)
  console.log('─'.repeat(60))
  
  // Split by semicolon and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  for (const statement of statements) {
    if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX') || statement.includes('COMMENT ON')) {
      console.log(`  Executing: ${statement.substring(0, 60)}...`)
      
      const { error } = await supabase.rpc('exec_sql', { 
        query: statement + ';' 
      })
      
      if (error) {
        console.error(`  ❌ Error:`, error.message)
        // Continue anyway for IF NOT EXISTS statements
      } else {
        console.log(`  ✅ Success`)
      }
    }
  }
}

async function main() {
  console.log('🚀 Applying Dashboard Migrations')
  console.log('='.repeat(60))
  
  try {
    await runMigration('20251007000000_add_provider_dashboard_fields.sql')
    await runMigration('20251007000001_add_employer_dashboard_fields.sql')
    
    console.log('\n' + '='.repeat(60))
    console.log('✨ Migrations completed!')
    console.log('\nNote: If you see "function exec_sql does not exist" errors,')
    console.log('please run these migrations manually in Supabase SQL Editor.')
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

main()
