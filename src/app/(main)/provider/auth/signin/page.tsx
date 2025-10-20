'use client'

import { useSearchParams } from 'next/navigation'
import { SignInForm } from '@/components/auth/sign-in-form'

export default function ProviderSignInPage() {
  const searchParams = useSearchParams()
  const alert = searchParams?.get('alert')

  return (
    <>
      {alert === 'wrong-portal' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="p-4 text-sm text-amber-600 bg-amber-50 rounded-md border border-amber-200 shadow-lg">
            <strong>Provider Portal Required:</strong> Please sign in here to access your provider dashboard.
          </div>
        </div>
      )}
      <SignInForm variant="provider" showSignUpLink={false} />
    </>
  )
}
