'use client'

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { authService, UserProfile, UserRole } from '@/lib/auth/supabase-auth'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  isSuperAdmin: boolean
  isPartnerAdmin: boolean
  isOrgUser: boolean
  isBasicUser: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
        
        if (currentUser) {
          const userProfile = await authService.getUserProfile(currentUser.id)
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('Error getting initial user:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialUser()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      setUser(user)
      
      if (user) {
        const userProfile = await authService.getUserProfile(user.id)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await authService.signIn({ email, password })
    } catch (error) {
      throw error
    }
  }

  const signUp = async (data: any) => {
    try {
      await authService.signUp(data)
    } catch (error) {
      throw error
    }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
    } catch (error) {
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email)
    } catch (error) {
      throw error
    }
  }

  const hasRole = (role: UserRole): boolean => {
    return profile?.role === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return profile ? roles.includes(profile.role) : false
  }

  const isSuperAdmin = profile?.role === 'super_admin'
  const isPartnerAdmin = profile?.role === 'partner_admin'
  const isOrgUser = profile?.role === 'org_user'
  const isBasicUser = profile?.role === 'basic_user'

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isPartnerAdmin,
    isOrgUser,
    isBasicUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default useAuth
