'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingState } from '@/components/ui/loading-state'

interface AdminGuardProps {
  children: React.ReactNode
  requiredRole?: 'super_admin' | 'company_admin' | 'provider_admin'
  fallbackPath?: string
}

export function AdminGuard({ 
  children, 
  requiredRole,
  fallbackPath = '/' 
}: AdminGuardProps) {
  const { user, profile, loading, isAdmin, isSuperAdmin, isCompanyAdmin, isProviderAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Not authenticated
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Not an admin at all
    if (!isAdmin) {
      router.push(fallbackPath)
      return
    }

    // Check specific role requirements
    if (requiredRole) {
      const hasRequiredRole = 
        (requiredRole === 'super_admin' && isSuperAdmin) ||
        (requiredRole === 'company_admin' && (isCompanyAdmin || isSuperAdmin)) ||
        (requiredRole === 'provider_admin' && (isProviderAdmin || isSuperAdmin))

      if (!hasRequiredRole) {
        router.push(fallbackPath)
        return
      }
    }
  }, [user, profile, loading, isAdmin, isSuperAdmin, isCompanyAdmin, isProviderAdmin, requiredRole, router, fallbackPath])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState variant="spinner" size="lg" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  if (requiredRole) {
    const hasRequiredRole = 
      (requiredRole === 'super_admin' && isSuperAdmin) ||
      (requiredRole === 'company_admin' && (isCompanyAdmin || isSuperAdmin)) ||
      (requiredRole === 'provider_admin' && (isProviderAdmin || isSuperAdmin))

    if (!hasRequiredRole) {
      return null
    }
  }

  return <>{children}</>
}
