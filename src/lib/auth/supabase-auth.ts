'use client'

import { createBrowserClient } from '@supabase/ssr'
import { User, AuthError } from '@supabase/supabase-js'

export type UserRole = 'super_admin' | 'partner_admin' | 'org_user' | 'basic_user'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  first_name?: string
  last_name?: string
  zip_code?: string
  avatar_url?: string
  agreed_to_terms?: boolean
  created_at: string
  updated_at: string
}

export interface SignUpData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  zipCode?: string
  agreeToTerms?: boolean
  role?: UserRole
}

export interface SignInData {
  email: string
  password: string
}

class SupabaseAuthService {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async signUp(data: SignUpData) {
    try {
      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No user returned from signup')

      // Create user profile
      const { error: profileError } = await this.supabase
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

      if (profileError) throw profileError

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  async signIn(data: SignInData) {
    try {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error
      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      })
      if (error) throw error
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data as UserProfile
    } catch (error) {
      console.error('Get user profile error:', error)
      return null
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Update user profile error:', error)
      throw error
    }
  }

  // Auth state change listener
  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange((event: any, session: any) => {
      callback(session?.user ?? null)
    })
  }

  // Role-based access control helpers
  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId)
      return profile?.role === role
    } catch (error) {
      console.error('Check role error:', error)
      return false
    }
  }

  async hasAnyRole(userId: string, roles: UserRole[]): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId)
      return profile ? roles.includes(profile.role) : false
    } catch (error) {
      console.error('Check any role error:', error)
      return false
    }
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'super_admin')
  }

  async isPartnerAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'partner_admin')
  }

  async isOrgUser(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'org_user')
  }

  async isBasicUser(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'basic_user')
  }
}

export const authService = new SupabaseAuthService()
export default authService
