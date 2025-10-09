'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BUTTON_STYLES } from '@/lib/design-system'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    // Get email from URL params or session
    const emailParam = searchParams?.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Try to get from session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setEmail(session.user.email)
        }
      })
    }

    // Check if user is already verified and redirect
    checkVerificationStatus()
    
    // Poll for verification status every 3 seconds
    const interval = setInterval(checkVerificationStatus, 3000)
    return () => clearInterval(interval)
  }, [searchParams])

  const checkVerificationStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // If user has a session and email is confirmed, redirect to app
      if (session?.user?.email_confirmed_at) {
        toast({
          title: "Email Verified!",
          description: "Redirecting you to SkillSync...",
        })
        
        // Small delay for toast to show
        setTimeout(() => {
          router.push('/')
        }, 1500)
      }
    } catch (error) {
      console.error('Error checking verification status:', error)
    }
  }

  useEffect(() => {
    // Countdown timer for resend cooldown
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please provide your email address to resend verification.",
        variant: "destructive",
      })
      return
    }

    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) throw error

      toast({
        title: "Email Sent!",
        description: "We've sent a new verification link to your email.",
      })
      
      setResendCooldown(60) // 60 second cooldown
    } catch (error: any) {
      console.error('Resend error:', error)
      toast({
        title: "Failed to Resend",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="auth-page h-full flex items-center justify-center bg-gray-50 px-4">
      <div className="flex items-center justify-center max-w-6xl w-full" style={{ gap: '88px' }}>
        {/* Left side - Content */}
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

          {/* Content */}
          <div className="space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#0694A2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-[36px] leading-[40px] font-bold text-[#114B5F] tracking-[-1px] font-source-sans-pro mb-2">
                Check Your Email
              </h1>
              <p className="text-base text-gray-600">
                We've sent a verification link to
              </p>
              {email && (
                <p className="text-base font-medium text-[#0694A2] mt-1">
                  {email}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                Click the link in the email to verify your account. The link will expire in 24 hours.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Didn't receive the email? Check your spam folder or
              </p>
              
              <Button
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
                variant="outline"
                className="w-full border-[#0694A2] text-[#0694A2] hover:bg-[#0694A2] hover:text-white"
              >
                {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Already verified?{' '}
                <Link 
                  href="/auth/signin" 
                  className="text-[#0694A2] hover:underline font-medium"
                >
                  Sign In
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
