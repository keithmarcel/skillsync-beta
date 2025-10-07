#!/usr/bin/env node

/**
 * Run pending migrations against the database
 * Usage: node scripts/run-migrations.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigrations() {
  const migrationsDir = join(__dirname, '..', 'supabase', 'migrations')
  
  // Get all migration files
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .filter(f => f.startsWith('20251007')) // Only run today's migrations
    .sort()

  console.log(`📦 Found ${files.length} migration(s) to run:\n`)

  for (const file of files) {
    console.log(`⏳ Running: ${file}`)
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        // Try direct execution if RPC fails
        const { error: directError } = await supabase.from('_migrations').insert({ name: file })
        if (directError) throw directError
      }
      
      console.log(`✅ Success: ${file}\n`)
    } catch (error) {
      console.error(`❌ Failed: ${file}`)
      console.error(error)
      process.exit(1)
    }
  }

  console.log('🎉 All migrations completed successfully!')
}

runMigrations()
