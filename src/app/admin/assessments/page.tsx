import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AdminTable } from '@/components/admin/AdminTable'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default async function AssessmentsPage() {
  const supabase = createClient()
  
  // Fetch assessments data with related job information
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select(`
      id,
      title,
      description,
      difficulty_level,
      time_limit_minutes,
      passing_score,
      is_active,
      created_at,
      updated_at,
      jobs (
        id,
        title
      )
    `)
    .order('title')

  if (error) {
    console.error('Error fetching assessments:', error)
    return <div>Error loading assessments</div>
  }

  const columns = [
    {
      key: 'title',
      header: 'Assessment Title',
      sortable: true
    },
    {
      key: 'jobs.title',
      header: 'Related Job',
      render: (assessment: any) => assessment.jobs?.title || '-'
    },
    {
      key: 'difficulty_level',
      header: 'Difficulty',
      sortable: true,
      render: (assessment: any) => {
        const level = assessment.difficulty_level
        const colors = {
          beginner: 'text-green-600 bg-green-100',
          intermediate: 'text-yellow-600 bg-yellow-100',
          advanced: 'text-red-600 bg-red-100'
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-100'}`}>
            {level?.charAt(0).toUpperCase() + level?.slice(1) || 'Unknown'}
          </span>
        )
      }
    },
    {
      key: 'time_limit_minutes',
      header: 'Time Limit',
      render: (assessment: any) => assessment.time_limit_minutes 
        ? `${assessment.time_limit_minutes} min` 
        : 'No limit'
    },
    {
      key: 'passing_score',
      header: 'Passing Score',
      render: (assessment: any) => assessment.passing_score 
        ? `${assessment.passing_score}%` 
        : '-'
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (assessment: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          assessment.is_active 
            ? 'text-green-600 bg-green-100' 
            : 'text-gray-600 bg-gray-100'
        }`}>
          {assessment.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ]

  const actions = [
    {
      label: 'Edit',
      href: (assessment: any) => `/admin/assessments/${assessment.id}`
    },
    {
      label: 'View Questions',
      href: (assessment: any) => `/admin/assessments/${assessment.id}/questions`
    },
    {
      label: 'Toggle Status',
      onClick: async (assessment: any) => {
        'use server'
        const supabase = createClient()
        await supabase
          .from('assessments')
          .update({ is_active: !assessment.is_active })
          .eq('id', assessment.id)
      }
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Skill Assessments</h1>
            <p className="text-gray-600">Manage assessments and quiz questions</p>
          </div>
          <div className="flex gap-2">
            <a 
              href="/admin/assessments/generate"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Generate with AI
            </a>
            <a 
              href="/admin/assessments/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Add Assessment
            </a>
          </div>
        </div>

        <Suspense fallback={<div>Loading assessments...</div>}>
          <AdminTable
            data={assessments || []}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search assessments..."
            emptyMessage="No assessments found"
          />
        </Suspense>
      </div>
    </AdminLayout>
  )
}
