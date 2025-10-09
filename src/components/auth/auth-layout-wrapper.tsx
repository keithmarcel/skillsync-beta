'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/ui/footer'
import { ViewAsBanner } from '@/components/ViewAsBanner'

export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth/')

  if (isAuthPage) {
    return (
      <div className="h-screen overflow-hidden">
        {children}
      </div>
    )
  }

  return (
    <>
      <ViewAsBanner />
      <Navbar />
      <main className="min-h-screen pt-12 sm:pt-20">
        {children}
      </main>
      <Footer />
    </>
  )
}
