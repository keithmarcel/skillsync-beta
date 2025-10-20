'use client'

import { useSearchParams } from 'next/navigation'
import { SignInForm } from '@/components/auth/sign-in-form'
import { PortalRedirectAlert } from '@/components/auth/portal-redirect-alert'

export default function EmployerSignInPage() {
  const searchParams = useSearchParams()
  const alert = searchParams?.get('alert')

  return (
    <>
      {alert === 'portal-signin' && <PortalRedirectAlert portalName="Employer" />}
      <SignInForm variant="employer" showSignUpLink={false} />
    </>
  )
}
