'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import DataTable from '@/components/ui/data-table'
import { employerRolesTableColumns } from '@/lib/employer-roles-table-config'
import { supabase } from '@/lib/supabase/client'

interface Job {
  id: string
  title: string
  short_desc: string | null
  category: string | null
  required_proficiency_pct: number
  assessments_count: number
  is_published: boolean
}

interface EmployerRolesTableProps {
  companyId: string
}

export function EmployerRolesTableV2({ companyId }: EmployerRolesTableProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJobs()
  }, [companyId])

  async function loadJobs() {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyId)
        .eq('job_kind', 'featured_role')
        .order('title')

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRowAction = async (action: string, row: any) => {
    try {
      switch (action) {
        case 'view-details':
          router.push(`/employer/roles/${row.id}`)
          break
        case 'edit':
          router.push(`/employer/roles/${row.id}/edit`)
          break
        case 'publish':
          await supabase
            .from('jobs')
            .update({ is_published: true })
            .eq('id', row.id)
          await loadJobs()
          break
        case 'unpublish':
          await supabase
            .from('jobs')
            .update({ is_published: false })
            .eq('id', row.id)
          await loadJobs()
          break
        case 'delete':
          if (confirm('Are you sure you want to delete this role?')) {
            await supabase
              .from('jobs')
              .delete()
              .eq('id', row.id)
            await loadJobs()
          }
          break
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
      alert(`Failed to ${action.replace('-', ' ')}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size={60} text="Loading Roles" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 font-source-sans-pro">Manage Your Roles</h2>
        <Button 
          className="bg-teal-600 hover:bg-teal-700"
          onClick={() => router.push('/employer/roles/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Role
        </Button>
      </div>

      <DataTable
        data={jobs}
        columns={employerRolesTableColumns}
        onRowAction={handleRowAction}
        isLoading={loading}
        loadingText="Loading Roles"
      />
    </div>
  )
}
