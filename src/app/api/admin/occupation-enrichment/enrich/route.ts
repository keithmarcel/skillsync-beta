import { NextRequest, NextResponse } from 'next/server'
import { OccupationEnrichmentService } from '@/lib/services/occupation-enrichment'

// Global progress tracking
let enrichmentProgress = {
  current: 0,
  total: 0,
  currentSOC: '',
  status: 'idle' as 'idle' | 'running' | 'completed' | 'error',
  startTime: null as Date | null,
  estimatedCompletion: null as Date | null
}

export async function POST(request: NextRequest) {
  try {
    const { socCodes, forceRefresh = false } = await request.json()

    if (!socCodes || !Array.isArray(socCodes) || socCodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'SOC codes array is required' },
        { status: 400 }
      )
    }

    // Check if enrichment is already running
    if (enrichmentProgress.status === 'running') {
      return NextResponse.json(
        { success: false, error: 'Enrichment already in progress' },
        { status: 409 }
      )
    }

    // Initialize progress tracking
    enrichmentProgress = {
      current: 0,
      total: socCodes.length,
      currentSOC: socCodes[0],
      status: 'running',
      startTime: new Date(),
      estimatedCompletion: null
    }

    // Start enrichment process asynchronously
    processEnrichmentBatch(socCodes, forceRefresh)

    return NextResponse.json({
      success: true,
      message: `Started enrichment for ${socCodes.length} occupations`,
      progress: enrichmentProgress
    })

  } catch (error) {
    console.error('Error starting occupation enrichment:', error)
    enrichmentProgress.status = 'error'
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start occupation enrichment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function processEnrichmentBatch(socCodes: string[], forceRefresh: boolean) {
  const enrichmentService = new OccupationEnrichmentService()
  
  console.log('🚀 Starting enrichment batch for SOC codes:', socCodes)
  
  try {
    for (let i = 0; i < socCodes.length; i++) {
      const socCode = socCodes[i]
      
      console.log(`📊 Enriching ${i + 1}/${socCodes.length}: ${socCode}`)
      
      // Update progress
      enrichmentProgress.current = i
      enrichmentProgress.currentSOC = socCode
      
      // Calculate estimated completion time
      if (i > 0 && enrichmentProgress.startTime) {
        const elapsed = Date.now() - enrichmentProgress.startTime.getTime()
        const avgTimePerSOC = elapsed / i
        const remainingSOCs = socCodes.length - i
        const estimatedRemainingTime = remainingSOCs * avgTimePerSOC
        enrichmentProgress.estimatedCompletion = new Date(Date.now() + estimatedRemainingTime)
      }

      try {
        // Enrich individual occupation
        console.log(`🔄 Calling enrichOccupation for ${socCode}...`)
        const result = await enrichmentService.enrichOccupation(socCode, forceRefresh)
        
        console.log(`✅ Enrichment result for ${socCode}:`, result)
        
        if (!result.success) {
          console.warn(`⚠️ Failed to enrich SOC ${socCode}:`, result.errors)
        }
        
        // Rate limiting between requests
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Error enriching SOC ${socCode}:`, error)
      }
    }

    // Mark as completed
    enrichmentProgress.current = socCodes.length
    enrichmentProgress.status = 'completed'
    enrichmentProgress.currentSOC = ''
    
    console.log(`Enrichment completed for ${socCodes.length} occupations`)

  } catch (error) {
    console.error('Error in enrichment batch process:', error)
    enrichmentProgress.status = 'error'
  }
}

export async function GET(request: NextRequest) {
  // Return current progress status
  return NextResponse.json({
    success: true,
    progress: enrichmentProgress
  })
}
