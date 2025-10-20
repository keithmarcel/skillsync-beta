'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { BUTTON_STYLES } from '@/lib/design-system'
import { supabase } from '@/lib/supabase/client'
import type { Profile } from '@/hooks/useAuth'

export type SignInVariant = 'jobseeker' | 'employer' | 'provider'

interface SignInFormProps {
  variant: SignInVariant
  branding?: {
    title?: string
    subtitle?: string
    logoUrl?: string
    welcomeGraphicUrl?: string
  }
  showSignUpLink?: boolean
  onSuccess?: (profile: Profile) => void
}

const DEFAULT_BRANDING = {
  jobseeker: {
    title: 'Sign In',
    subtitle: 'Welcome back! Please sign in to continue.',
    logoUrl: '/app/logo_skillsync-powered-by-bisk-amplified.svg',
    welcomeGraphicUrl: '/assets/skillsync_welcome.svg',
  },
  employer: {
    title: 'Employer Sign In',
    subtitle: 'Access your employer dashboard to manage roles and assessments.',
    logoUrl: '/app/logo_skillsync-powered-by-bisk-amplified.svg',
    welcomeGraphicUrl: '/assets/skillsync_welcome.svg',
  },
  provider: {
    title: 'Provider Sign In',
    subtitle: 'Access your provider dashboard to manage programs and partnerships.',
    logoUrl: '/app/logo_skillsync-powered-by-bisk-amplified.svg',
    welcomeGraphicUrl: '/assets/skillsync_welcome.svg',
  },
}

export function SignInForm({ 
  variant, 
  branding, 
  showSignUpLink = true,
  onSuccess 
}: SignInFormProps) {
  const { signIn } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const finalBranding = {
    ...DEFAULT_BRANDING[variant],
    ...branding,
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePortalAccess = async (userId: string): Promise<{
    isValid: boolean
    profile: Profile | null
    correctPortal?: string
    message?: string
  }> => {
    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return { isValid: false, profile: null, message: 'Could not load user profile' }
    }

    // Super admins can access any portal
    if (profile.admin_role === 'super_admin') {
      return { isValid: true, profile }
    }

    // Check if user is on correct portal
    const isEmployerAdmin = profile.role === 'employer_admin' || profile.admin_role === 'company_admin'
    const isProviderAdmin = profile.role === 'provider_admin' || profile.admin_role === 'provider_admin'

    if (variant === 'employer' && !isEmployerAdmin) {
      return {
        isValid: false,
        profile,
        correctPortal: isProviderAdmin ? '/provider/auth/signin' : '/auth/signin',
        message: isProviderAdmin 
          ? 'Please use the Provider Portal to sign in.'
          : 'This portal is for employers only. Please use the main sign-in page.',
      }
    }

    if (variant === 'provider' && !isProviderAdmin) {
      return {
        isValid: false,
        profile,
        correctPortal: isEmployerAdmin ? '/employer/auth/signin' : '/auth/signin',
        message: isEmployerAdmin
          ? 'Please use the Employer Portal to sign in.'
          : 'This portal is for providers only. Please use the main sign-in page.',
      }
    }

    if (variant === 'jobseeker' && (isEmployerAdmin || isProviderAdmin)) {
      return {
        isValid: false,
        profile,
        correctPortal: isEmployerAdmin ? '/employer/auth/signin' : '/provider/auth/signin',
        message: isEmployerAdmin
          ? 'Please use the Employer Portal to sign in.'
          : 'Please use the Provider Portal to sign in.',
      }
    }

    return { isValid: true, profile }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      await signIn(formData.email, formData.password)
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Authentication failed')
      }

      // Validate portal access
      const validation = await validatePortalAccess(user.id)

      if (!validation.isValid) {
        // Wrong portal - redirect to correct portal (alert will show there)
        if (validation.correctPortal) {
          window.location.href = `${validation.correctPortal}?alert=portal-signin`
        }
        return
      }

      // Success - call onSuccess callback or redirect
      toast({
        title: "Welcome back!",
        description: "You have been successfully signed in.",
      })

      if (onSuccess && validation.profile) {
        onSuccess(validation.profile)
      } else {
        // Use full page reload to ensure auth state is properly loaded
        const redirectMap = {
          jobseeker: '/',
          employer: '/employer',
          provider: '/provider',
        }
        window.location.href = redirectMap[variant]
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      })
      setErrors({ general: error.message || 'Invalid email or password' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="flex items-center justify-center max-w-6xl w-full" style={{ gap: '88px' }}>
        {/* Left side - Sign in form */}
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-6">
            <img
              src={finalBranding.logoUrl}
              alt="SkillSync - Powered by Bisk Amplified"
              className="h-12 w-auto"
            />
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 mb-6"></div>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-[36px] leading-[40px] font-bold text-[#114B5F] tracking-[-1px] font-source-sans-pro mb-2">
                {finalBranding.title}
              </h1>
              <p className="text-base text-gray-600">
                {finalBranding.subtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                  {errors.general}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500 focus:ring-red-500' : ''}
                  disabled={isLoading}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-[#0694A2] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={errors.password ? 'border-red-500 focus:ring-red-500' : ''}
                  disabled={isLoading}
                  required
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full ${BUTTON_STYLES.primary}`}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {showSignUpLink && variant === 'jobseeker' && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link 
                    href="/auth/signup" 
                    className="text-[#0694A2] hover:underline font-medium"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Welcome graphic */}
        <div className="hidden lg:block flex-shrink-0">
          <img
            src={finalBranding.welcomeGraphicUrl}
            alt="Welcome to SkillSync"
            className="w-[572px] h-auto"
          />
        </div>
      </div>
    </div>
  )
}
