'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Separator } from "@/components/ui/separator"
import PageHeader from "@/components/ui/page-header"
import { SkillSyncSnapshot } from "@/components/ui/skillsync-snapshot"
import { ActionCard } from "@/components/ui/action-card"
import { ListCard } from "@/components/ui/list-card"
import { LoadingState } from "@/components/ui/loading-state"
import { useFavorites } from '@/hooks/useFavorites'
import { useDashboardData } from '@/hooks/useDashboardData';
import { useSnapshotData } from '@/hooks/useSnapshotData'; // Import the snapshot hook
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // All data fetching and state management is now handled by custom hooks.
  const { user, profile, isEmployerAdmin, isProviderAdmin, isSuperAdmin } = useAuth();
  const { recentAssessments, loading: dashboardLoading } = useDashboardData();
  const { favoriteJobs, favoritePrograms, loading: favoritesLoading } = useFavorites();
  const { metrics, skillData, assessmentProgress, hasAssessments, loading: snapshotLoading } = useSnapshotData();

  // The loading state is now derived from all data hooks, ensuring a smooth experience.
  const isLoading = !mounted || dashboardLoading || favoritesLoading || snapshotLoading;

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="space-y-0">
        {/* Page Header Skeleton */}
        <div className="bg-[#EDFAFA] py-12 mt-4">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="animate-pulse">
              <div className="h-9 bg-gray-300 rounded w-48 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-96"></div>
            </div>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ marginTop: '16px' }}>
          {/* Action Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-xl overflow-hidden">
                  <div className="h-[11.5rem] bg-gray-200"></div>
                  <div className="bg-gray-100 p-6">
                    <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-9 bg-gray-300 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-gray-200 my-10"></div>

          {/* Snapshot Skeleton */}
          <div className="space-y-6">
            <div className="h-7 bg-gray-200 rounded w-64 animate-pulse"></div>
            
            {/* Metrics Cards Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="border rounded-lg p-6">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-9 bg-gray-300 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Graph Skeleton */}
            <div className="animate-pulse">
              <div className="rounded-[10px] border border-[#E5E5E5] p-6" style={{
                background: 'linear-gradient(180deg, #002E3E 0%, #111928 100%)'
              }}>
                <div className="h-6 bg-gray-700 rounded w-48 mb-6"></div>
                <div className="h-[300px] bg-gray-800 rounded"></div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-200 my-10"></div>

          {/* Saved Jobs/Programs Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="border rounded-lg p-6">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex justify-between">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <PageHeader 
        variant="split"
        isDynamic={true}
        userName={profile?.first_name || undefined}
        isReturningUser={recentAssessments.length > 0}
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

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ marginTop: '16px' }}>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          title="Discover Open Positions in Your Area"
          description="Browse featured roles from local employers and take assessments to see if you're ready."
          buttonText="View Open Roles"
          href="/jobs"
          imageUrl="/assets/heroimagehome_01.png"
        />
        
        <ActionCard
          title="Explore High-Demand Occupations"
          description="See which careers are growing in your region and assess your proficiency for in-demand roles."
          buttonText="Explore Occupations"
          href="/jobs?tab=high-demand"
          imageUrl="/assets/heroimagehome_02.png"
        />
        
        <ActionCard
          title="Browse Education Programs"
          description="Find certificate programs, degrees, and training aligned to your skill gaps and career goals."
          buttonText="Browse Programs"
          href="/programs"
          imageUrl="/assets/heroimagehome_03.png"
        />
      </div>

      <div className="py-10">
        <Separator />
      </div>

      {/* The SkillSyncSnapshot is now fully dynamic and data-driven */}
      <SkillSyncSnapshot 
        hasAssessments={hasAssessments}
        metrics={metrics || undefined}
        skillData={skillData || undefined}
        assessmentProgress={assessmentProgress}
      />

      <div className="py-10">
        <Separator />
      </div>

      {/* Saved Jobs and Programs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ListCard
          title="Saved Jobs"
          description="Jobs you like that match your skills and career goals."
          viewAllHref="/jobs?tab=favorites"
          items={favoriteJobs.slice(0, 5).map(job => {
            // Apply proper category mapping for featured roles (consistent with jobs page)
            const getProperCategory = (job: any) => {
              if (job.job_kind === 'featured_role') {
                // Prefer database category if set, otherwise use title-based mapping for legacy data
                if (job.category && job.category.trim() !== '' && job.category !== 'Featured Role') {
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

            const properCategory = getProperCategory(job)
            
            return {
              id: job.id,
              title: job.title,
              description: job.long_desc ? 
                (job.long_desc.length > 50 ? `${job.long_desc.substring(0, 50)}...` : job.long_desc) :
                `${properCategory} position with competitive benefits...`,
              href: `/jobs/${job.id}`
            }
          })}
        />

        <ListCard
          title="Saved Programs"
          description="Programs you've bookmarked to help close skill gaps."
          viewAllHref="/programs?tab=favorites"
          items={favoritePrograms.slice(0, 5).map(program => ({
            id: program.id,
            title: program.name,
            description: program.school?.name || 'Educational Institution',
            href: `/programs/${program.id}`
          }))}
        />
      </div>

      </div>
    </div>
  )
}
