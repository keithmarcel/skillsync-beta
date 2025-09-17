'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Building2, Briefcase, GraduationCap, FileText, Settings } from 'lucide-react';

interface AdminSidebarProps {
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isProviderAdmin: boolean;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['super_admin', 'company_admin', 'provider_admin'],
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
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['super_admin', 'company_admin', 'provider_admin'],
  },
];

export function AdminSidebar({ isSuperAdmin, isCompanyAdmin, isProviderAdmin }: AdminSidebarProps) {
  const pathname = usePathname();
  
  // Determine user roles
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
    <div className="hidden border-r bg-muted/40 md:block w-64">
      <div className="flex h-full flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <span>SkillSync Admin</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || 
                             (item.href !== '/admin' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    isActive && 'bg-muted text-primary'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
