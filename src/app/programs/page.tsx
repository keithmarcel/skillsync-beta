'use client'

import Link from 'next/link'
import PageHeader from '@/components/ui/page-header'
import StickyTabs from '@/components/ui/sticky-tabs'
import { ProgramCard } from '@/components/ui/program-card'
import { TitleHero } from '@/components/ui/title-hero'
import { EmptyState } from '@/components/ui/empty-state'
import DataTable from '@/components/ui/data-table'
import SearchFilterControls from '@/components/ui/search-filter-controls'
import { useState, useEffect } from 'react'
import { getFeaturedPrograms, getAllPrograms } from '@/lib/database/queries'
import { transformProgramToCard, transformProgramToTable } from '@/lib/database/transforms'
import { programsTableColumns, programsSearchFields } from '@/lib/table-configs'


export default function ProgramsPage() {
  const [activeTab, setActiveTab] = useState('featured')
  const [featuredPrograms, setFeaturedPrograms] = useState<any[]>([])
  const [allPrograms, setAllPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search/Sort/Filter state for all programs tab
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string>>({})

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
        onTabChange={setActiveTab}
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

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
                  <div className="col-span-full text-center py-8">Loading programs...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredPrograms.map((program) => (
                      <ProgramCard
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
                  heroImage="/assets/hero_featured-programs.jpg"
                />
                
                {loading ? (
                  <div className="text-center py-8">Loading programs...</div>
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
                        searchPlaceholder="Search programs by name, school, or category"
                        searchableFields={programsSearchFields}
                        tableType="programs"
                        showSearchSortFilter={false}
                        onRowAction={(action, row) => {
                          switch (action) {
                            case 'details':
                              window.location.href = `/programs/${row.id}`
                              break
                            case 'apply':
                              window.open(row.applicationUrl || '#', '_blank')
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
                  heroImage="/assets/hero_featured-programs.jpg"
                />
                
                <div className="mt-8">
                  <DataTable
                  data={[]} // TODO: Replace with actual favorites data
                  columns={[
                    {
                      key: 'title',
                      label: 'Program Name',
                      sortable: true,
                    },
                    {
                      key: 'description',
                      label: 'Summary (Short)',
                      sortable: true,
                    },
                    {
                      key: 'program_type',
                      label: 'Type',
                      sortable: true,
                    },
                    {
                      key: 'delivery_method',
                      label: 'Format',
                      sortable: true,
                    },
                    {
                      key: 'school.name',
                      label: 'School',
                      sortable: true,
                    },
                    {
                      key: 'actions',
                      label: '',
                    },
                  ]}
                  searchPlaceholder="Search your favorite programs"
                  searchableFields={['title', 'description', 'school.name', 'program_type']}
                  tableType="programs"
                  isOnFavoritesTab={true}
                  showSearchSortFilter={true}
                  onRowAction={(action, row) => {
                    switch (action) {
                      case 'details':
                        window.location.href = `/programs/${row.id}`
                        break
                      case 'jobs':
                        console.log('See jobs for program:', row.id)
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
      </main>
    </div>
  )
}
