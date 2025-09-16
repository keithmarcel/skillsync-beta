'use client'

import * as React from 'react'
import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔍 Getting initial session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Session error:', error)
      }
      
      if (session) {
        console.log('✅ Session found:', {
          userId: session.user.id,
          email: session.user.email,
          expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : 'unknown'
        })
      } else {
        console.log('❌ No session found')
      }
      
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'no user')
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (data: any) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          zip_code: data.zipCode,
          agreed_to_terms: data.agreeToTerms,
        }
      }
    })
    if (error) throw error
    
    // Create profile record if user was created successfully
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          role: data.role || 'basic_user',
          first_name: data.firstName,
          last_name: data.lastName,
          zip_code: data.zipCode,
          agreed_to_terms: data.agreeToTerms || false,
        })
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't throw here as the user was created successfully
        // The profile can be created later via a database trigger or manual process
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { user, loading, signIn, signUp, signOut, resetPassword } },
    children
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Mock user for development - remove when real auth is implemented
export function useMockAuth() {
  return {
    user: {
      id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
      email: 'user@example.com',
      name: 'John Doe'
    },
    loading: false,
    signOut: async () => console.log('Mock sign out')
  }
}
