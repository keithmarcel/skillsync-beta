'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { BUTTON_STYLES } from '@/lib/design-system'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1 - Required Data
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    
    // Step 2 - Optional Data
    firstName: '',
    lastName: '',
    linkedinUrl: '',
    visibleToEmployers: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms & Conditions'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep1()) {
      setStep(2)
    }
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    // If visible to employers is checked, require name and LinkedIn
    if (formData.visibleToEmployers) {
      if (!formData.firstName || !formData.lastName) {
        newErrors.general = 'First and last name are required when opting in to employer invites'
        return false
      }
      
      if (!formData.linkedinUrl) {
        newErrors.linkedinUrl = 'LinkedIn profile URL is required when opting in to employer invites'
        return false
      }
      
      // Validate LinkedIn URL format
      const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/.+/i
      if (!linkedinPattern.test(formData.linkedinUrl)) {
        newErrors.linkedinUrl = 'Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)'
        return false
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep2()) return
    
    setIsLoading(true)
    try {
      // Use real Supabase authentication
      await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        linkedinUrl: formData.linkedinUrl,
        visibleToEmployers: formData.visibleToEmployers,
        agreeToTerms: formData.agreeToTerms
      })
      
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      })
      
      // Redirect to verify email page
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      })
      setErrors({ general: error.message || 'Failed to create account. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSkipStep = async () => {
    // Skip step 2 and create account without employer visibility
    setFormData(prev => ({ ...prev, visibleToEmployers: false, firstName: '', lastName: '', linkedinUrl: '' }))
    
    setIsLoading(true)
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        firstName: '',
        lastName: '',
        linkedinUrl: '',
        visibleToEmployers: false,
        agreeToTerms: formData.agreeToTerms
      })
      
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      })
      
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      })
      setErrors({ general: error.message || 'Failed to create account. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page h-full flex items-center justify-center bg-gray-50 px-4">
      <div className="flex items-center justify-center max-w-6xl w-full" style={{ gap: '88px' }}>
        {/* Left side - Sign up form */}
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

            {step === 1 ? (
              // Step 1: Required Data
              <form onSubmit={handleStep1Next} className="space-y-4">
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
                    placeholder="Email"
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
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
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
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}
                    disabled={isLoading}
                    required
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => 
                      handleInputChange('agreeToTerms', checked as boolean)
                    }
                    className={errors.agreeToTerms ? 'border-red-500' : ''}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{' '}
                    <a 
                      href="/legal/terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#0694A2] hover:underline"
                    >
                      Terms of Use
                    </a>
                  </Label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-sm text-red-600">{errors.agreeToTerms}</p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full ${BUTTON_STYLES.primary}`}
                >
                  Next
                </Button>
              </form>
            ) : (
              // Step 2: Employer Invite Opt-in (Updated)
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                    {errors.general}
                  </div>
                )}

                {/* Heading and Benefits */}
                <div className="space-y-4">
                  <h1 className="text-[36px] leading-[40px] font-bold text-[#114B5F] tracking-[-1px] font-source-sans-pro mb-2">
                    Get Discovered by Employers!
                  </h1>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>Get invited to apply for roles matching your skills</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>Skip the queue and connect directly with hiring managers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>Control your visibility and opt out anytime in Account Settings</span>
                    </li>
                  </ul>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        disabled={isLoading}
                        required={formData.visibleToEmployers}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        disabled={isLoading}
                        required={formData.visibleToEmployers}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedinUrl}
                      onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                      className={errors.linkedinUrl ? 'border-red-500 focus:ring-red-500' : ''}
                      disabled={isLoading}
                      required={formData.visibleToEmployers}
                    />
                    {errors.linkedinUrl && (
                      <p className="text-sm text-red-600">{errors.linkedinUrl}</p>
                    )}
                  </div>

                  {/* Opt-in Checkbox */}
                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox
                      id="visibleToEmployers"
                      checked={formData.visibleToEmployers}
                      onCheckedChange={(checked) => 
                        handleInputChange('visibleToEmployers', checked as boolean)
                      }
                      className="mt-0.5 data-[state=checked]:bg-[#0694A2] data-[state=checked]:border-[#0694A2]"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="visibleToEmployers"
                        className="text-sm font-medium text-gray-900 cursor-pointer leading-tight"
                      >
                        Share your assessment results to get personally invited to roles you qualify for
                      </Label>
                      <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                        Enabling employer invites lets qualified employers view your SkillSync assessment results and invite you to apply for roles that match your proficiency. Your name and LinkedIn profile ensure accurate identification and reduce recruiter spam.{' '}
                        <a
                          href="/legal/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0694A2] hover:underline"
                        >
                          I agree to the Privacy Policy
                        </a>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full ${BUTTON_STYLES.primary}`}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                  
                  <div className="space-y-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSkipStep}
                      disabled={isLoading}
                      className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                      Skip This Step and Create Account
                    </Button>
                    
                    <p className="text-xs text-center text-gray-500">
                      You can opt in later via Account Settings
                    </p>
                  </div>
                </div>
              </form>
            )}
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
