'use client'

import { AdminGuard } from '@/components/admin/AdminGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Building2, 
  Briefcase, 
  GraduationCap, 
  School, 
  BookOpen, 
  ClipboardList,
  Plus,
  BarChart3
} from 'lucide-react'

interface EntityCardProps {
  title: string
  description: string
  count: number
  href: string
  icon: React.ComponentType<{ className?: string }>
  canCreate?: boolean
  createHref?: string
}

function EntityCard({ title, description, count, href, icon: Icon, canCreate, createHref }: EntityCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground mb-4">{description}</p>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={href}>View All</Link>
          </Button>
          {canCreate && createHref && (
            <Button asChild size="sm" className="flex-1">
              <Link href={createHref}>
                <Plus className="w-3 h-3 mr-1" />
                Create
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { profile, isSuperAdmin, isCompanyAdmin, isProviderAdmin } = useAuth()

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">
                Manage content and entities across the SkillSync platform
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {profile?.admin_role?.replace('_', ' ').toUpperCase()}
              </Badge>
              {profile?.company_id && (
                <Badge variant="outline">Company Scoped</Badge>
              )}
              {profile?.school_id && (
                <Badge variant="outline">Provider Scoped</Badge>
              )}
            </div>
          </div>

          {/* Entity Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isSuperAdmin && (
              <EntityCard
                title="Companies"
                description="Manage company profiles and partnerships"
                count={0} // TODO: Fetch real count
                href="/admin/companies"
                icon={Building2}
                canCreate={true}
                createHref="/admin/companies/new"
              />
            )}

            <EntityCard
              title="Featured Roles"
              description={isCompanyAdmin ? "Your company's featured roles" : "All featured roles"}
              count={0} // TODO: Fetch real count
              href="/admin/roles"
              icon={Briefcase}
              canCreate={true}
              createHref="/admin/roles/new"
            />

            {isSuperAdmin && (
              <EntityCard
                title="High-Demand Occupations"
                description="Labor market occupations and projections"
                count={0} // TODO: Fetch real count
                href="/admin/occupations"
                icon={GraduationCap}
                canCreate={true}
                createHref="/admin/occupations/new"
              />
            )}

            {isSuperAdmin && (
              <EntityCard
                title="Education Providers"
                description="Schools and training institutions"
                count={0} // TODO: Fetch real count
                href="/admin/providers"
                icon={School}
                canCreate={true}
                createHref="/admin/providers/new"
              />
            )}

            <EntityCard
              title="Education Programs"
              description={isProviderAdmin ? "Your institution's programs" : "All education programs"}
              count={0} // TODO: Fetch real count
              href="/admin/programs"
              icon={BookOpen}
              canCreate={true}
              createHref="/admin/programs/new"
            />

            {isSuperAdmin && (
              <EntityCard
                title="Assessments"
                description="Skills assessments and quizzes"
                count={0} // TODO: Fetch real count
                href="/admin/assessments"
                icon={ClipboardList}
                canCreate={true}
                createHref="/admin/assessments/new"
              />
            )}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isCompanyAdmin && (
                  <Button asChild variant="outline" className="h-auto p-4 flex-col">
                    <Link href="/admin/roles/new">
                      <Plus className="w-6 h-6 mb-2" />
                      <span className="font-medium">Add New Role</span>
                      <span className="text-xs text-muted-foreground">Create a featured role</span>
                    </Link>
                  </Button>
                )}

                {isProviderAdmin && (
                  <Button asChild variant="outline" className="h-auto p-4 flex-col">
                    <Link href="/admin/programs/new">
                      <Plus className="w-6 h-6 mb-2" />
                      <span className="font-medium">Add New Program</span>
                      <span className="text-xs text-muted-foreground">Create an education program</span>
                    </Link>
                  </Button>
                )}

                {isSuperAdmin && (
                  <>
                    <Button asChild variant="outline" className="h-auto p-4 flex-col">
                      <Link href="/admin/companies/new">
                        <Plus className="w-6 h-6 mb-2" />
                        <span className="font-medium">Add Company</span>
                        <span className="text-xs text-muted-foreground">Onboard new partner</span>
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="h-auto p-4 flex-col">
                      <Link href="/admin/providers/new">
                        <Plus className="w-6 h-6 mb-2" />
                        <span className="font-medium">Add Provider</span>
                        <span className="text-xs text-muted-foreground">Add education provider</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Activity tracking will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
