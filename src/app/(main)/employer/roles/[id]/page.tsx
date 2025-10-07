'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import PageHeader from '@/components/ui/page-header'
import Breadcrumb from '@/components/ui/breadcrumb'
import { supabase } from '@/lib/supabase/client'

interface Job {
  id: string
  title: string
  soc_code: string | null
  short_desc: string | null
  long_desc: string | null
  category: string | null
  required_proficiency_pct: number
  visibility_threshold_pct: number
  application_url: string | null
  is_published: boolean
}

export default function EmployerRoleDetailPage() {
  const params = useParams()
  const { user, isEmployerAdmin } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadJob(params.id as string)
    }
  }, [params.id])

  async function loadJob(jobId: string) {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) throw error
      setJob(data)
    } catch (error) {
      console.error('Error loading job:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Role not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader
        title="Welcome, Power Design!"
        subtitle="Lorem ipsum dolor sit amet egestas in pharetra elementum dolore laoreet cras."
        variant="split"
      />

      <main className="max-w-[1280px] mx-auto px-6">
        {/* Breadcrumb */}
        <div className="py-3">
          <Breadcrumb items={[
            { label: 'Listed Roles', href: '/employer?tab=roles' },
            { label: job.title, isActive: true }
          ]} />
        </div>

        {/* Role Title */}
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          {job.soc_code && (
            <p className="text-sm text-gray-600 mt-1">SOC: {job.soc_code}</p>
          )}
        </div>

        {/* Metrics Widget Placeholder */}
        <div className="bg-white rounded-lg border border-gray-200 p-12 mb-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Metrics Widgets for Individual Featured Role
            </h3>
            <p className="text-gray-600">
              Place all quick engagement metric widgets for this individual role here.
            </p>
          </div>
        </div>

        {/* Edit/Manage Form Placeholder */}
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Edit/ Manage Individual Featured Role
            </h3>
            <p className="text-gray-600 mb-4">
              Place all edit options a company can use to edit and manage a selected role
            </p>
            <ul className="text-sm text-gray-500 space-y-1 text-left max-w-md mx-auto">
              <li>• Name</li>
              <li>• Soc</li>
              <li>• required proficiency</li>
              <li>• proficiency threshold for invites (ex. show ≥84% in invites list)</li>
              <li>• Job Application URL</li>
              <li>• Published status</li>
              <li>• category</li>
              <li>• Summary (Short Desc)</li>
              <li>• Long Desc</li>
              <li>• Skills</li>
              <li>• Assessment questions (with parameter options)</li>
              <li>• etc.</li>
              <li>• Cancel</li>
              <li>• Save Changes</li>
              <li>• Dialogs</li>
              <li>• Toasts</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
