import Link from 'next/link'
import { Footer } from '@/components/ui/footer'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with SkillSync Logo - No background, 48px from top */}
      <header className="pt-12">
        <div className="flex justify-center">
          <Link href="/">
            <img 
              src="/app/logo_skillsync-powered-by-bisk-amplified.svg" 
              alt="SkillSync - Powered by Bisk Amplified" 
              className="h-12 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* Main Content - 980px max-width, no border */}
      <main className="max-w-[980px] mx-auto px-6 py-12">
        {children}
      </main>

      {/* Primary Footer */}
      <Footer />
    </div>
  )
}
