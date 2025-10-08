/**
 * SOC Codes API Route
 * Returns list of SOC codes with processing status
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Common SOC codes for initial implementation
const COMMON_SOC_CODES = [
  { code: '15-1253.00', title: 'Software Developers' },
  { code: '15-1252.00', title: 'Software Developers, Applications' },
  { code: '15-1251.00', title: 'Computer Programmers' },
  { code: '15-1244.00', title: 'Network and Computer Systems Administrators' },
  { code: '15-1232.00', title: 'Computer User Support Specialists' },
  { code: '29-1141.00', title: 'Registered Nurses' },
  { code: '29-1171.00', title: 'Nurse Practitioners' },
  { code: '29-2061.00', title: 'Licensed Practical and Licensed Vocational Nurses' },
  { code: '13-2051.00', title: 'Financial Analysts' },
  { code: '13-2011.00', title: 'Accountants and Auditors' },
  { code: '13-1111.00', title: 'Management Analysts' },
  { code: '11-1021.00', title: 'General and Operations Managers' },
  { code: '25-2021.00', title: 'Elementary School Teachers' },
  { code: '25-2031.00', title: 'Secondary School Teachers' },
  { code: '47-2111.00', title: 'Electricians' },
  { code: '47-2031.00', title: 'Carpenters' },
  { code: '53-3032.00', title: 'Heavy and Tractor-Trailer Truck Drivers' },
  { code: '41-2031.00', title: 'Retail Salespersons' },
  { code: '35-3023.00', title: 'Fast Food and Counter Workers' },
  { code: '43-6014.00', title: 'Secretaries and Administrative Assistants' }
]

export async function GET() {
  try {
    // Get all SOC codes that have curated skills
    const { data: processedSocs, error } = await supabase
      .from('soc_skills')
      .select('soc_code')
      .order('soc_code')

    if (error) {
      console.error('Database error:', error)
    }

    // Create a Set of processed SOC codes for quick lookup
    const processedSet = new Set(
      processedSocs?.map(row => row.soc_code) || []
    )

    // Map SOC codes with processing status
    const socCodesWithStatus = COMMON_SOC_CODES.map(soc => ({
      ...soc,
      hasSkills: processedSet.has(soc.code),
      processed: processedSet.has(soc.code)
    }))

    // Sort: processed first, then alphabetically
    socCodesWithStatus.sort((a, b) => {
      if (a.processed !== b.processed) {
        return a.processed ? -1 : 1
      }
      return a.code.localeCompare(b.code)
    })

    return NextResponse.json({
      socCodes: socCodesWithStatus,
      totalProcessed: processedSet.size
    })

  } catch (error) {
    console.error('SOC codes fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SOC codes' },
      { status: 500 }
    )
  }
}
