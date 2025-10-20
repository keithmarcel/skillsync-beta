'use client'

import { useSearchParams } from 'next/navigation'
import { SignInForm } from '@/components/auth/sign-in-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function EmployerSignInPage() {
  const searchParams = useSearchParams()
  const alert = searchParams?.get('alert')

  return (
    <div className="relative min-h-screen">
      {alert === 'wrong-portal' && (
        <div className="fixed top-[88px] left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Employer Portal Required:</strong> Please sign in here to access your employer dashboard.
            </AlertDescription>
          </Alert>
        </div>
      )}
      <SignInForm variant="employer" showSignUpLink={false} />
    </div>
  )
}
