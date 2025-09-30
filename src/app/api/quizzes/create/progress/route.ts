// Server-Sent Events endpoint for quiz generation progress
import { NextRequest, NextResponse } from 'next/server'
import { getProgress } from '@/lib/utils/progress'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      // Send initial connection
      controller.enqueue(encoder.encode('data: {"status":"connected"}\n\n'))
      
      // Check for progress updates every 500ms
      const interval = setInterval(() => {
        const progress = getProgress(sessionId)
        if (progress) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`))
          
          // Clean up when complete
          if (progress.status === 'completed' || progress.status === 'error') {
            clearInterval(interval)
            controller.close()
          }
        }
      }, 500)

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
