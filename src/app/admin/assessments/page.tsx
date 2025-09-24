'use client';

import { AdminTable } from '@/components/admin/AdminTable';
import { useAdminTableData } from '@/hooks/useAdminTableData';
import { supabase } from '@/lib/supabase/client';
import type { Assessment } from '@/lib/database/queries';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Sparkles } from 'lucide-react';

export default function AssessmentsPage() {
  const selectQuery = `*, job:jobs(id, title)`;
  const { data: assessments, isLoading, error, refreshData } = useAdminTableData<Assessment>('assessments', selectQuery);

  const columns = [
    { key: 'method', header: 'Method', sortable: true },
    { key: 'job.title', header: 'Related Job', render: (assessment: Assessment) => assessment?.job?.title || '-' },
    { key: 'status_tag', header: 'Status', sortable: true },
    { key: 'readiness_pct', header: 'Readiness %', sortable: true, render: (assessment: Assessment) => assessment.readiness_pct ? `${assessment.readiness_pct.toFixed(1)}%` : '-' },
    { key: 'analyzed_at', header: 'Date', sortable: true, render: (assessment: Assessment) => new Date(assessment.analyzed_at || '').toLocaleDateString() },
  ];

  const actions = [
    {
      label: 'Edit',
      href: (assessment: Assessment) => `/admin/assessments/${assessment.id}`
    },
    {
      label: 'Toggle Status',
      onClick: async (assessment: Assessment) => {
        // This is a placeholder for a more complex status toggle logic
        console.log('Toggling status for:', assessment.id);
        refreshData();
      }
    }
  ];

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Skill Assessments</h1>
            <p className="text-gray-600">Manage assessments and quiz questions</p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/admin/assessments/generate">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AI
              </Link>
            </Button>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/admin/assessments/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Assessment
              </Link>
            </Button>
          </div>
        </div>

        <AdminTable
          data={assessments || []}
          columns={columns as any}
          actions={actions}
          loading={isLoading}
          error={error}
          searchPlaceholder="Search assessments..."
          emptyMessage="No assessments found"
        />
      </div>
  );
}
