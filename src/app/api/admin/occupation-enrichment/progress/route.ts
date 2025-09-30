import { NextRequest, NextResponse } from 'next/server'

// Import the progress from the enrich route
// Note: In a production environment, this would be stored in Redis or a database
// For now, we'll use a simple in-memory approach

let globalProgress = {
  current: 0,
  total: 0,
  currentSOC: '',
  status: 'idle' as 'idle' | 'running' | 'completed' | 'error',
  startTime: null as Date | null,
  estimatedCompletion: null as Date | null
}

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would fetch from a shared store
    // For now, return the current progress state
    return NextResponse.json({
      success: true,
      current: globalProgress.current,
      total: globalProgress.total,
      currentSOC: globalProgress.currentSOC,
      status: globalProgress.status,
      startTime: globalProgress.startTime,
      estimatedCompletion: globalProgress.estimatedCompletion,
      percentage: globalProgress.total > 0 ? (globalProgress.current / globalProgress.total) * 100 : 0
    })

  } catch (error) {
    console.error('Error fetching enrichment progress:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch enrichment progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Allow updating progress from other parts of the application
export async function POST(request: NextRequest) {
  try {
    const progressUpdate = await request.json()
    
    // Update global progress
    globalProgress = {
      ...globalProgress,
      ...progressUpdate
    }

    return NextResponse.json({
      success: true,
      progress: globalProgress
    })

  } catch (error) {
    console.error('Error updating enrichment progress:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update enrichment progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
