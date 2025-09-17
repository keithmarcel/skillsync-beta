import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AdminTable } from '@/components/admin/AdminTable'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default async function CompaniesPage() {
  const supabase = createClient()
  
  // Fetch companies data
  const { data: companies, error } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      logo_url,
      is_trusted_partner,
      hq_city,
      hq_state,
      industry,
      employee_range,
      revenue_range,
      bio,
      created_at,
      updated_at
    `)
    .order('name')

  if (error) {
    console.error('Error fetching companies:', error)
    return <div>Error loading companies</div>
  }

  const columns = [
    {
      key: 'name',
      header: 'Company Name',
      sortable: true
    },
    {
      key: 'industry',
      header: 'Industry',
      sortable: true
    },
    {
      key: 'hq_city',
      header: 'Location',
      render: (company: any) => company.hq_city && company.hq_state 
        ? `${company.hq_city}, ${company.hq_state}` 
        : company.hq_city || company.hq_state || '-'
    },
    {
      key: 'employee_range',
      header: 'Size',
      sortable: true
    },
    {
      key: 'is_trusted_partner',
      header: 'Status',
      render: (company: any) => company.is_trusted_partner ? 'Trusted Partner' : 'Standard'
    }
  ]

  const actions = [
    {
      label: 'Edit',
      href: (company: any) => `/admin/companies/${company.id}`
    },
    {
      label: 'View Jobs',
      href: (company: any) => `/admin/roles?company=${company.id}`
    },
    {
      label: 'Toggle Featured',
      onClick: async (company: any) => {
        'use server'
        const supabase = createClient()
        await supabase
          .from('companies')
          .update({ is_trusted_partner: !company.is_trusted_partner })
          .eq('id', company.id)
      }
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Companies</h1>
            <p className="text-gray-600">Manage company profiles and partnerships</p>
          </div>
          <a 
            href="/admin/companies/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add Company
          </a>
        </div>

        <Suspense fallback={<div>Loading companies...</div>}>
          <AdminTable
            data={companies || []}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search companies..."
            emptyMessage="No companies found"
          />
        </Suspense>
      </div>
    </AdminLayout>
  )
}
