'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { UserMenu } from '@/components/ui/user-menu'
import { GiveFeedbackDialog } from '@/components/ui/give-feedback-dialog'
import { NotificationDropdown } from '@/components/ui/notification-dropdown'
import { EmployerNotificationDropdown } from '@/components/employer/employer-notification-dropdown'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Heart, BookOpen, User, Home, Briefcase, GraduationCap, FileText, MessageSquare, LogIn, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'

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

interface NavbarProps {
  companyId?: string // Optional: if provided, shows employer notifications instead of candidate
  variant?: 'default' | 'employer' // Employer variant shows company logo instead of nav links
  companyName?: string
  companyLogo?: string | null
}

export function Navbar({ companyId, variant = 'default', companyName, companyLogo }: NavbarProps = {}) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { user, profile, loading, signOut } = useAuth()

  // Hide navbar on authentication pages
  const isAuthPage = pathname?.startsWith('/auth/')
  if (isAuthPage) {
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="w-full px-4 sm:px-8">
        <div className="flex items-center gap-4 sm:gap-8 py-4 sm:py-6">
          {/* Logo section - matches width of right-side actions for centered nav on desktop */}
          <div className="flex flex-col justify-center items-start gap-2 md:w-[244px]">
            <Link href="/" className="flex items-center">
              <img 
                src="/app/logo_skillsync-powered-by-bisk-amplified.svg" 
                alt="SkillSync - Powered by Bisk Amplified" 
                className="h-10 sm:h-12 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation links OR Company Logo (employer variant) */}
          <div className="hidden md:flex items-center gap-10 flex-1 justify-center">
            {variant === 'employer' ? (
              // Show company logo for employer variant
              <div className="flex items-center gap-3">
                {companyLogo ? (
                  <img 
                    src={companyLogo} 
                    alt={companyName || 'Company'} 
                    className="h-10 sm:h-12 w-auto max-w-[200px] object-contain"
                  />
                ) : companyName ? (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-teal-700">
                        {companyName[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{companyName}</span>
                  </div>
                ) : (
                  // Show skeleton while loading company data
                  <Skeleton className="h-10 w-[200px] rounded-lg" />
                )}
              </div>
            ) : (
              // Show navigation links for default variant
              navigation.map((item) => (
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
              ))
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {loading ? (
              // Skeleton loaders to prevent layout shift
              <>
                <Skeleton className="hidden sm:block h-10 w-[132px] rounded-lg" />
                <Skeleton className="hidden sm:block h-10 w-10 rounded-full" />
                {variant !== 'employer' && <Skeleton className="hidden md:block h-10 w-10 rounded-full" />}
              </>
            ) : user ? (
              <>
                <div className="hidden sm:block">
                  <GiveFeedbackDialog />
                </div>
                <div className="hidden sm:block">
                  {companyId ? (
                    <EmployerNotificationDropdown companyId={companyId} />
                  ) : (
                    <NotificationDropdown />
                  )}
                </div>
                {/* Only show user avatar menu for default variant, not employer */}
                {variant !== 'employer' && (
                  <div className="hidden md:block">
                    <UserMenu 
                      user={{
                        name: profile?.first_name && profile?.last_name 
                          ? `${profile.first_name} ${profile.last_name}`
                          : user.email || 'User',
                        email: user.email || '',
                        avatar: profile?.avatar_url
                      }}
                      onSignOut={signOut}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-[#0694A2] hover:bg-[#0694A2]/90 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
            
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
                    {user && (
                      <div className="px-4 py-6 border-t border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-teal-700">
                              {user.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.email || 'User'}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                            <Settings className="w-4 h-4" />
                            Account Settings
                          </button>
                          <Link 
                            href="/assessments"
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                          >
                            <FileText className="w-4 h-4" />
                            My Assessments
                          </Link>
                          <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                            <Heart className="w-4 h-4" />
                            Favorites
                          </button>
                          <button 
                            onClick={signOut}
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}

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
                          onClick={async () => {
                            setIsOpen(false)
                            await signOut()
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
          </div>
        </div>
      </div>
    </nav>
  )
}
