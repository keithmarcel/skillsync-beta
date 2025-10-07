'use client'

import React from 'react'
import Link from 'next/link'
import PageHeader from '@/components/ui/page-header'
import StickyTabs from '@/components/ui/sticky-tabs'
import { FeaturedProgramCard } from '@/components/ui/featured-program-card'
import { TitleHero } from '@/components/ui/title-hero'
import { IllustrationHero } from '@/components/ui/illustration-hero'
import { EmptyState } from '@/components/ui/empty-state'
import DataTable from '@/components/ui/data-table'
import SearchFilterControls from '@/components/ui/search-filter-controls'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getFeaturedPrograms, getAllPrograms, getRelatedJobsCountForProgram, getRelatedJobsForProgram } from '@/lib/database/queries'
import { transformProgramToCard, transformProgramToTable } from '@/lib/database/transforms'
import { programsTableColumns, programsSearchFields } from '@/lib/table-configs'
import { useFavorites } from '@/hooks/useFavorites'
import { PageLoader } from '@/components/ui/loading-spinner'
import { RelatedJobsDialog } from '@/components/ui/related-jobs-dialog'
// import { ProgramCard } from '@/components/ui/program-card'


// Force dynamic rendering to avoid prerendering issues with Supabase
export const dynamic = 'force-dynamic'


export default function ProgramsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { favoritePrograms, loading: favoritesLoading, addFavorite, removeFavorite, isFavorite } = useFavorites()
  
  // Get tab from URL or default to 'featured'
  const tabFromUrl = searchParams.get('tab') || 'featured'
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const [featuredPrograms, setFeaturedPrograms] = useState<any[]>([])
  const [allPrograms, setAllPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [isRelatedJobsOpen, setIsRelatedJobsOpen] = useState(false)
  const [relatedJobs, setRelatedJobs] = useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [favoriteProgramsWithCounts, setFavoriteProgramsWithCounts] = useState<any[]>([])
  
  // Search/Sort/Filter state for all programs tab
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  
  // Search/Filter state for featured programs tab
  const [featuredSearchTerm, setFeaturedSearchTerm] = useState('')
  const [featuredFilters, setFeaturedFilters] = useState<Record<string, string[]>>({})

  // Update activeTab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'featured'
    setActiveTab(tabFromUrl)
  }, [searchParams])

  // Load favorite programs with related jobs counts
  useEffect(() => {
    async function loadFavoriteProgramsWithCounts() {
      if (favoritePrograms.length > 0) {
        const programsWithCounts = await Promise.all(
          favoritePrograms.map(async (program) => {
            const transformed = transformProgramToTable(program)
            const relatedJobsCount = await getRelatedJobsCountForProgram(program.id)
            return {
              ...transformed,
              related_jobs_count: relatedJobsCount
            }
          })
        )
        setFavoriteProgramsWithCounts(programsWithCounts)
      } else {
        setFavoriteProgramsWithCounts([])
      }
    }
    loadFavoriteProgramsWithCounts()
  }, [favoritePrograms])

  useEffect(() => {
    async function loadProgramsData() {
      try {
        setLoading(true)
        const [featuredData, allData] = await Promise.all([
          getFeaturedPrograms(),
          getAllPrograms()
        ])
        
        // Transform featured programs and get related jobs count for each
        const transformedFeatured = await Promise.all(
          featuredData.map(async (program) => {
            const transformed = transformProgramToCard(program)
            const relatedJobsCount = await getRelatedJobsCountForProgram(program.id)
            return {
              ...transformed,
              relatedJobsCount
            }
          })
        )
        
        console.log('Featured programs with jobs count:', transformedFeatured.map(p => ({ 
          name: p.title, 
          relatedJobsCount: p.relatedJobsCount 
        })))
        
        setFeaturedPrograms(transformedFeatured)
        
        // Transform all programs and get related jobs count for each
        const transformedAll = await Promise.all(
          allData.map(async (program) => {
            const transformed = transformProgramToTable(program)
            const relatedJobsCount = await getRelatedJobsCountForProgram(program.id)
            return {
              ...transformed,
              related_jobs_count: relatedJobsCount,
              school_name: program.school?.name || 'Unknown School'
            }
          })
        )
        
        setAllPrograms(transformedAll)
      } catch (error) {
        console.error('Error loading programs data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProgramsData()
  }, [])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    // Update URL to preserve tab state
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`/programs?${params.toString()}`)
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
  
  const handleFeaturedFilter = (column: string, values: string[]) => {
    setFeaturedFilters(prev => ({
      ...prev,
      [column]: values
    }))
  }
  
  // Filter featured programs
  const filteredFeaturedPrograms = featuredPrograms.filter(program => {
    // Search filter
    if (featuredSearchTerm) {
      const searchLower = featuredSearchTerm.toLowerCase()
      const matchesSearch = 
        program.title?.toLowerCase().includes(searchLower) ||
        program.school?.toLowerCase().includes(searchLower) ||
        program.programType?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }
    
    // Program type filter
    if (featuredFilters.programType && featuredFilters.programType !== program.programType) {
      return false
    }
    
    // Format filter
    if (featuredFilters.format && featuredFilters.format !== program.format) {
      return false
    }
    
    return true
  })

  // Filter and sort all programs
  const filteredAndSortedPrograms = React.useMemo(() => {
    let result = [...allPrograms]
    
    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(program => 
        program.name?.toLowerCase().includes(searchLower) ||
        program.school_name?.toLowerCase().includes(searchLower) ||
        program.program_type?.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply filters
    Object.entries(filters).forEach(([column, values]) => {
      if (values && values.length > 0) {
        result = result.filter(program => values.includes(program[column]))
      }
    })
    
    return result
  }, [allPrograms, searchTerm, filters])

  const tabs = [
    { id: 'featured', label: 'Featured Programs', isActive: activeTab === 'featured' },
    { id: 'all', label: 'All Programs', isActive: activeTab === 'all' },
    { id: 'favorites', label: 'Favorites', isActive: activeTab === 'favorites' }
  ]

  // Dynamic page header based on active tab
  const getPageHeaderContent = () => {
    switch (activeTab) {
      case 'featured':
        return {
          title: 'Accelerate Your Career with Top-Rated Programs',
          subtitle: 'Explore curated educational programs from leading institutions designed to close your skill gaps.'
        }
      case 'all':
        return {
          title: 'Comprehensive Education & Training Catalog',
          subtitle: 'Search our complete collection of certificates, degrees, and professional development programs.'
        }
      case 'favorites':
        return {
          title: 'Your Saved Programs',
          subtitle: 'Access the educational programs you\'ve bookmarked to advance your career goals.'
        }
      default:
        return {
          title: 'Educational Programs',
          subtitle: 'Discover programs to develop your skills and advance your career.'
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
      
      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'featured' && (
              <div>
                <IllustrationHero 
                  imageSrc="/assets/heroimage_high-demand-occupations.svg"
                  imageAlt="Discover Featured Programs"
                  title="Discover Featured Programs"
                />
                
                <div className="mt-8">
                  <SearchFilterControls
                    searchTerm={featuredSearchTerm}
                    onSearchChange={setFeaturedSearchTerm}
                    searchPlaceholder="Search programs by name, school, or type"
                    sortBy=""
                    sortOrder="asc"
                    onSortChange={() => {}}
                    filters={featuredFilters}
                    onFilterChange={handleFeaturedFilter}
                    columns={[
                      { key: 'programType', label: 'Type', filterable: true, filterOptions: ['Certificate', "Associate's", 'Bachelor Degree', 'Apprenticeship', 'Bootcamp'] },
                      { key: 'format', label: 'Format', filterable: true, filterOptions: ['Online', 'Hybrid', 'In-person'] }
                    ]}
                  />
                </div>
                
                <div className="mt-5">
                  {loading ? (
                    <PageLoader text="Loading Featured Programs" />
                  ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFeaturedPrograms.map((program) => {
                      console.log('Rendering program card:', program.title, 'Logo:', program.schoolLogo)
                      return (
                        <FeaturedProgramCard
                          key={program.id}
                          id={program.id}
                          name={program.title}
                          school={{
                            name: program.school,
                            logo: program.schoolLogo || undefined
                          }}
                          programType={program.programType}
                          format={program.format}
                          duration={program.duration}
                          description={program.description}
                          skillsCallout={{
                            type: 'jobs',
                            count: program.relatedJobsCount || 0,
                            label: `This program provides skills for ${program.relatedJobsCount || 0} jobs`,
                            href: `/programs/${program.id}/jobs`
                          }}
                          aboutSchoolHref={program.aboutSchoolLink}
                          programDetailsHref={`/programs/${program.id}?from=featured`}
                          isFavorited={isFavorite('program', program.id)}
                          onAddFavorite={() => addFavorite('program', program.id)}
                          onRemoveFavorite={() => removeFavorite('program', program.id)}
                        />
                      )
                    })}
                  </div>
                )}
                </div>
              </div>
            )}

            {activeTab === 'all' && (
              <div>
                <IllustrationHero 
                  imageSrc="/assets/heroimage_high-demand-occupations.svg"
                  imageAlt="Browse All Programs"
                  title="Browse All Programs"
                />
                
                {loading ? (
                  <DataTable
                    data={[]}
                    columns={programsTableColumns}
                    tableType="programs"
                    showSearchSortFilter={false}
                    isLoading={true}
                    loadingText="Loading All Programs"
                  />
                ) : (
                  <div>
                    {/* Search/Sort/Filter - 32px from hero image */}
                    <div className="mt-8">
                      <SearchFilterControls
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        searchPlaceholder="Search programs by name, school, or category"
                        sortBy=""
                        sortOrder="asc"
                        onSortChange={() => {}}
                        filters={filters}
                        onFilterChange={handleFilter}
                        columns={[
                          { key: 'program_type', label: 'Type', filterable: true, filterOptions: Array.from(new Set(allPrograms.map(p => p.program_type).filter(Boolean))).sort() },
                          { key: 'school_name', label: 'School', filterable: true, filterOptions: Array.from(new Set(allPrograms.map(p => p.school_name).filter(Boolean))).sort() }
                        ]}
                      />
                    </div>
                    
                    {/* Table - 20px from search/filters */}
                    <div className="mt-5">
                      <DataTable
                        data={filteredAndSortedPrograms}
                        columns={programsTableColumns}
                        tableType="programs"
                        showSearchSortFilter={false}
                        isLoading={loading}
                        isFavorite={isFavorite}
                        onRowAction={async (action, row) => {
                          switch (action) {
                            case 'details':
                              window.location.href = `/programs/${row.id}?from=all`
                              break
                            case 'secondary':
                              console.log('About the School for program:', row.id)
                              break
                            case 'tertiary':
                              // Open Related Jobs modal
                              setSelectedProgram(row)
                              setIsRelatedJobsOpen(true)
                              // Load jobs when modal opens
                              setLoadingJobs(true)
                              try {
                                const jobs = await getRelatedJobsForProgram(row.id)
                                setRelatedJobs(jobs)
                              } catch (error) {
                                console.error('Error loading related jobs:', error)
                              } finally {
                                setLoadingJobs(false)
                              }
                              break
                            case 'favorite':
                              await addFavorite('program', row.id)
                              break
                            case 'unfavorite':
                              await removeFavorite('program', row.id)
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
                {favoritesLoading ? (
                  <DataTable
                    data={[]}
                    columns={programsTableColumns}
                    tableType="programs"
                    showSearchSortFilter={false}
                    isLoading={true}
                    loadingText="Loading Saved Programs"
                  />
                ) : favoriteProgramsWithCounts.length > 0 ? (
                  <DataTable
                    data={favoriteProgramsWithCounts.sort((a, b) => a.name.localeCompare(b.name))}
                    columns={programsTableColumns}
                    tableType="programs"
                    isOnFavoritesTab={true}
                    showSearchSortFilter={true}
                    isFavorite={isFavorite}
                    onRowAction={async (action, row) => {
                      switch (action) {
                        case 'details':
                          window.location.href = `/programs/${row.id}?from=favorites`
                          break
                        case 'tertiary':
                          // Open Related Jobs modal
                          setSelectedProgram(row)
                          setIsRelatedJobsOpen(true)
                          // Load jobs when modal opens
                          setLoadingJobs(true)
                          try {
                            const jobs = await getRelatedJobsForProgram(row.id)
                            setRelatedJobs(jobs)
                          } catch (error) {
                            console.error('Error loading related jobs:', error)
                          } finally {
                            setLoadingJobs(false)
                          }
                          break
                        case 'unfavorite':
                          await removeFavorite('program', row.id)
                          break
                      }
                    }}
                  />
                ) : (
                  <EmptyState
                    variant="inline"
                    title="No Saved Programs"
                    description="You haven't saved any programs yet. Browse programs and click the heart icon to save them here."
                    primaryButtonText="Browse Featured Programs"
                    primaryButtonHref="/programs?tab=featured"
                    secondaryButtonText="View All Programs"
                    secondaryButtonHref="/programs?tab=all"
                  />
                )}
                </div>
              </div>
            )}
          </div>
      </main>
      
      {/* Related Jobs Dialog */}
      {selectedProgram && (
        <RelatedJobsDialog
          isOpen={isRelatedJobsOpen}
          onClose={() => setIsRelatedJobsOpen(false)}
          program={{
            name: selectedProgram.name,
            school: {
              name: selectedProgram.school?.name || selectedProgram.school_name || 'Unknown School',
              logo: selectedProgram.school?.logo
            },
            relatedJobsCount: relatedJobs.length
          }}
          jobs={relatedJobs}
          loading={loadingJobs}
        />
      )}
    </div>
  )
}
