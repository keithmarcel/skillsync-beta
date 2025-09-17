import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AdminTable } from '@/components/admin/AdminTable'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default async function OccupationsPage() {
  const supabase = createClient()
  
  // Fetch high-demand occupations (jobs with job_kind = 'occupation')
  const { data: occupations, error } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      soc_code,
      category,
      location_city,
      location_state,
      median_wage_usd,
      required_proficiency_pct,
      long_desc,
      skills_count,
      created_at,
      updated_at
    `)
    .eq('job_kind', 'occupation')
    .order('title')

  if (error) {
    console.error('Error fetching occupations:', error)
    return <div>Error loading occupations</div>
  }

  const columns = [
    {
      key: 'title',
      header: 'Occupation Title',
      sortable: true
    },
    {
      key: 'soc_code',
      header: 'SOC Code',
      sortable: true
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true
    },
    {
      key: 'location_city',
      header: 'Location',
      render: (occupation: any) => occupation.location_city && occupation.location_state 
        ? `${occupation.location_city}, ${occupation.location_state}` 
        : occupation.location_city || occupation.location_state || 'National'
    },
    {
      key: 'median_wage_usd',
      header: 'Median Salary',
      render: (occupation: any) => occupation.median_wage_usd 
        ? `$${occupation.median_wage_usd.toLocaleString()}` 
        : '-'
    },
    {
      key: 'skills_count',
      header: 'Skills',
      render: (occupation: any) => occupation.skills_count || 0
    }
  ]

  const actions = [
    {
      label: 'Edit',
      href: (occupation: any) => `/admin/occupations/${occupation.id}`
    },
    {
      label: 'View Skills',
      href: (occupation: any) => `/admin/skills?occupation=${occupation.id}`
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">High-Demand Occupations</h1>
            <p className="text-gray-600">Manage occupation data and skill requirements</p>
          </div>
          <a 
            href="/admin/occupations/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add Occupation
          </a>
        </div>

        <Suspense fallback={<div>Loading occupations...</div>}>
          <AdminTable
            data={occupations || []}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search occupations..."
            emptyMessage="No occupations found"
          />
        </Suspense>
      </div>
    </AdminLayout>
  )
}
