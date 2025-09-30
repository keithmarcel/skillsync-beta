import { NextRequest, NextResponse } from 'next/server'
import { OccupationEnrichmentService } from '@/lib/services/occupation-enrichment'

export async function POST(request: NextRequest) {
  try {
    const enrichmentService = new OccupationEnrichmentService()
    
    // Clean expired cache entries
    const deletedCount = await enrichmentService.cleanExpiredCache()

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleaned ${deletedCount} expired cache entries`
    })

  } catch (error) {
    console.error('Error cleaning expired cache:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clean expired cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
