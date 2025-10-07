'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import PageHeader from '@/components/ui/page-header'
import Breadcrumb from '@/components/ui/breadcrumb'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Program {
  id: string
  name: string
  cip_code: string | null
  short_desc: string | null
  long_desc: string | null
  program_type: string | null
  format: string | null
  duration_text: string | null
  program_url: string | null
  is_featured: boolean
  is_published: boolean
  skills_count: number
}

export default function ProviderProgramDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isProviderAdmin } = useAuth()
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadProgram(params.id as string)
    }
  }, [params.id])

  async function loadProgram(programId: string) {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single()

      if (error) throw error
      setProgram(data)
    } catch (error) {
      console.error('Error loading program:', error)
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

  if (!program) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Program not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader
        title={`Welcome, St. Petersburg College!`}
        subtitle="Lorem ipsum dolor sit amet egestas in pharetra elementum dolore laoreet cras."
        variant="split"
      />

      <main className="max-w-[1280px] mx-auto px-6">
        {/* Breadcrumb */}
        <div className="py-3">
          <Breadcrumb items={[
            { label: 'Listed Programs', href: '/provider?tab=programs' },
            { label: program.name, isActive: true }
          ]} />
        </div>

        {/* Program Title */}
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{program.name}</h1>
          {program.cip_code && (
            <p className="text-sm text-gray-600 mt-1">CIP: {program.cip_code}</p>
          )}
        </div>

        {/* Metrics Widget Placeholder */}
        <div className="bg-white rounded-lg border border-gray-200 p-12 mb-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Metrics Widgets for Individual Program
            </h3>
            <p className="text-gray-600">
              Place all quick engagement metric widgets for this individual program here.
            </p>
          </div>
        </div>

        {/* Edit/Manage Form Placeholder */}
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Edit/ Manage Individual Featured Program
            </h3>
            <p className="text-gray-600 mb-4">
              Place all edit options a provider can use to edit and manage a selected program
            </p>
            <ul className="text-sm text-gray-500 space-y-1 text-left max-w-md mx-auto">
              <li>• Name</li>
              <li>• CIP</li>
              <li>• Program Page URL</li>
              <li>• Published status</li>
              <li>• Featured Status (5 max)</li>
              <li>• category</li>
              <li>• Summary (Short Desc)</li>
              <li>• Long Desc</li>
              <li>• Type</li>
              <li>• Duration</li>
              <li>• Format</li>
              <li>• Skills</li>
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
