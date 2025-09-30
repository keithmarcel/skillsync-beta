// Progress tracking utility for quiz generation
const progressMap = new Map<string, any>()

export function updateProgress(sessionId: string, progress: any) {
  if (sessionId) {
    progressMap.set(sessionId, {
      ...progress,
      timestamp: new Date().toISOString()
    })
  }
}

export function getProgress(sessionId: string) {
  return progressMap.get(sessionId)
}

export function clearProgress(sessionId: string) {
  progressMap.delete(sessionId)
}
