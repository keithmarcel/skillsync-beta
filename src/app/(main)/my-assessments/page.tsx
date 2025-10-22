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
import { Calendar, Target, GraduationCap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  program_matches_count: number | null
  job: {
    id: string
    title: string
    soc_code: string
    job_kind: string
    required_proficiency_pct: number | null
    company: {
      name: string
    } | null
  } | null
  skill_results: Array<{
    band: string
  }> | null
  invitation: Array<{
    status: string
  }> | null
}

export default function MyAssessmentsPage() {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('readiness')
  const [filters, setFilters] = useState<Record<string, string[]>>({
    status: [],
    invitation: []
  })

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
          job:jobs!inner(id, title, soc_code, job_kind, required_proficiency_pct, retake_cooldown_enabled, company:companies(name)),
          skill_results:assessment_skill_results(band),
          invitation:employer_invitations(status)
        `)
        .eq('user_id', user.id)
        .eq('job.job_kind', 'featured_role')
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
  const filteredAssessments = assessments.filter((a) => {
    // Search filter
    const matchesSearch = !searchQuery || 
      a.job?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.job?.company?.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Status filter - map display labels to database values
    const statusFilters = filters.status || []
    const statusMap: Record<string, string> = {
      'Role Ready': 'role_ready',
      'Almost There': 'close_gaps',
      'Developing': 'developing'
    }
    const dbStatusFilters = statusFilters.map(f => statusMap[f] || f)
    const matchesStatus = dbStatusFilters.length === 0 || dbStatusFilters.includes(a.status_tag || '')
    
    // Invitation filter
    const invitationFilters = filters.invitation || []
    const inviteStatus = a.invitation?.[0]?.status
    const matchesInvitation = invitationFilters.length === 0 || 
      (invitationFilters.includes('Shared with Employer') && inviteStatus) ||
      (invitationFilters.includes('Not Shared') && !inviteStatus) ||
      (inviteStatus && invitationFilters.includes(inviteStatus.charAt(0).toUpperCase() + inviteStatus.slice(1)))
    
    return matchesSearch && matchesStatus && matchesInvitation
  })

  const sortedAssessments = [...filteredAssessments].sort((a, b) => {
    if (sortBy === 'readiness') {
      return (b.readiness_pct || 0) - (a.readiness_pct || 0)
    }
    return new Date(b.analyzed_at || b.created_at).getTime() - new Date(a.analyzed_at || a.created_at).getTime()
  })

  const getRelativeTime = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  }

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

  const getInvitationBadge = (invitationStatus: string | null) => {
    if (!invitationStatus) return null
    
    const statusConfig: Record<string, { bg: string, text: string, label: string }> = {
      sent: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Shared with Employer' },
      pending: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Shared with Employer' },
      applied: { bg: 'bg-teal-50', text: 'text-teal-700', label: 'Applied' },
      hired: { bg: 'bg-green-50', text: 'text-green-700', label: 'Hired' },
      unqualified: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Position Filled' },
      declined: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Declined' }
    }
    
    const config = statusConfig[invitationStatus]
    if (!config) return null
    
    return (
      <span className={`inline-flex h-[22px] items-center rounded-full ${config.bg} px-3 text-xs font-medium ${config.text}`}>
        {config.label}
      </span>
    )
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
              searchPlaceholder="Search by job title or company"
              sortBy={sortBy}
              sortOrder="asc"
              onSortChange={(value) => setSortBy(value)}
              filters={filters}
              onFilterChange={(key, values) => {
                setFilters(prev => ({ ...prev, [key]: values }))
              }}
              columns={[
                { key: 'readiness', label: 'Readiness', sortable: true },
                { key: 'date', label: 'Date', sortable: true },
                { 
                  key: 'status', 
                  label: 'Status', 
                  filterable: true, 
                  filterOptions: ['Role Ready', 'Almost There', 'Developing']
                },
                { 
                  key: 'invitation', 
                  label: 'Invitation', 
                  filterable: true, 
                  filterOptions: ['Shared with Employer', 'Not Shared', 'Applied', 'Hired']
                }
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
          <TooltipProvider delayDuration={100}>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedAssessments.map((assessment) => {
                // Use NEW standardized enum values: proficient, building, developing
                const skillsGaps = assessment.skill_results?.filter(sr => sr.band === 'developing' || sr.band === 'building').length || 0
                const totalSkills = assessment.skill_results?.length || 0
                
                // Cooldown logic - check if role has cooldown enabled
                const cooldownEnabled = (assessment.job as any)?.retake_cooldown_enabled ?? true // Default to enabled
                const analyzedAt = new Date(assessment.analyzed_at || assessment.created_at)
                const now = new Date()
                const hoursSinceAnalysis = (now.getTime() - analyzedAt.getTime()) / (1000 * 60 * 60)
                const hoursRemaining = Math.max(0, 24 - hoursSinceAnalysis)
                const isOnCooldown = cooldownEnabled && hoursRemaining > 0 // Only apply cooldown if enabled
                const isRoleReady = assessment.status_tag === 'role_ready'
                
                return (
                  <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 flex flex-col h-full">
                      {/* Company */}
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-semibold">{assessment.job?.company?.name || 'Company'}</span>
                      </p>
                      
                      {/* Job Title */}
                      <Link href={`/assessments/${assessment.id}/results`}>
                        <h3 className="text-xl font-bold text-gray-900 mb-3 font-source-sans-pro hover:text-teal-700 transition-colors cursor-pointer">
                          {assessment.job?.title || 'Unknown Job'}
                        </h3>
                      </Link>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {getStatusBadge(assessment.readiness_pct || 0, assessment.status_tag || '')}
                        {assessment.invitation?.[0]?.status && getInvitationBadge(assessment.invitation[0].status)}
                      </div>

                      {/* Date & Skills Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-6 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{getRelativeTime(assessment.analyzed_at || assessment.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className="h-4 w-4" />
                          <span>{totalSkills} {totalSkills === 1 ? 'Skill' : 'Skills'} Assessed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4" />
                          <span>{assessment.program_matches_count || 0} {(assessment.program_matches_count || 0) === 1 ? 'Program' : 'Programs'}</span>
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="border-t border-gray-200 mb-4 mt-auto"></div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/assessments/${assessment.id}/results`}>Assessment Results</Link>
                        </Button>
                        
                        {isRoleReady ? (
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <Link href="/invitations">View Invites</Link>
                          </Button>
                        ) : isOnCooldown ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex-1">
                                <Button variant="outline" size="sm" className="w-full" disabled>
                                  Retake in {Math.ceil(hoursRemaining)}h
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px]">
                              <p>Assessments can only be taken once every 24 hours. Come back in {Math.ceil(hoursRemaining)} hours.</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <Link href={`/assessments/quiz/${assessment.quiz_id}`}>Retake Quiz</Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}
