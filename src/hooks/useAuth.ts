'use client'

import * as React from 'react'
import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  role: 'super_admin' | 'provider_admin' | 'employer_admin' | 'user'
  first_name?: string
  last_name?: string
  zip_code?: string
  avatar_url?: string
  linkedin_url?: string
  bio?: string
  company_id?: string | null
  school_id?: string | null
  max_programs?: number
  max_featured_programs?: number
  max_featured_roles?: number
  is_mock_user?: boolean
  agreed_to_terms?: boolean
  visible_to_employers?: boolean
  notif_in_app_invites?: boolean
  notif_in_app_new_roles?: boolean
  notif_email_new_roles?: boolean
  notif_email_invites?: boolean
  notif_email_marketing?: boolean
  notif_email_security?: boolean
  notif_all_disabled?: boolean
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isEmployerAdmin: boolean
  isProviderAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Helper function to fetch user profile
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('❌ Profile fetch error:', error)
      return null
    }
    
    return data as Profile
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // The middleware ensures the session is available on the client. We just need to read it.
    const getInitialData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Error during initial auth data fetch:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialData();

    // Listen for changes to the auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // When the user signs out, the profile should be cleared immediately.
      if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      // The profile will be refetched on the next page load if needed.
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [mounted]);

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
          role: data.role || 'user', // Default to 'user' role
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

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return React.createElement(AuthContext.Provider, { 
      value: {
        user: null,
        profile: null,
        loading: true,
        isAdmin: false,
        isSuperAdmin: false,
        isEmployerAdmin: false,
        isProviderAdmin: false,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }
    }, children);
  }

  // Computed admin role properties based on new role system
  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'super_admin' || profile?.role === 'employer_admin' || profile?.role === 'provider_admin',
    isSuperAdmin: profile?.role === 'super_admin',
    isEmployerAdmin: profile?.role === 'employer_admin',
    isProviderAdmin: profile?.role === 'provider_admin',
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

