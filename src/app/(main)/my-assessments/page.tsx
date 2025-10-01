'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Target, FileText, Upload } from 'lucide-react'
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
    if (user) {
      loadAssessments()
    }
  }, [user])

  async function loadAssessments() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          job:jobs(id, title, soc_code, company:companies(name)),
          skill_results:assessment_skill_results(band)
        `)
        .eq('user_id', user?.id)
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
  const filteredAssessments = assessments.filter(a => 
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
    if (status === 'role_ready' || readiness >= 80) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{readiness}% → Role Ready</Badge>
    } else if (status === 'close_gaps' || readiness >= 60) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{readiness}% → Close Gaps</Badge>
    }
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Needs Development</Badge>
  }

  const hasAssessments = assessments.length > 0

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your assessments</p>
          <Button onClick={() => window.location.href = '/auth/login'}>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Title Overlay */}
      <div className="relative h-[280px] bg-[#114B5F]">
        <Image
          src="/assets/hero_my-assessments.jpg"
          alt="My Assessments"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-[1280px] mx-auto px-6 w-full">
            <h1 className="text-4xl font-bold text-white mb-2">My Assessments</h1>
            <p className="text-white/90">Review your past SkillSync assessments and explore next steps to grow your skills.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="max-w-[1280px] mx-auto px-6 py-12">
          <div className="text-center py-8">Loading your assessments...</div>
        </div>
      ) : !hasAssessments ? (
        <div className="max-w-[1280px] mx-auto px-6 py-12">
          <EmptyState
            title="Your Assessment Journey"
            description="No assessments completed yet. Start exploring jobs and take your first skills assessment to begin your career journey!"
            primaryButtonText="Browse Featured Roles"
            secondaryButtonText="Browse All Jobs"
            onPrimaryClick={() => window.location.href = '/jobs'}
            onSecondaryClick={() => window.location.href = '/jobs'}
          />
        </div>
      ) : (
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          {/* Search and Sort */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by keyword, category, or SOC code"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="readiness">Readiness</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assessment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAssessments.map((assessment) => {
              const skillsGaps = assessment.skill_results?.filter(sr => sr.band === 'needs_dev' || sr.band === 'building').length || 0
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
                        {assessment.method === 'quiz' ? <Target className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                        <span>{assessment.method === 'quiz' ? 'Skills Assessment' : 'Resume Upload'}</span>
                      </div>
                      <span>•</span>
                      <span>Analyzed on {new Date(assessment.analyzed_at || assessment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
        </div>
      )}
    </div>
  )
}
