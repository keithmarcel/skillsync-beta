'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import StickyTabs from '@/components/ui/sticky-tabs'
import { TitleHero } from '@/components/ui/title-hero'
import { IllustrationHero } from '@/components/ui/illustration-hero'
import SearchFilterControls from '@/components/ui/search-filter-controls'
import DataTable from '@/components/ui/data-table'
import { FeaturedRoleCard } from '@/components/ui/featured-role-card'
import { FeaturedRoleListCard } from '@/components/ui/featured-role-list-card'
import { FeaturedJobCardV2 } from '@/components/ui/featured-job-card-v2'
import { EmptyState } from '@/components/ui/empty-state'
import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/ui/page-header'
import { occupationsTableColumns, occupationsSearchFields } from '@/lib/table-configs'
import { getFeaturedRoles, getHighDemandOccupations } from '@/lib/database/queries'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/hooks/useAuth'
import { transformJobToFeaturedRole, transformJobToHighDemand } from '@/lib/database/transforms'
import { getUserAssessments } from '@/lib/database/queries'
import { PageLoader } from '@/components/ui/loading-spinner'


// Force dynamic rendering to avoid prerendering issues with Supabase
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

// Function to determine role readiness based on REAL user assessment data
function determineRoleReadiness(jobId: string, userAssessments?: any[]): string {
  // Check if user has taken an assessment for this specific job
  if (!userAssessments || userAssessments.length === 0) {
    return 'assess skills' // No assessments taken
  }
  
  // Find assessment for this specific job
  const jobAssessment = userAssessments.find(assessment => assessment.job_id === jobId)
  
  if (!jobAssessment) {
    return 'assess skills' // No assessment for this specific job
  }
  
  // Check the assessment status/readiness
  const readinessPct = jobAssessment.readiness_pct || 0
  const statusTag = jobAssessment.status_tag
  
  // Determine readiness based on actual assessment results
  if (statusTag === 'role_ready' || readinessPct >= 80) {
    return 'ready'
  } else if (statusTag === 'close_gaps' || readinessPct >= 50) {
    return 'close gaps'
  } else {
    return 'assess skills'
  }
}

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
  const { user } = useAuth()
  const { favoriteJobs, loading: favoritesLoading, error: favoritesError, addFavorite, removeFavorite, isFavorite } = useFavorites()

  
  // Get tab from URL or default to 'featured-roles'
  const tabFromUrl = searchParams.get('tab') || 'featured-roles'
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const [featuredRoles, setFeaturedRoles] = useState<any[]>([])
  const [highDemandJobs, setHighDemandJobs] = useState<any[]>([])
  const [userAssessments, setUserAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search/Sort/Filter state for both tabs
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  
  // Featured roles specific filters
  const [featuredSearchTerm, setFeaturedSearchTerm] = useState('')
  const [featuredFilters, setFeaturedFilters] = useState<Record<string, string[]>>({})
  
  // View and pagination state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [itemsToShow, setItemsToShow] = useState(12)

  // Update activeTab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'featured-roles'
    setActiveTab(tabFromUrl)
  }, [searchParams])

  useEffect(() => {
    async function loadJobsData() {
      try {
        setLoading(true)
        
        // Load jobs data
        const [featuredData, highDemandData] = await Promise.all([
          getFeaturedRoles(),
          getHighDemandOccupations()
        ])
        
        // Load user assessments if user is available
        let assessments: any[] = []
        if (user?.id) {
          try {
            assessments = await getUserAssessments(user.id)
            console.log('🏗️ JOBS PAGE: Loaded user assessments:', assessments.length)
          } catch (error) {
            console.log('🏗️ JOBS PAGE: No assessments found or error loading:', error)
          }
        }
        setUserAssessments(assessments)
        
        setFeaturedRoles(featuredData.map(transformJobToFeaturedRole))
        setHighDemandJobs(highDemandData.map(job => {
          const transformed = transformJobToHighDemand(job)
          return {
            ...transformed,
            readiness: determineRoleReadiness(job.id, assessments)
          }
        }))
      } catch (error) {
        console.error('Error loading jobs data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadJobsData()
  }, [user?.id])

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

  const handleFilter = (column: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [column]: values
    }))
  }

  // Apply search and filter to featured roles
  const filteredFeaturedRoles = React.useMemo(() => {
    let result = [...featuredRoles]

    // Apply search
    if (featuredSearchTerm) {
      const searchLower = featuredSearchTerm.toLowerCase()
      result = result.filter(role => 
        role.title?.toLowerCase().includes(searchLower) ||
        role.company?.name?.toLowerCase().includes(searchLower) ||
        role.category?.toLowerCase().includes(searchLower)
      )
    }

    // Apply filters
    Object.entries(featuredFilters).forEach(([column, values]) => {
      if (values && values.length > 0) {
        if (column === 'category') {
          result = result.filter(role => values.includes(role.category))
        } else if (column === 'jobType') {
          result = result.filter(role => values.includes(role.jobType))
        } else if (column === 'company') {
          result = result.filter(role => role.company?.name && values.includes(role.company.name))
        }
      }
    })

    return result
  }, [featuredRoles, featuredSearchTerm, featuredFilters])

  // Apply search, sort, and filter to high-demand jobs
  const filteredAndSortedJobs = React.useMemo(() => {
    let result = [...highDemandJobs]

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(job => 
        job.title?.toLowerCase().includes(searchLower) ||
        job.soc_code?.toLowerCase().includes(searchLower) ||
        job.category?.toLowerCase().includes(searchLower)
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([column, values]) => {
      if (values && values.length > 0) {
        result = result.filter(job => values.includes(job[column]))
      }
    })

    // Apply sort
    if (sortBy) {
      result.sort((a, b) => {
        const aVal = a[sortBy]
        const bVal = b[sortBy]
        if (aVal === bVal) return 0
        const comparison = aVal > bVal ? 1 : -1
        return sortOrder === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [highDemandJobs, searchTerm, filters, sortBy, sortOrder])

  const tabs = [
    { id: 'featured-roles', label: 'Hiring Now', isActive: activeTab === 'featured-roles' },
    { id: 'high-demand', label: 'High-Demand Occupations', isActive: activeTab === 'high-demand' },
    { id: 'favorites', label: 'Favorites', isActive: activeTab === 'favorites' }
  ]

  // Dynamic page header based on active tab
  const getPageHeaderContent = () => {
    switch (activeTab) {
      case 'featured-roles':
        return {
          title: 'Connect with Top Employers in Pinellas County',
          subtitle: 'Explore exclusive opportunities from our trusted employer partners actively hiring now.'
        }
      case 'high-demand':
        return {
          title: 'Find Your Path in High-Growth Careers',
          subtitle: 'Discover occupations with strong demand and excellent career prospects in your region.'
        }
      case 'favorites':
        return {
          title: 'Your Saved Opportunities',
          subtitle: 'Review and manage the jobs you\'ve bookmarked for future reference.'
        }
      default:
        return {
          title: 'Explore Career Opportunities',
          subtitle: 'Browse job-based opportunities from our trusted employer partners.'
        }
    }
  }

  const headerContent = getPageHeaderContent()

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader 
        title={headerContent.title}
        subtitle={headerContent.subtitle}
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
              <IllustrationHero 
                imageSrc="/assets/heroimage_featured-roles.svg"
                imageAlt="See Who's Hiring Now"
                title="See Who's Hiring Now"
              />
              
              {/* Search/Filter Controls and View Toggle */}
              <div className="mt-8 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <SearchFilterControls
                    searchTerm={featuredSearchTerm}
                    onSearchChange={setFeaturedSearchTerm}
                    searchPlaceholder="Search by company, role, or category"
                    sortBy=""
                    sortOrder="asc"
                    onSortChange={() => {}}
                    filters={featuredFilters}
                    onFilterChange={(column, values) => {
                      setFeaturedFilters(prev => ({
                        ...prev,
                        [column]: values
                      }))
                    }}
                    columns={[
                      { key: 'category', label: 'Category', filterable: true, filterOptions: ['Skilled Trades', 'Business', 'Health & Education', 'Technology'] },
                      { key: 'jobType', label: 'Job Type', filterable: true, filterOptions: ['Full-Time', 'Part-Time', 'Contract'] },
                      { 
                        key: 'company', 
                        label: 'Company', 
                        filterable: true, 
                        filterOptions: Array.from(new Set(featuredRoles.map(role => role.company?.name).filter(Boolean))).sort()
                      }
                    ]}
                  />
                </div>
                
                {/* View Toggle */}
                <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-[#0694A2] text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Grid view"
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-[#0694A2] text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="List view"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="mt-5">
                {loading ? (
                  <PageLoader text="Loading Featured Roles" />
                ) : filteredFeaturedRoles.length > 0 ? (
                  <>
                    {/* Grid View */}
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFeaturedRoles.slice(0, itemsToShow).map((role) => (
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
                            isFavorited={isFavorite('job', role.id)}
                            onAddFavorite={() => addFavorite('job', role.id)}
                            onRemoveFavorite={() => removeFavorite('job', role.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      /* List View */
                      <div className="space-y-3">
                        {filteredFeaturedRoles.slice(0, itemsToShow).map((role) => (
                          <FeaturedRoleListCard
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
                            isFavorited={isFavorite('job', role.id)}
                            onAddFavorite={() => addFavorite('job', role.id)}
                            onRemoveFavorite={() => removeFavorite('job', role.id)}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Load More Button */}
                    {filteredFeaturedRoles.length > itemsToShow && (
                      <div className="mt-8 flex justify-center">
                        <Button
                          onClick={() => setItemsToShow(prev => prev + 12)}
                          variant="outline"
                          className="px-8 py-3 text-[#0694A2] border-[#0694A2] hover:bg-[#0694A2] hover:text-white transition-colors"
                        >
                          Load More ({filteredFeaturedRoles.length - itemsToShow} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState
                    variant="card"
                    icon={
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    }
                    title="No roles found"
                    description="No featured roles match your search or filters."
                    secondaryButtonText="Clear All"
                    onSecondaryClick={() => {
                      setFeaturedSearchTerm('')
                      setFeaturedFilters({})
                    }}
                  />
                )}
              </div>
            </div>
          )}
          {activeTab === 'high-demand' && (
            <div>
              <IllustrationHero 
                imageSrc="/assets/heroimage_featured-roles.svg"
                imageAlt="Explore High-Demand Occupations"
                title="Explore High-Demand Occupations"
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
                      data={filteredAndSortedJobs}
                      columns={occupationsTableColumns}
                      tableType="occupations"
                      showSearchSortFilter={false}
                      isFavorite={isFavorite}
                      onRowAction={async (action, row) => {
                        switch (action) {
                          case 'details':
                            window.location.href = `/jobs/${row.id}`
                            break
                          case 'resume':
                            window.location.href = `/assessments/resume/${row.id}`
                            break
                          case 'assessment':
                            window.location.href = `/assessments/${row.id}/intro`
                            break
                          case 'favorite':
                            await addFavorite('job', row.id)
                            break
                          case 'unfavorite':
                            await removeFavorite('job', row.id)
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
                subtitle="Review and manage the jobs you've bookmarked for future reference."
              />
              
              <div className="mt-8">
                {favoritesLoading ? (
                  <DataTable
                    data={[]}
                    columns={occupationsTableColumns}
                    tableType="jobs"
                    showSearchSortFilter={false}
                    isLoading={true}
                    loadingText="Loading Saved Jobs"
                  />
                ) : favoritesError ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-red-500 mb-4">Error loading favorite jobs</p>
                    <p className="text-sm text-gray-400">{favoritesError}</p>
                  </div>
                ) : favoriteJobs.length > 0 ? (
                  <DataTable
                    data={favoriteJobs.map(job => {
                      // For favorites tab, apply proper category mapping for featured roles
                      const getProperCategory = (job: any) => {
                        if (job.job_kind === 'featured_role') {
                          // Prefer database category if set, otherwise use title-based mapping for legacy data
                          if (job.category && job.category.trim() !== '') {
                            return job.category
                          }
                          
                          // Fallback to title-based mapping for legacy featured roles without categories
                          const categoryMap: Record<string, string> = {
                            'Mechanical Assistant Project Manager': 'Skilled Trades',
                            'Senior Financial Analyst (FP&A)': 'Business',
                            'Mechanical Project Manager': 'Skilled Trades', 
                            'Surgical Technologist (Certified)': 'Health & Education',
                            'Business Development Manager': 'Business',
                            'Administrative Assistant': 'Business',
                            'Supervisor, Residential Inbound Sales': 'Business',
                            'Senior Mechanical Project Manager': 'Skilled Trades'
                          }
                          return categoryMap[job.title] || 'Business'
                        }
                        return job.category || 'General'
                      }
                      
                      return {
                        id: job.id,
                        title: job.title,
                        description: job.short_desc || job.long_desc?.substring(0, 150) || '',
                        category: getProperCategory(job),
                        median_wage_usd: job.median_wage_usd || 0,
                        readiness: determineRoleReadiness(job.id, userAssessments),
                        job_kind: job.job_kind,
                        socCode: job.soc_code || '',
                        location_city: job.location_city || '',
                        location_state: job.location_state || '',
                        company: job.company,
                        skills: job.skills || []
                      };
                    }).sort((a, b) => a.title.localeCompare(b.title))}
                    columns={occupationsTableColumns}
                    tableType="jobs"
                    isOnFavoritesTab={true}
                    showSearchSortFilter={true}
                onRowAction={async (action, row) => {
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
                      await removeFavorite('job', row.id)
                      break
                  }
                }}
              />
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 mb-4">No favorite jobs found</p>
                    <p className="text-sm text-gray-400">Add jobs to your favorites from the Featured Roles or High-Demand Occupations tabs</p>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
