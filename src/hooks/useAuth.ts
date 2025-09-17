'use client'

import * as React from 'react'
import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  role: string
  first_name?: string
  last_name?: string
  zip_code?: string
  admin_role?: 'super_admin' | 'company_admin' | 'provider_admin' | null
  company_id?: string | null
  school_id?: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isCompanyAdmin: boolean
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
    // The middleware ensures the session is available on the client. We just need to read it.
    const getInitialData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      }
      setLoading(false);
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
  }, []);

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

  // Computed admin role properties
  const value = {
    user,
    profile,
    loading,
    isAdmin: !!profile?.admin_role,
    isSuperAdmin: profile?.admin_role === 'super_admin',
    isCompanyAdmin: profile?.admin_role === 'company_admin',
    isProviderAdmin: profile?.admin_role === 'provider_admin',
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

