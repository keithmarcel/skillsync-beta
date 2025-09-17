'use client'

import Link from 'next/link'
import PageHeader from '@/components/ui/page-header'
import StickyTabs from '@/components/ui/sticky-tabs'
import { FeaturedProgramCard } from '@/components/ui/featured-program-card'
import { TitleHero } from '@/components/ui/title-hero'
import { EmptyState } from '@/components/ui/empty-state'
import DataTable from '@/components/ui/data-table'
import SearchFilterControls from '@/components/ui/search-filter-controls'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getFeaturedPrograms, getAllPrograms } from '@/lib/database/queries'
import { transformProgramToCard, transformProgramToTable } from '@/lib/database/transforms'
import { programsTableColumns, programsSearchFields } from '@/lib/table-configs'
import { useFavorites } from '@/hooks/useFavorites'
// import { ProgramCard } from '@/components/ui/program-card'


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
  
  // Search/Sort/Filter state for all programs tab
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Update activeTab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'featured'
    setActiveTab(tabFromUrl)
  }, [searchParams])

  useEffect(() => {
    async function loadProgramsData() {
      try {
        setLoading(true)
        const [featuredData, allData] = await Promise.all([
          getFeaturedPrograms(),
          getAllPrograms()
        ])
        
        setFeaturedPrograms(featuredData.map(transformProgramToCard))
        setAllPrograms(allData.map(transformProgramToTable))
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

  const handleFilter = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value === 'all' ? '' : value
    }))
  }

  const tabs = [
    { id: 'featured', label: 'Featured Programs', isActive: activeTab === 'featured' },
    { id: 'all', label: 'All Programs', isActive: activeTab === 'all' },
    { id: 'favorites', label: 'Favorites', isActive: activeTab === 'favorites' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader 
        title="Educational Programs"
        subtitle="Discover programs to develop your skills and advance your career."
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
                <TitleHero 
                  title="Featured Programs"
                  heroImage="/assets/hero_featured-programs.jpg"
                />
                
                <div className="mt-8">
                  <SearchFilterControls
                    searchTerm=""
                    onSearchChange={() => {}}
                    searchPlaceholder="Search programs by name, school, or category"
                    sortBy=""
                    sortOrder="asc"
                    onSortChange={() => {}}
                    filters={{}}
                    onFilterChange={() => {}}
                    columns={[
                      { key: 'programName', label: 'Program Name', sortable: true },
                      { key: 'school', label: 'School', sortable: true },
                      { key: 'duration', label: 'Duration', sortable: true },
                      { key: 'programType', label: 'Type', filterable: true, filterOptions: ['Certificate', 'Associates', 'Bachelors', 'Credential'] },
                      { key: 'category', label: 'Category', filterable: true, filterOptions: ['Technology', 'Healthcare', 'Business', 'Skilled Trades'] }
                    ]}
                  />
                </div>
                
                <div className="mt-5">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0694A2] rounded-full animate-spin mb-4"></div>
                      <p className="text-sm text-gray-600 font-normal">Loading Featured Programs</p>
                    </div>
                  ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredPrograms.map((program) => (
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
                          count: program.skillsMapped?.length || 0,
                          label: `This program provides skills for ${program.skillsMapped?.length || 0} jobs`,
                          href: `/programs/${program.id}/jobs`
                        }}
                        aboutSchoolHref={program.aboutSchoolLink}
                        programDetailsHref={`/programs/${program.id}`}
                        isFavorited={isFavorite('program', program.id)}
                        onAddFavorite={() => addFavorite('program', program.id)}
                        onRemoveFavorite={() => removeFavorite('program', program.id)}
                      />
                    ))}
                  </div>
                )}
                </div>
              </div>
            )}

            {activeTab === 'all' && (
              <div>
                <TitleHero 
                  title="All Programs"
                  heroImage="/assets/hero_programs.jpg"
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
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSortChange={handleSort}
                        filters={filters}
                        onFilterChange={handleFilter}
                        columns={programsTableColumns}
                      />
                    </div>
                    
                    {/* Table - 20px from search/filters */}
                    <div className="mt-5">
                      <DataTable
                        data={allPrograms}
                        columns={programsTableColumns}
                        tableType="programs"
                        showSearchSortFilter={false}
                        isLoading={loading}
                        isFavorite={isFavorite}
                        onRowAction={async (action, row) => {
                          switch (action) {
                            case 'details':
                              window.open('#', '_blank')
                              break
                            case 'secondary':
                              window.open('#', '_blank')
                              break
                            case 'tertiary':
                              console.log('See Related Jobs for program:', row.id)
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
                ) : (
                  <DataTable
                    data={favoritePrograms.map(transformProgramToTable).sort((a, b) => a.name.localeCompare(b.name))}
                    columns={programsTableColumns}
                    tableType="programs"
                    isOnFavoritesTab={true}
                    showSearchSortFilter={true}
                  onRowAction={async (action, row) => {
                    switch (action) {
                      case 'details':
                        window.location.href = `/programs/${row.id}`
                        break
                      case 'jobs':
                        console.log('See jobs for program:', row.id)
                        break
                      case 'unfavorite':
                        await removeFavorite('program', row.id)
                        break
                    }
                  }}
                />
                )}
                </div>
              </div>
            )}
          </div>
      </main>
    </div>
  )
}
