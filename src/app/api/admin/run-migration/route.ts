import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    console.log('Running occupation data cache migration...')

    // Create BLS Wage Data Cache table
    const { error: blsWageError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS bls_wage_data (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          soc_code TEXT NOT NULL,
          area_code TEXT NOT NULL,
          area_name TEXT NOT NULL,
          median_wage DECIMAL(10,2),
          mean_wage DECIMAL(10,2),
          employment_level INTEGER,
          employment_rse DECIMAL(5,2),
          wage_rse DECIMAL(5,2),
          data_year INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
          UNIQUE(soc_code, area_code, data_year)
        );
      `
    })

    if (blsWageError) {
      console.error('Error creating bls_wage_data table:', blsWageError)
    }

    // Create BLS Employment Projections Cache table
    const { error: blsProjectionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS bls_employment_projections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          soc_code TEXT NOT NULL UNIQUE,
          occupation_title TEXT NOT NULL,
          employment_2022 INTEGER,
          employment_2032 INTEGER,
          change_number INTEGER,
          change_percent DECIMAL(5,2),
          growth_rate TEXT,
          median_wage_2023 DECIMAL(10,2),
          education_level TEXT,
          work_experience TEXT,
          on_job_training TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '180 days')
        );
      `
    })

    if (blsProjectionsError) {
      console.error('Error creating bls_employment_projections table:', blsProjectionsError)
    }

    // Create CareerOneStop Programs Cache table
    const { error: cosProgramsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS cos_programs_cache (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          external_id TEXT NOT NULL,
          soc_code TEXT NOT NULL,
          program_name TEXT NOT NULL,
          provider_name TEXT NOT NULL,
          provider_type TEXT,
          city TEXT,
          state TEXT,
          zip_code TEXT,
          program_type TEXT,
          delivery_method TEXT,
          duration TEXT,
          cost DECIMAL(10,2),
          program_url TEXT,
          cip_code TEXT,
          description TEXT,
          prerequisites JSONB DEFAULT '[]',
          outcomes JSONB DEFAULT '[]',
          accreditation TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '60 days'),
          UNIQUE(external_id, soc_code)
        );
      `
    })

    if (cosProgramsError) {
      console.error('Error creating cos_programs_cache table:', cosProgramsError)
    }

    // Create CareerOneStop Certifications Cache table
    const { error: cosCertificationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS cos_certifications_cache (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          soc_code TEXT NOT NULL,
          certification_name TEXT NOT NULL,
          issuing_organization TEXT NOT NULL,
          description TEXT,
          requirements JSONB DEFAULT '[]',
          renewal_period TEXT,
          cost DECIMAL(10,2),
          exam_required BOOLEAN DEFAULT false,
          related_socs JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '120 days'),
          UNIQUE(soc_code, certification_name, issuing_organization)
        );
      `
    })

    if (cosCertificationsError) {
      console.error('Error creating cos_certifications_cache table:', cosCertificationsError)
    }

    // Create Occupation Enrichment Status table
    const { error: enrichmentStatusError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS occupation_enrichment_status (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          soc_code TEXT NOT NULL UNIQUE,
          bls_wage_updated_at TIMESTAMP WITH TIME ZONE,
          bls_projections_updated_at TIMESTAMP WITH TIME ZONE,
          cos_programs_updated_at TIMESTAMP WITH TIME ZONE,
          cos_certifications_updated_at TIMESTAMP WITH TIME ZONE,
          last_enrichment_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed')),
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (enrichmentStatusError) {
      console.error('Error creating occupation_enrichment_status table:', enrichmentStatusError)
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      tables_created: [
        'bls_wage_data',
        'bls_employment_projections', 
        'cos_programs_cache',
        'cos_certifications_cache',
        'occupation_enrichment_status'
      ]
    })

  } catch (error) {
    console.error('Error running migration:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to run migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
