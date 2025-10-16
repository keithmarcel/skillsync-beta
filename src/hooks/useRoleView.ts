import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { trackRoleView } from '@/lib/services/role-views'

/**
 * Hook to track role views
 * Call this in role detail pages to automatically track when a user views a role
 */
export function useRoleView(jobId: string | null | undefined) {
  const { user } = useAuth()

  useEffect(() => {
    if (!jobId) return

    // Generate or get session ID for anonymous tracking
    let sessionId = sessionStorage.getItem('skillsync_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('skillsync_session_id', sessionId)
    }

    // Track the view
    trackRoleView(
      jobId,
      user?.id,
      sessionId,
      document.referrer
    )
  }, [jobId, user?.id])
}
