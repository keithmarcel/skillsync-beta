'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SkillSyncSnapshot } from "@/components/ui/skillsync-snapshot"
import { getUserAssessments, listJobs } from '@/lib/api'

export default function Dashboard() {
  const [recentAssessments, setRecentAssessments] = useState<any[]>([])
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [assessments, jobs] = await Promise.all([
          getUserAssessments().catch(() => []),
          listJobs('featured_role').catch(() => [])
        ])
        
        setRecentAssessments(assessments.slice(0, 3))
        setFeaturedJobs(jobs.slice(0, 4))
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <PageHeader 
        variant="split"
        isDynamic={true}
        userName="Keith" // TODO: Get from user context/auth
        isReturningUser={false} // TODO: Get from user session data
        primaryAction={{
          label: "Get Started",
          href: "/jobs"
        }}
        secondaryAction={{
          label: "Upload Resume",
          onClick: () => {
            // TODO: Implement resume upload modal
            console.log("Upload resume clicked")
          }
        }}
      />

      <div className="max-w-[1280px] mx-auto px-6 py-8 mt-10">

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-teal-600 text-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Explore Top Occupations</h3>
            <p className="text-teal-50 text-sm mb-4">
              Discover high-demand roles in your region, view job descriptions, and learn more.
            </p>
            <Button variant="secondary" size="sm" className="hover:bg-teal-100 hover:text-gray-900 transition-colors text-sm" asChild>
              <Link href="/jobs" className="flex items-center gap-2">
                Explore Jobs
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-teal-600 text-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Browse Education Programs</h3>
            <p className="text-teal-50 text-sm mb-4">
              Find trusted education programs aligned to the skills employers want most.
            </p>
            <Button variant="secondary" size="sm" className="hover:bg-teal-100 hover:text-gray-900 transition-colors text-sm" asChild>
              <Link href="/programs" className="flex items-center gap-2">
                Browse Programs
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-teal-600 text-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">Review Your Proficiency</h3>
            <p className="text-teal-50 text-sm mb-4">
              Review your readiness scores and see your assessment summary.
            </p>
            <Button variant="secondary" size="sm" className="hover:bg-teal-100 hover:text-gray-900 transition-colors text-sm" asChild>
              <Link href="/assessments" className="flex items-center gap-2">
                Review Assessments
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="py-10">
        <Separator />
      </div>

      {/* Empty State Snapshot */}
      <SkillSyncSnapshot hasAssessments={false} />

      <div className="py-10">
        <Separator />
      </div>

      {/* Filled State Snapshot with Sample Data */}
      <SkillSyncSnapshot 
        hasAssessments={true}
        metrics={{
          rolesReadyFor: 3,
          overallRoleReadiness: 60,
          skillsIdentified: 89,
          gapsHighlighted: 56
        }}
        skillData={{
          proficient: 34,
          building: 45,
          needsDevelopment: 66
        }}
      />

      <div className="py-10">
        <Separator />
      </div>

      {/* Saved Jobs and Programs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saved Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Saved Jobs</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/jobs" className="text-teal-600 hover:text-teal-700">
                  View All →
                </Link>
              </Button>
            </div>
            <CardDescription>
              Jobs you like that match your skills and career goals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Electronics</h4>
                  <p className="text-xs text-gray-600">Oversees daily business functions and cross-functional...</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/jobs/1" className="text-teal-600 hover:text-teal-700 text-xs">
                    Job Details →
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Bookkeeping, Accounting & Auditing Clerks</h4>
                  <p className="text-xs text-gray-600">Maintains financial records and transactional acc...</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/jobs/2" className="text-teal-600 hover:text-teal-700 text-xs">
                    Job Details →
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Computer User Support Specialists</h4>
                  <p className="text-xs text-gray-600">Assists users with technical problems and IT su...</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/jobs/3" className="text-teal-600 hover:text-teal-700 text-xs">
                    Job Details →
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Accountants & Auditors</h4>
                  <p className="text-xs text-gray-600">Prepares, audits, and analyzes financial reports...</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/jobs/4" className="text-teal-600 hover:text-teal-700 text-xs">
                    Job Details →
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">General & Operations Managers</h4>
                  <p className="text-xs text-gray-600">Oversees daily business functions and oper...</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/jobs/5" className="text-teal-600 hover:text-teal-700 text-xs">
                    Job Details →
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Programs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Saved Programs</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/programs" className="text-teal-600 hover:text-teal-700">
                  View All →
                </Link>
              </Button>
            </div>
            <CardDescription>
              Programs you've bookmarked to help close skill gaps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Project Management Certificate</h4>
                  <p className="text-xs text-gray-600">St. Petersburg College</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/programs/1" className="text-teal-600 hover:text-teal-700 text-xs">
                    Program Details →
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Electricity Program</h4>
                  <p className="text-xs text-gray-600">Pinellas Technical College</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/programs/2" className="text-teal-600 hover:text-teal-700 text-xs">
                    Program Details →
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">IT Support Tech (CompTIA A+)</h4>
                  <p className="text-xs text-gray-600">Pinellas Technical College</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/programs/3" className="text-teal-600 hover:text-teal-700 text-xs">
                    Program Details →
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Business Intelligence Certificate</h4>
                  <p className="text-xs text-gray-600">Pinellas Technical College</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/programs/4" className="text-teal-600 hover:text-teal-700 text-xs">
                    Program Details →
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">A.S. Business Admin</h4>
                  <p className="text-xs text-gray-600">St. Petersburg College</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/programs/5" className="text-teal-600 hover:text-teal-700 text-xs">
                    Program Details →
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      </div>
    </div>
  )
}
