'use client';

import { AdminTable } from '@/components/admin/AdminTable';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAdminTableData } from '@/hooks/useAdminTableData';
import { supabase } from '@/lib/supabase/client';
import { useMemo } from 'react';
import type { Job } from '@/lib/database/queries';
import { Plus } from 'lucide-react';

export default function OccupationsPage() {
  const selectQuery = `*, company:companies(*)`;
  const initialFilter = useMemo(() => ({ job_kind: 'occupation' }), []);
  const { data: occupations, isLoading, error, refreshData } = useAdminTableData<Job>('jobs', selectQuery, {
    initialFilter
  });

  const columns = [
    { key: 'title', header: 'Occupation Title', sortable: true },
    { key: 'soc_code', header: 'SOC Code', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    {
      key: 'location',
      header: 'Location',
      render: (job: Job) => {
        if (!job) return 'National';
        return job.location_city && job.location_state
          ? `${job.location_city}, ${job.location_state}`
          : job.location_city || job.location_state || 'National';
      }
    },
    {
      key: 'median_wage_usd',
      header: 'Median Salary',
      render: (job: Job) => {
        if (!job || !job.median_wage_usd) return '-';
        return `$${job.median_wage_usd.toLocaleString()}`;
      }
    },
    { key: 'skills_count', header: 'Skills', render: (job: Job) => job?.skills_count || 0 }
  ];

  const actions = [
    {
      label: 'Edit',
      href: (job: Job) => `/admin/occupations/${job.id}`
    },
    {
      label: 'View Skills',
      href: (job: Job) => `/admin/skills?occupation=${job.id}`
    },
    {
      label: 'Delete',
      onClick: async (job: Job) => {
        const { error } = await supabase
          .from('jobs')
          .delete()
          .eq('id', job.id);
        if (error) {
          console.error('Error deleting occupation:', error);
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
            <h1 className="text-2xl font-bold">High-Demand Occupations</h1>
            <p className="text-gray-600">Manage occupation data and skill requirements</p>
          </div>
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/admin/occupations/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Occupation
            </Link>
          </Button>
        </div>

        <AdminTable
          data={occupations || []}
          columns={columns as any}
          actions={actions}
          loading={isLoading}
          error={error}
          searchPlaceholder="Search occupations..."
          emptyMessage="No occupations found"
        />
      </div>
  );
}
