'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/empty-state'
import PageHeader from '@/components/ui/page-header'
import { IllustrationHero } from '@/components/ui/illustration-hero'
import SearchFilterControls from '@/components/ui/search-filter-controls'
import { PageLoader } from '@/components/ui/loading-spinner'
import Link from 'next/link'
import { Target } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'

type Assessment = {
  id: string
  user_id: string
  job_id: string
  quiz_id: string | null
  method: 'quiz' | 'resume'
  readiness_pct: number | null
  status_tag: string | null
  analyzed_at: string | null
  created_at: string
  job: {
    id: string
    title: string
    soc_code: string
    company: {
      name: string
    } | null
  } | null
  skill_results: Array<{
    band: string
  }> | null
}

export default function MyAssessmentsPage() {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('readiness')

  useEffect(() => {
    loadAssessments()
  }, [user?.id])

  async function loadAssessments() {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          job:jobs(id, title, soc_code, company:companies(name)),
          skill_results:assessment_skill_results(band)
        `)
        .eq('user_id', user.id)
        .not('analyzed_at', 'is', null)
        .order('analyzed_at', { ascending: false })

      if (error) throw error
      setAssessments(data || [])
    } catch (error) {
      console.error('Error loading assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort assessments
  const filteredAssessments = assessments.filter((a) => 
    a.job?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.job?.soc_code.includes(searchQuery)
  )

  const sortedAssessments = [...filteredAssessments].sort((a, b) => {
    if (sortBy === 'readiness') {
      return (b.readiness_pct || 0) - (a.readiness_pct || 0)
    }
    return new Date(b.analyzed_at || b.created_at).getTime() - new Date(a.analyzed_at || a.created_at).getTime()
  })

  const getStatusBadge = (readiness: number, status: string) => {
    // Use status_tag ONLY - it's already calculated based on job's required_proficiency_pct
    if (status === 'role_ready') {
      return <Badge className="bg-primary text-primary-foreground hover:bg-primary shadow-none text-sm border border-primary/20">{readiness}% → Role Ready</Badge>
    } else if (status === 'close_gaps') {
      return <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-50 shadow-none text-sm border border-orange-100">{readiness}% → Almost There</Badge>
    } else {
      return <Badge className="bg-pink-50 text-pink-700 hover:bg-pink-50 shadow-none text-sm border border-pink-100">{readiness}% → Developing</Badge>
    }
  }

  const hasAssessments = assessments.length > 0

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader 
        title="Track Your Skills Journey"
        subtitle="Review assessment history, monitor progress, and identify opportunities for growth."
        variant="split"
      />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {hasAssessments && (
          <div className="mt-8">
            <SearchFilterControls
              searchTerm={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search by job title, SOC code, or company"
              sortBy={sortBy}
              sortOrder="asc"
              onSortChange={(value) => setSortBy(value)}
              filters={{}}
              onFilterChange={() => {}}
              columns={[
                { key: 'readiness', label: 'Readiness', sortable: true },
                { key: 'date', label: 'Date', sortable: true }
              ]}
            />
          </div>
        )}

        {loading ? (
          <div className="mt-5">
            <PageLoader text="Loading your assessments..." />
          </div>
        ) : !user ? (
          <div className="mt-5">
            <EmptyState
              title="Sign In Required"
              description="Please sign in to view your assessment history and track your skills journey."
              primaryButtonText="Sign In"
              secondaryButtonText="Learn More"
              onPrimaryClick={() => window.location.href = '/auth/login'}
            />
          </div>
        ) : !hasAssessments ? (
          <div className="mt-5">
            <EmptyState
              variant="card"
              title="No assessments yet"
              description="Complete your first skills assessment to track your progress and identify opportunities for growth."
              primaryButtonText="See Who's Hiring Now"
              primaryButtonHref="/jobs"
            />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedAssessments.map((assessment) => {
                // Use NEW standardized enum values: proficient, building, developing
                const skillsGaps = assessment.skill_results?.filter(sr => sr.band === 'developing' || sr.band === 'building').length || 0
                const totalSkills = assessment.skill_results?.length || 0
                
                return (
                  <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      {/* Job Title */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {assessment.job?.title || 'Unknown Job'}
                      </h3>
                      
                      {/* SOC Code */}
                      <p className="text-sm text-gray-600 mb-3">
                        {assessment.job?.soc_code || 'N/A'} • {assessment.job?.company?.name || 'High-Demand Occupation'}
                      </p>

                      {/* Status Badge */}
                      <div className="mb-4">
                        {getStatusBadge(assessment.readiness_pct || 0, assessment.status_tag || '')}
                      </div>

                      {/* Assessment Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>Skills Assessment</span>
                        </div>
                        <span>•</span>
                        <span>
                          {new Date(assessment.analyzed_at || assessment.created_at).toLocaleDateString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: '2-digit' 
                          })}
                        </span>
                      </div>

                      {/* Skills Gaps Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Skills Gaps Identified</span>
                          <span className="font-medium">{skillsGaps}/{totalSkills}</span>
                        </div>
                        <Progress value={totalSkills > 0 ? ((totalSkills - skillsGaps) / totalSkills) * 100 : 0} className="h-2" />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/assessments/${assessment.id}/results`}>View Report</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href="#">Retake Quiz</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
