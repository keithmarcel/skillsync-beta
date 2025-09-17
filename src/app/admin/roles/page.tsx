'use client'

import { useState, useEffect } from 'react'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { EntityTable, EntityColumn } from '@/components/admin/EntityTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

interface FeaturedRole {
  id: string
  title: string
  soc_code: string
  company: {
    name: string
    is_trusted_partner: boolean
  }
  category: string
  median_wage_usd: number
  location_city: string
  location_state: string
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  created_at: string
  updated_at: string
}

const columns: EntityColumn[] = [
  {
    key: 'title',
    label: 'Role Title',
    sortable: true
  },
  {
    key: 'soc_code',
    label: 'SOC Code',
    sortable: true
  },
  {
    key: 'company',
    label: 'Company',
    render: (company: any) => (
      <div className="flex items-center gap-2">
        <span>{company?.name}</span>
        {company?.is_trusted_partner && (
          <Badge variant="secondary" className="text-xs">
            Trusted Partner
          </Badge>
        )}
      </div>
    )
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true
  },
  {
    key: 'median_wage_usd',
    label: 'Median Wage',
    render: (wage: number) => wage ? `$${wage.toLocaleString()}` : 'N/A'
  },
  {
    key: 'location_city',
    label: 'Location',
    render: (city: string, row: FeaturedRole) => 
      `${city || 'N/A'}, ${row.location_state || 'N/A'}`
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true
  },
  {
    key: 'is_featured',
    label: 'Featured'
  },
  {
    key: 'updated_at',
    label: 'Last Updated',
    sortable: true
  }
]

export default function AdminRolesPage() {
  const { profile, isCompanyAdmin } = useAuth()
  const [roles, setRoles] = useState<FeaturedRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      // TODO: Implement API call to fetch roles based on user permissions
      // For now, using mock data
      const mockRoles: FeaturedRole[] = [
        {
          id: '1',
          title: 'Software Engineer',
          soc_code: '15-1252',
          company: {
            name: 'Tech Corp',
            is_trusted_partner: true
          },
          category: 'Technology',
          median_wage_usd: 95000,
          location_city: 'Tampa',
          location_state: 'FL',
          status: 'published',
          is_featured: true,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T14:30:00Z'
        },
        {
          id: '2',
          title: 'Project Manager',
          soc_code: '11-9021',
          company: {
            name: 'Business Solutions Inc',
            is_trusted_partner: false
          },
          category: 'Business',
          median_wage_usd: 78000,
          location_city: 'St. Petersburg',
          location_state: 'FL',
          status: 'draft',
          is_featured: false,
          created_at: '2024-01-10T09:00:00Z',
          updated_at: '2024-01-18T16:45:00Z'
        }
      ]
      
      setRoles(mockRoles)
    } catch (error) {
      console.error('Failed to load roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // TODO: Implement server-side search or client-side filtering
  }

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column)
    setSortDirection(direction)
    // TODO: Implement sorting logic
  }

  // Filter roles based on search query
  const filteredRoles = roles.filter(role => 
    role.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.soc_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get role count for company admin limit display
  const companyRoleCount = isCompanyAdmin ? roles.filter(r => r.status !== 'archived').length : 0
  const roleLimit = 10

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Featured Roles</h1>
              <p className="text-gray-600">
                {isCompanyAdmin 
                  ? "Manage your company's featured roles and job postings"
                  : "Manage all featured roles across partner companies"
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isCompanyAdmin && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{companyRoleCount}</span> / {roleLimit} roles used
                </div>
              )}
              <Button asChild>
                <Link href="/admin/roles/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Role
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roles.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <Badge variant="default" className="h-4 px-1 text-xs">Live</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {roles.filter(r => r.status === 'published').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Draft</CardTitle>
                <Badge variant="outline" className="h-4 px-1 text-xs">Draft</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {roles.filter(r => r.status === 'draft').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Featured</CardTitle>
                <Badge variant="secondary" className="h-4 px-1 text-xs">⭐</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {roles.filter(r => r.is_featured).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Roles Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <EntityTable
                data={filteredRoles}
                columns={columns}
                loading={loading}
                searchPlaceholder="Search roles by title, SOC code, company, or category..."
                onSearch={handleSearch}
                onSort={handleSort}
                entityType="roles"
              />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
