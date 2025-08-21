'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/ui/user-menu'
import { GiveFeedbackDialog } from '@/components/ui/give-feedback-dialog'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Jobs', href: '/jobs' },
  { name: 'Programs', href: '/programs' },
  { name: 'My Assessments', href: '/my-assessments' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="w-full px-8">
        <div className="flex items-center gap-8 py-6">
          {/* Logo section */}
          <div className="flex flex-col justify-center items-start gap-2">
            <Link href="/" className="flex items-center">
              <img 
                src="/logo_skillsync_hirestpeteway_lockup.svg" 
                alt="SkillSync - Powered by Bisk Amplified" 
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-10 flex-1 justify-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex px-4 py-2 justify-center items-center gap-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-white'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                style={pathname === item.href ? { backgroundColor: '#0694A2' } : {}}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <GiveFeedbackDialog />
            
            {/* User menu */}
            <UserMenu 
              user={{
                name: "Keith Woods",
                email: "keith-woods@bisk.com"
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  )
}
