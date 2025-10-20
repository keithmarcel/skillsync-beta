'use client'

import { useSearchParams } from 'next/navigation'
import { SignInForm } from '@/components/auth/sign-in-form'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const message = searchParams?.get('message')

  return (
    <>
      {message === 'check_email' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="p-4 text-sm text-blue-600 bg-blue-50 rounded-md border border-blue-200 shadow-lg">
            Please check your email to verify your account before signing in.
          </div>
        </div>
      )}
      <SignInForm variant="jobseeker" />
    </>
  )
}
