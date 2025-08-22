'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { UserMenu } from '@/components/ui/user-menu'
import { GiveFeedbackDialog } from '@/components/ui/give-feedback-dialog'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Heart, BookOpen, User, Home, Briefcase, GraduationCap, FileText, MessageSquare } from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Programs', href: '/programs', icon: GraduationCap },
  { name: 'My Assessments', href: '/my-assessments', icon: FileText },
]

const quickActions = [
  { name: 'Saved Jobs', href: '/jobs?tab=favorites', icon: Heart, count: 3 },
  { name: 'Saved Programs', href: '/programs?tab=favorites', icon: BookOpen, count: 2 },
  { name: 'Give Feedback', href: null, icon: MessageSquare, count: 0, isButton: true },
]

export function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="w-full px-4 sm:px-8">
        <div className="flex items-center gap-4 sm:gap-8 py-4 sm:py-6">
          {/* Logo section */}
          <div className="flex flex-col justify-center items-start gap-2">
            <Link href="/" className="flex items-center">
              <img 
                src="/logo_skillsync_hirestpeteway_lockup.svg" 
                alt="SkillSync - Powered by Bisk Amplified" 
                className="h-10 sm:h-12 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation links */}
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
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <div className="hidden sm:block">
              <GiveFeedbackDialog />
            </div>
            
            {/* Mobile menu trigger */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-8 w-8" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
                  <div className="flex flex-col h-full">
                    {/* User info at top */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                      <div className="w-10 h-10 bg-[#0694A2] rounded-full flex items-center justify-center text-white font-medium">
                        KW
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Keith Woods</p>
                        <p className="text-sm text-gray-500">keith-woods@bisk.com</p>
                      </div>
                    </div>

                    {/* Main navigation */}
                    <div className="flex-1 py-4">
                      <div className="space-y-1 px-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                          Navigation
                        </p>
                        {navigation.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                                pathname === item.href
                                  ? 'bg-[#0694A2] text-white'
                                  : 'text-gray-900 hover:bg-gray-50'
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                              {item.name}
                            </Link>
                          )
                        })}
                      </div>

                      {/* Quick actions */}
                      <div className="mt-6 px-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                          Quick Actions
                        </p>
                        <div className="space-y-1">
                          {quickActions.map((item) => {
                            const Icon = item.icon
                            
                            if (item.isButton) {
                              return (
                                <GiveFeedbackDialog key={item.name}>
                                  <button className="flex items-center justify-between px-3 py-3 rounded-lg text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors w-full text-left">
                                    <div className="flex items-center gap-3">
                                      <Icon className="h-5 w-5" />
                                      {item.name}
                                    </div>
                                  </button>
                                </GiveFeedbackDialog>
                              )
                            }
                            
                            return (
                              <Link
                                key={item.name}
                                href={item.href!}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between px-3 py-3 rounded-lg text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className="h-5 w-5" />
                                  {item.name}
                                </div>
                                {item.count > 0 && (
                                  <span className="bg-[#0694A2] text-white text-xs font-medium px-2 py-1 rounded-full">
                                    {item.count}
                                  </span>
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Account actions at bottom */}
                    <div className="border-t border-gray-200 p-4">
                      <div className="space-y-1">
                        <Link
                          href="/account-settings"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          <User className="h-5 w-5" />
                          Account Settings
                        </Link>
                        <button
                          onClick={() => {
                            setIsOpen(false)
                            // Add sign out logic here
                          }}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Desktop User menu */}
            <div className="hidden md:block">
              <UserMenu 
                user={{
                  name: "Keith Woods",
                  email: "keith-woods@bisk.com"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
