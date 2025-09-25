'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Building2, Briefcase, GraduationCap, FileText, Settings, LogOut, Home, User, Users, Menu, X, Database } from 'lucide-react';
import { NAVIGATION_STYLES, BUTTON_STYLES } from '@/lib/design-system';


const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['super_admin', 'company_admin', 'provider_admin'],
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['super_admin'],
  },
  {
    name: 'Companies',
    href: '/admin/companies',
    icon: Building2,
    roles: ['super_admin'],
  },
  {
    name: 'Roles',
    href: '/admin/roles',
    icon: Briefcase,
    roles: ['super_admin', 'company_admin'],
  },
  {
    name: 'Occupations',
    href: '/admin/occupations',
    icon: Briefcase,
    roles: ['super_admin'],
  },
  {
    name: 'Education Providers',
    href: '/admin/providers',
    icon: GraduationCap,
    roles: ['super_admin'],
  },
  {
    name: 'Programs',
    href: '/admin/programs',
    icon: GraduationCap,
    roles: ['super_admin', 'provider_admin'],
  },
  {
    name: 'Assessments',
    href: '/admin/assessments',
    icon: FileText,
    roles: ['super_admin'],
  },
  {
    name: 'Skills Data',
    href: '/admin/skills-data',
    icon: Database,
    roles: ['super_admin'],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['super_admin', 'company_admin', 'provider_admin'],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { profile, isSuperAdmin, isCompanyAdmin, isProviderAdmin, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userRoles = [
    isSuperAdmin && 'super_admin',
    isCompanyAdmin && 'company_admin',
    isProviderAdmin && 'provider_admin',
  ].filter(Boolean) as string[];

  // Filter navigation items based on user roles
  const filteredNavigation = navigation.filter(item => 
    item.roles.some(role => userRoles.includes(role))
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden border-r bg-muted/40 md:block w-64">
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <span>SkillSync Admin</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href="/"
                className={`flex items-center gap-3 ${NAVIGATION_STYLES.padding} ${NAVIGATION_STYLES.borderRadius} ${NAVIGATION_STYLES.default} ${NAVIGATION_STYLES.hover} transition-colors`}
              >
                <Home className="h-4 w-4" />
                Return to App
              </Link>
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href ||
                               (item.href !== '/admin' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 ${NAVIGATION_STYLES.padding} ${NAVIGATION_STYLES.borderRadius} transition-colors ${
                      isActive
                        ? NAVIGATION_STYLES.active
                        : `${NAVIGATION_STYLES.default} ${NAVIGATION_STYLES.hover}`
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none text-foreground">
                  {profile?.first_name || profile?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile?.admin_role?.replace('_', ' ') || 'Admin'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className={`w-full ${BUTTON_STYLES.secondary}`} onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/admin" className="flex items-center gap-2 font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
              <span>SkillSync Admin</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium">
              <Link
                href="/"
                className={`flex items-center gap-3 ${NAVIGATION_STYLES.padding} ${NAVIGATION_STYLES.borderRadius} ${NAVIGATION_STYLES.default} ${NAVIGATION_STYLES.hover} transition-colors`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-4 w-4" />
                Return to App
              </Link>
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href ||
                               (item.href !== '/admin' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 ${NAVIGATION_STYLES.padding} ${NAVIGATION_STYLES.borderRadius} transition-colors ${
                      isActive
                        ? NAVIGATION_STYLES.active
                        : `${NAVIGATION_STYLES.default} ${NAVIGATION_STYLES.hover}`
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none text-foreground">
                  {profile?.first_name || profile?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile?.admin_role?.replace('_', ' ') || 'Admin'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className={`w-full ${BUTTON_STYLES.secondary}`} onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
