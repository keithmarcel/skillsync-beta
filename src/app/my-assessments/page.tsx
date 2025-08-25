'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import PageHeader from '@/components/ui/page-header'
import { AssessmentCard } from '@/components/ui/assessment-card'
import { TitleHero } from '@/components/ui/title-hero'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import { routes } from '@/lib/routes'
import { getStatusTagLabel, getStatusTagColor } from '@/lib/readiness'
import { useState, useEffect } from 'react'
import { getUserAssessments, type Assessment } from '@/lib/database/queries'

export default function MyAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAssessments() {
      try {
        setLoading(true)
        // For demo purposes, using a mock user ID since we don't have auth yet
        const mockUserId = 'demo-user-id'
        const data = await getUserAssessments(mockUserId)
        setAssessments(data)
      } catch (error) {
        console.error('Error loading assessments:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAssessments()
  }, [])

  const hasAssessments = assessments.length > 0

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader 
        title="My Assessments"
        subtitle="Track your skills progress and career readiness over time."
        variant="split"
      />
      
      <div className="max-w-[1280px] mx-auto px-6 mt-10">
        <TitleHero 
          heroImage="/assets/hero_my-assessments.jpg"
          title="My Assessments"
          showHeroOnly={true}
        />
      </div>
      
      {loading ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">Loading your assessments...</div>
        </main>
      ) : !hasAssessments ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            title="Your Assessment Journey"
            description="No assessments completed yet. Start exploring jobs and take your first skills assessment to begin your career journey!"
            primaryButtonText="Browse Featured Roles"
            secondaryButtonText="Browse All Jobs"
            onPrimaryClick={() => window.location.href = '/jobs'}
            onSecondaryClick={() => window.location.href = '/jobs'}
          />
        </main>
      ) : (
        /* Main Content */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-green-600">
                {assessments.filter((a: Assessment) => a.status_tag === 'role_ready').length}
              </CardTitle>
              <CardDescription>Roles Ready</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">You're qualified for these positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-blue-600">
                {assessments.length > 0 ? Math.round(assessments.reduce((sum: number, a: Assessment) => sum + (a.readiness_pct || 0), 0) / assessments.length) : 0}%
              </CardTitle>
              <CardDescription>Average Readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Across all your assessments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-purple-600">
                {assessments.length}
              </CardTitle>
              <CardDescription>Total Assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Completed evaluations</p>
            </CardContent>
          </Card>
        </div>

        {/* Assessments List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Assessments</h2>
            <Button asChild>
              <Link href={routes.jobs}>Take New Assessment</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment: Assessment) => (
              <AssessmentCard
                key={assessment.id}
                id={assessment.id}
                jobTitle={assessment.job?.title || 'Unknown Job'}
                jobType={assessment.job?.job_kind === 'featured_role' ? 'Featured Role' : 'High Demand Occupation'}
                readinessScore={assessment.readiness_pct || 0}
                status={assessment.status_tag as 'role_ready' | 'close_gaps' | 'needs_development'}
                assessmentMethod={assessment.method === 'resume' ? 'Resume Upload' : 'Skills Assessment'}
                analyzedDate={assessment.analyzed_at || new Date().toISOString()}
                skillsGapsIdentified={assessment.skill_results?.filter(sr => sr.band === 'developing').length || 0}
                totalSkills={assessment.skill_results?.length || 8}
                specificGaps={assessment.status_tag === 'close_gaps' ? ['Process Improvement', 'Strategic Planning'] : undefined}
                reportHref={routes.assessment(assessment.id)}
              />
            ))}
          </div>

        </div>
        </main>
      )}
    </div>
  )
}
