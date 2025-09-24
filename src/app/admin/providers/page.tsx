'use client';

import { AdminTable } from '@/components/admin/AdminTable';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAdminTableData } from '@/hooks/useAdminTableData';
import { supabase } from '@/lib/supabase/client';
import type { School } from '@/lib/database/queries';
import { Plus } from 'lucide-react';

export default function ProvidersPage() {
  const selectQuery = `*`;
  const { data: providers, isLoading, error, refreshData } = useAdminTableData<School>('schools', selectQuery);

  const columns = [
    { key: 'name', header: 'Provider Name', sortable: true },
    {
      key: 'location',
      header: 'Location',
      render: (school: School) => (school && school.city && school.state) ? `${school.city}, ${school.state}` : '-'
    },
    {
      key: 'about_url',
      header: 'Website',
      render: (school: School) => school?.about_url ? <a href={school.about_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a> : '-'
    }
  ];

  const actions = [
    {
      label: 'Edit',
      href: (school: School) => school ? `/admin/providers/${school.id}` : '#'
    },
    {
      label: 'View Programs',
      href: (school: School) => school ? `/admin/programs?provider=${school.id}` : '#'
    },
    {
      label: 'Delete',
      onClick: async (school: School) => {
        const { error } = await supabase
          .from('schools')
          .delete()
          .eq('id', school.id);
        if (error) {
          console.error('Error deleting school:', error);
        } else {
          refreshData();
        }
      },
      isDestructive: true,
    }
  ];

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Education Providers</h1>
            <p className="text-gray-600">Manage schools and training institutions</p>
          </div>
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/admin/providers/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Link>
          </Button>
        </div>

        <AdminTable
          data={providers || []}
          columns={columns as any}
          actions={actions}
          loading={isLoading}
          error={error}
          searchPlaceholder="Search providers..."
          emptyMessage="No education providers found"
        />
      </div>
  );
}
