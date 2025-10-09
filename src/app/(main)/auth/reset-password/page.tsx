'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { BUTTON_STYLES } from '@/lib/design-system'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValidToken, setIsValidToken] = useState(false)

  useEffect(() => {
    // Check if user has a valid session from the email link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidToken(true)
      } else {
        toast({
          title: "Invalid or Expired Link",
          description: "Please request a new password reset link.",
          variant: "destructive",
        })
        setTimeout(() => router.push('/auth/forgot-password'), 3000)
      }
    })
  }, [router, toast])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) throw error
      
      toast({
        title: "Password Updated!",
        description: "Your password has been successfully reset.",
      })
      
      // Redirect to dashboard
      router.push('/')
    } catch (error: any) {
      console.error('Reset password error:', error)
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      })
      setErrors({ general: error.message || 'Failed to reset password. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <div className="auth-page h-full flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6">
            <img
              src="/app/logo_skillsync-powered-by-bisk-amplified.svg"
              alt="SkillSync - Powered by Bisk Amplified"
              className="h-12 w-auto mx-auto"
            />
          </div>
          <p className="text-gray-600">Validating reset link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page h-full flex items-center justify-center bg-gray-50 px-4">
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
              Reset Password
            </h1>
            <p className="text-base text-gray-600">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                {errors.general}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">
                New Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: '' }))
                  }
                }}
                className={errors.password ? 'border-red-500 focus:ring-red-500' : ''}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500">Minimum 8 characters</p>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: '' }))
                  }
                }}
                className={errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}
                disabled={isLoading}
                required
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full ${BUTTON_STYLES.primary}`}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>

          <div className="text-center pt-4">
            <Link 
              href="/auth/signin" 
              className="text-sm text-[#0694A2] hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
