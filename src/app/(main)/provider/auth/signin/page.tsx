'use client'

import { useSearchParams } from 'next/navigation'
import { SignInForm } from '@/components/auth/sign-in-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function ProviderSignInPage() {
  const searchParams = useSearchParams()
  const alert = searchParams?.get('alert')

  return (
    <>
      {alert === 'wrong-portal' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
          <Alert variant="default" className="border-amber-200 bg-amber-50 shadow-lg">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Provider Portal Required:</strong> Please sign in here to access your provider dashboard.
            </AlertDescription>
          </Alert>
        </div>
      )}
      <SignInForm variant="provider" showSignUpLink={false} />
    </>
  )
}
