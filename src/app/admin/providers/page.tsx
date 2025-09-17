import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AdminTable } from '@/components/admin/AdminTable'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default async function ProvidersPage() {
  const supabase = createClient()
  
  // Fetch education providers (schools) data
  const { data: providers, error } = await supabase
    .from('schools')
    .select(`
      id,
      name,
      logo_url,
      about_url,
      city,
      state,
      created_at,
      updated_at
    `)
    .order('name')

  if (error) {
    console.error('Error fetching providers:', error)
    return <div>Error loading education providers</div>
  }

  const columns = [
    {
      key: 'name',
      header: 'Provider Name',
      sortable: true
    },
    {
      key: 'city',
      header: 'Location',
      render: (provider: any) => provider.city && provider.state 
        ? `${provider.city}, ${provider.state}` 
        : provider.city || provider.state || '-'
    },
    {
      key: 'about_url',
      header: 'Website',
      render: (provider: any) => provider.about_url 
        ? <a href={provider.about_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
        : '-'
    }
  ]

  const actions = [
    {
      label: 'Edit',
      href: (provider: any) => `/admin/providers/${provider.id}`
    },
    {
      label: 'View Programs',
      href: (provider: any) => `/admin/programs?provider=${provider.id}`
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Education Providers</h1>
            <p className="text-gray-600">Manage schools and training institutions</p>
          </div>
          <a 
            href="/admin/providers/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add Provider
          </a>
        </div>

        <Suspense fallback={<div>Loading providers...</div>}>
          <AdminTable
            data={providers || []}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search providers..."
            emptyMessage="No education providers found"
          />
        </Suspense>
      </div>
    </AdminLayout>
  )
}
