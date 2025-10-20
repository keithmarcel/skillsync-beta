'use client'

import { useSearchParams } from 'next/navigation'
import { SignInForm } from '@/components/auth/sign-in-form'
import { PortalRedirectAlert } from '@/components/auth/portal-redirect-alert'

export default function ProviderSignInPage() {
  const searchParams = useSearchParams()
  const alert = searchParams?.get('alert')

  return (
    <>
      {alert === 'portal-signin' && <PortalRedirectAlert portalName="Provider" />}
      <SignInForm variant="provider" showSignUpLink={false} />
    </>
  )
}
