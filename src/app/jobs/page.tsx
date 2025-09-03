'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import PageHeader from '@/components/ui/page-header'
import StickyTabs from '@/components/ui/sticky-tabs'
import { FeaturedRoleCard } from '@/components/ui/featured-role-card'
import { TitleHero } from '@/components/ui/title-hero'
import { EmptyState } from '@/components/ui/empty-state'
import DataTable from '@/components/ui/data-table'
import SearchFilterControls from '@/components/ui/search-filter-controls'
import { Search, MoreHorizontal, MapPin, Clock, Users, DollarSign } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getFeaturedRoles, getHighDemandOccupations } from '@/lib/database/queries'
import { transformJobToFeaturedRole, transformJobToHighDemand } from '@/lib/database/transforms'
import { occupationsTableColumns, occupationsSearchFields } from '@/lib/table-configs'

// Mock data removed - now using database queries

// Mock data removed - now using database queries

function getRoleReadinessBadge(readiness: string) {
  switch (readiness) {
    case 'Ready':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ready</Badge>
    case 'Close Gaps':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Close Gaps</Badge>
    default:
      return <Badge variant="outline">Assess Skills</Badge>
  }
}

export default function JobsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get tab from URL or default to 'featured-roles'
  const tabFromUrl = searchParams.get('tab') || 'featured-roles'
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const [featuredRoles, setFeaturedRoles] = useState<any[]>([])
  const [highDemandJobs, setHighDemandJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search/Sort/Filter state for high-demand tab
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Update activeTab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'featured-roles'
    setActiveTab(tabFromUrl)
  }, [searchParams])

  useEffect(() => {
    async function loadJobsData() {
      try {
        setLoading(true)
        const [featuredData, highDemandData] = await Promise.all([
          getFeaturedRoles(),
          getHighDemandOccupations()
        ])
        
        setFeaturedRoles(featuredData.map(transformJobToFeaturedRole))
        setHighDemandJobs(highDemandData.map(transformJobToHighDemand))
      } catch (error) {
        console.error('Error loading jobs data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadJobsData()
  }, [])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    // Update URL to preserve tab state
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`/jobs?${params.toString()}`)
  }

  const handleSort = (value: string) => {
    if (sortBy === value) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(value)
      setSortOrder('asc')
    }
  }

  const handleFilter = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value === 'all' ? '' : value
    }))
  }

  const tabs = [
    { id: 'featured-roles', label: 'Featured Roles', isActive: activeTab === 'featured-roles' },
    { id: 'high-demand', label: 'High-Demand Occupations', isActive: activeTab === 'high-demand' },
    { id: 'favorites', label: 'Favorites', isActive: activeTab === 'favorites' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader 
        title="Explore Top Companies Hiring in Pinellas"
        subtitle="Browse job-based opportunities from our trusted employer partners."
        variant="split"
      />
      
      <StickyTabs 
        tabs={tabs}
        onTabChange={handleTabChange}
      />
      
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Tab Content */}
          {activeTab === 'featured-roles' && (
            <div>
              <TitleHero 
                title="Featured Roles"
                heroImage="/assets/hero_featured-roles.jpg"
              />
              
              <div className="mt-8">
                <SearchFilterControls
                  searchTerm=""
                  onSearchChange={() => {}}
                  searchPlaceholder="Search by keyword, category, or SOC code"
                  sortBy=""
                  sortOrder="asc"
                  onSortChange={() => {}}
                  filters={{}}
                  onFilterChange={() => {}}
                  columns={[
                    { key: 'company', label: 'Company', sortable: true },
                    { key: 'jobType', label: 'Role Type', sortable: true },
                    { key: 'medianSalary', label: 'Salary', sortable: true },
                    { key: 'skillsCount', label: 'Skills Count', sortable: true },
                    { key: 'category', label: 'Category', filterable: true, filterOptions: ['All Roles', 'Skilled Trades', 'Business', 'Health & Education'] }
                  ]}
                />
              </div>
              
              <div className="mt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0694A2] rounded-full animate-spin mb-4"></div>
                    <p className="text-sm text-gray-600 font-normal">Loading Featured Roles</p>
                  </div>
                ) : featuredRoles.length > 0 ? (
                  featuredRoles.map((role) => (
                    <FeaturedRoleCard
                      key={role.id}
                      id={role.id}
                      title={role.title}
                      company={role.company}
                      category={role.category}
                      jobType={role.jobType}
                      skillsCount={role.skillsCount}
                      description={role.description}
                      medianSalary={role.medianSalary}
                      requiredProficiency={role.requiredProficiency}
                      href={`/jobs/${role.id}`}
                      onAboutCompany={() => {
                        console.log(`About company for job ${role.id}`)
                      }}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">No featured roles available</div>
                )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'high-demand' && (
            <div>
              <TitleHero 
                title="High-Demand Occupations"
                heroImage="/assets/hero_occupations.jpg"
              />
              
              {loading ? (
                <DataTable
                  data={[]}
                  columns={occupationsTableColumns}
                  tableType="jobs"
                  showSearchSortFilter={false}
                  isLoading={true}
                  loadingText="Loading Occupations"
                />
              ) : (
                <div>
                  {/* Search/Sort/Filter - 32px from hero image */}
                  <div className="mt-8">
                    <SearchFilterControls
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      searchPlaceholder="Search occupations by keyword, SOC code, or category"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSortChange={handleSort}
                      filters={filters}
                      onFilterChange={handleFilter}
                      columns={occupationsTableColumns}
                    />
                  </div>
                  
                  {/* Table - 20px from search/filters */}
                  <div className="mt-5">
                    <DataTable
                      data={highDemandJobs}
                      columns={occupationsTableColumns}
                      searchPlaceholder="Search occupations by keyword, SOC code, or category"
                      searchableFields={occupationsSearchFields}
                      tableType="jobs"
                      showSearchSortFilter={false}
                      onRowAction={(action, row) => {
                        switch (action) {
                          case 'details':
                            window.location.href = `/jobs/${row.id}`
                            break
                          case 'resume':
                            window.location.href = `/assessments/resume/${row.id}`
                            break
                          case 'assessment':
                            window.location.href = `/assessments/quiz/${row.id}`
                            break
                          case 'favorite':
                            console.log('Add to favorites:', row.id)
                            break
                          case 'unfavorite':
                            console.log('Remove from favorites:', row.id)
                            break
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'favorites' && (
            <div>
              <TitleHero 
                title="Favorites"
              />
              
              <div className="mt-8">
                {loading ? (
                  <DataTable
                    data={[]}
                    columns={occupationsTableColumns}
                    tableType="jobs"
                    showSearchSortFilter={false}
                    isLoading={true}
                    loadingText="Loading Saved Jobs"
                  />
                ) : (
                  <DataTable
                    data={[]} // TODO: Replace with actual favorites data
                    columns={occupationsTableColumns}
                    tableType="jobs"
                    isOnFavoritesTab={true}
                    showSearchSortFilter={true}
                onRowAction={(action, row) => {
                  switch (action) {
                    case 'details':
                      window.location.href = `/jobs/${row.id}`
                      break
                    case 'resume':
                      console.log('Upload resume for:', row.id)
                      break
                    case 'assessment':
                      console.log('Take assessment for:', row.id)
                      break
                    case 'unfavorite':
                      console.log('Remove from favorites:', row.id)
                      break
                  }
                }}
              />
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
