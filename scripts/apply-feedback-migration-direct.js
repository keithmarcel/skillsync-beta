#!/usr/bin/env node

/**
 * Apply feedback table migration using direct PostgreSQL connection
 */

import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

// Read migration file
const migrationPath = join(__dirname, '../supabase/migrations/20251009000000_enhance_feedback_table.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Parse connection string from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

// Extract project ref from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not parse project ref from Supabase URL');
  process.exit(1);
}

// Construct database URL
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!dbPassword) {
  console.error('❌ Missing SUPABASE_DB_PASSWORD');
  console.log('\n📋 To apply migration, you need the database password.');
  console.log('   Get it from: Supabase Dashboard → Settings → Database → Connection String');
  console.log('\n   Then add to .env.local:');
  console.log('   SUPABASE_DB_PASSWORD=your_password_here\n');
  process.exit(1);
}

const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function applyMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🚀 Connecting to database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📝 Applying migration: 20251009000000_enhance_feedback_table.sql\n');
    
    await client.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!\n');

    // Verify
    console.log('🔍 Verifying columns...\n');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'feedback' 
      AND column_name IN ('route_path', 'feedback_level')
      ORDER BY column_name;
    `);

    if (result.rows.length === 2) {
      console.log('✅ Verification successful! New columns:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
      console.log('\n📊 Feedback widget is now fully functional!\n');
    } else {
      console.log('⚠️  Verification incomplete. Found columns:', result.rows);
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n📋 Please apply manually via Supabase Dashboard SQL Editor\n');
  } finally {
    await client.end();
    process.exit(0);
  }
}

applyMigration();
