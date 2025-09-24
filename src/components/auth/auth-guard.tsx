'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Debug auth guard state
  console.log('🛡️ AuthGuard state:', { user: !!user, loading, pathname, mounted })

  // List of public routes that don't require authentication
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup', 
    '/auth/reset-password',
    '/auth/callback'
  ]

  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    if (!mounted || loading) return
    
    if (!user && !isPublicRoute) {
      // Redirect unauthenticated users to sign up page
      router.push('/auth/signup')
    } else if (user && isPublicRoute) {
      // Redirect authenticated users away from auth pages to home
      router.push('/')
    }
  }, [user, loading, isPublicRoute, router, mounted])

  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  // Show content if user is authenticated or on public route
  if (user || isPublicRoute) {
    return <>{children}</>
  }

  // This shouldn't happen due to the redirect, but just in case
  return null
}
