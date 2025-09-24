'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthBackground } from '@/components/auth/auth-background'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email is required')
      return
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      // Use real Supabase password reset
      await resetPassword(email)
      
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      })
      
      setIsSubmitted(true)
    } catch (error: any) {
      console.error('Reset password error:', error)
      const errorMessage = error.message || 'Failed to send reset email. Please try again.'
      setError(errorMessage)
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Animated background */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <AuthBackground />
        </div>

        {/* Right side - Success message */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md space-y-8 text-center">
            {/* Logo */}
            <Image
              src="/logo_skillsync_hirestpeteway_lockup.svg"
              alt="SkillSync"
              width={200}
              height={60}
              className="mx-auto"
            />

            <div className="space-y-4">
              <h1 className="text-2xl font-semibold text-gray-900">Check your email</h1>
              <p className="text-gray-600">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or{' '}
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="text-[#0694A2] hover:underline"
                >
                  try again
                </button>
              </p>
              
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full mt-4">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex auth-page">
      {/* Left side - Animated background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <AuthBackground />
      </div>

      {/* Right side - Reset password form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Image
              src="/logo_skillsync_hirestpeteway_lockup.svg"
              alt="SkillSync"
              width={200}
              height={60}
              className="mx-auto"
            />
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900">Reset Password</h1>
              <p className="mt-2 text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  className={error ? 'border-red-500' : ''}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0694A2] hover:bg-[#0694A2]/90 text-white py-3"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="text-center">
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
    </div>
  )
}
