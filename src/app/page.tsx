'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PageHeader from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SkillSyncSnapshot } from "@/components/ui/skillsync-snapshot"
import { ActionCard } from "@/components/ui/action-card"
import { ListCard } from "@/components/ui/list-card"
import { LoadingState } from "@/components/ui/loading-state"
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
        <LoadingState variant="skeleton" count={3} size="lg" />
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

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-10">

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          title="Explore Top Occupations"
          description="Discover high-demand roles in your region, view job descriptions, and learn more."
          buttonText="Explore Jobs"
          href="/jobs"
        />
        
        <ActionCard
          title="Browse Education Programs"
          description="Find trusted education programs aligned to the skills employers want most."
          buttonText="Browse Programs"
          href="/programs"
        />
        
        <ActionCard
          title="Review Your Proficiency"
          description="Review your readiness scores and see your assessment summary."
          buttonText="Review Assessments"
          href="/assessments"
        />
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
        <ListCard
          title="Saved Jobs"
          description="Jobs you like that match your skills and career goals."
          viewAllHref="/jobs"
          items={[
            {
              id: "1",
              title: "Electronics",
              description: "Oversees daily business functions and cross-functional...",
              href: "/jobs/1"
            },
            {
              id: "2", 
              title: "Bookkeeping, Accounting & Auditing Clerks",
              description: "Maintains financial records and transactional acc...",
              href: "/jobs/2"
            },
            {
              id: "3",
              title: "Computer User Support Specialists", 
              description: "Assists users with technical problems and IT su...",
              href: "/jobs/3"
            },
            {
              id: "4",
              title: "Accountants & Auditors",
              description: "Prepares, audits, and analyzes financial reports...",
              href: "/jobs/4"
            },
            {
              id: "5",
              title: "General & Operations Managers",
              description: "Oversees daily business functions and oper...",
              href: "/jobs/5"
            }
          ]}
        />

        <ListCard
          title="Saved Programs"
          description="Programs you've bookmarked to help close skill gaps."
          viewAllHref="/programs"
          items={[
            {
              id: "1",
              title: "Project Management Certificate",
              description: "St. Petersburg College",
              href: "/programs/1"
            },
            {
              id: "2",
              title: "Electricity Program",
              description: "Pinellas Technical College", 
              href: "/programs/2"
            },
            {
              id: "3",
              title: "IT Support Tech (CompTIA A+)",
              description: "Pinellas Technical College",
              href: "/programs/3"
            },
            {
              id: "4", 
              title: "Business Intelligence Certificate",
              description: "Pinellas Technical College",
              href: "/programs/4"
            },
            {
              id: "5",
              title: "A.S. Business Admin",
              description: "St. Petersburg College",
              href: "/programs/5"
            }
          ]}
        />
      </div>

      </div>
    </div>
  )
}
