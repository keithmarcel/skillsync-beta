'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { BUTTON_STYLES } from '@/lib/design-system'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Show message if redirected from signup
  const message = searchParams?.get('message')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      await signIn(formData.email, formData.password)
      
      toast({
        title: "Welcome back!",
        description: "You have been successfully signed in.",
      })
      
      router.push('/')
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
    <div className="auth-page h-full flex items-center justify-center bg-gray-50 px-4">
      <div className="flex items-center justify-center max-w-6xl w-full" style={{ gap: '88px' }}>
        {/* Left side - Sign in form */}
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="/app/logo_skillsync-powered-by-bisk-amplified.svg"
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
                Sign In
              </h1>
              <p className="text-base text-gray-600">
                Welcome back! Please sign in to continue.
              </p>
            </div>

            {message === 'check_email' && (
              <div className="p-4 text-sm text-blue-600 bg-blue-50 rounded-md border border-blue-200">
                Please check your email to verify your account before signing in.
              </div>
            )}

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
          </div>
        </div>

        {/* Right side - Welcome graphic */}
        <div className="hidden lg:block flex-shrink-0">
          <img
            src="/assets/skillsync_welcome.svg"
            alt="Welcome to SkillSync"
            className="w-[572px] h-auto"
          />
        </div>
      </div>
    </div>
  )
}
