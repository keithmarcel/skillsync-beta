import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AdminTable } from '@/components/admin/AdminTable'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default async function ProgramsPage() {
  const supabase = createClient()
  
  // Fetch programs data with school information
  const { data: programs, error } = await supabase
    .from('programs')
    .select(`
      id,
      name,
      program_type,
      format,
      duration_text,
      short_desc,
      program_url,
      cip_code,
      created_at,
      updated_at,
      schools (
        id,
        name
      )
    `)
    .order('name')

  if (error) {
    console.error('Error fetching programs:', error)
    return <div>Error loading programs</div>
  }

  const columns = [
    {
      key: 'name',
      header: 'Program Name',
      sortable: true
    },
    {
      key: 'schools.name',
      header: 'Provider',
      render: (program: any) => program.schools?.name || '-'
    },
    {
      key: 'program_type',
      header: 'Type',
      sortable: true
    },
    {
      key: 'format',
      header: 'Format',
      sortable: true
    },
    {
      key: 'duration_text',
      header: 'Duration',
      sortable: true
    },
    {
      key: 'cip_code',
      header: 'CIP Code',
      sortable: true
    }
  ]

  const actions = [
    {
      label: 'Edit',
      href: (program: any) => `/admin/programs/${program.id}`
    },
    {
      label: 'View Provider',
      href: (program: any) => `/admin/providers/${program.school_id}`
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Education Programs</h1>
            <p className="text-gray-600">Manage training programs and certifications</p>
          </div>
          <a 
            href="/admin/programs/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add Program
          </a>
        </div>

        <Suspense fallback={<div>Loading programs...</div>}>
          <AdminTable
            data={programs || []}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search programs..."
            emptyMessage="No programs found"
          />
        </Suspense>
      </div>
    </AdminLayout>
  )
}
