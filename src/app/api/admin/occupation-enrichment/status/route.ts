import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get all occupations with their enrichment status
    const { data: occupations, error: occupationsError } = await supabase
      .from('jobs')
      .select('id, title, soc_code')
      .eq('job_kind', 'occupation')
      .not('soc_code', 'is', null)
      .order('title')

    if (occupationsError) {
      throw new Error(`Failed to fetch occupations: ${occupationsError.message}`)
    }

    // Get enrichment status for each occupation
    const { data: enrichmentStatus, error: statusError } = await supabase
      .from('occupation_enrichment_status')
      .select('*')

    if (statusError) {
      console.warn('Failed to fetch enrichment status:', statusError.message)
    }

    // Check cache status for each occupation
    const enrichmentData = await Promise.all(
      occupations.map(async (occupation) => {
        const status = enrichmentStatus?.find(s => s.soc_code === occupation.soc_code)
        
        // Check BLS wage cache
        const { data: blsWage } = await supabase
          .from('bls_wage_data')
          .select('expires_at')
          .eq('soc_code', occupation.soc_code)
          .eq('area_code', '45300')
          .order('created_at', { ascending: false })
          .limit(1)

        // Check CareerOneStop programs cache
        const { data: cosPrograms } = await supabase
          .from('cos_programs_cache')
          .select('expires_at')
          .eq('soc_code', occupation.soc_code)
          .order('created_at', { ascending: false })
          .limit(1)

        const now = new Date()
        const blsWageExpired = !blsWage || blsWage.length === 0 || new Date(blsWage[0].expires_at) < now
        const cosProgramsExpired = !cosPrograms || cosPrograms.length === 0 || new Date(cosPrograms[0].expires_at) < now

        return {
          socCode: occupation.soc_code,
          occupationTitle: occupation.title,
          status: status?.enrichment_status || 'pending',
          lastAttempt: status?.last_enrichment_attempt || null,
          blsWageUpdated: status?.bls_wage_updated_at || null,
          cosProgramsUpdated: status?.cos_programs_updated_at || null,
          errorMessage: status?.error_message || null,
          cacheStatus: {
            blsWageExpired,
            cosProgramsExpired
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      occupations: enrichmentData
    })

  } catch (error) {
    console.error('Error fetching occupation enrichment status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch occupation enrichment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
