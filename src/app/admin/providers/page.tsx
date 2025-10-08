'use client';

import { AdminTable } from '@/components/admin/AdminTable';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { useAdminTableData } from '@/hooks/useAdminTableData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import type { School } from '@/lib/database/queries';
import { Plus } from 'lucide-react';

export default function ProvidersPage() {
  const selectQuery = `*`;
  const { data: providers, isLoading, error, refreshData } = useAdminTableData<School>('schools', selectQuery);
  const { toast } = useToast();

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
      render: (school: School) => school?.about_url ? <a href={school.about_url} target="_blank" rel="noopener noreferrer" className="text-[#0694A2] hover:underline">View</a> : '-'
    },
    {
      key: 'is_published',
      header: 'Status',
      render: (value: any, school: School) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={school.is_published ?? true}
            className="data-[state=checked]:bg-[#0694A2]"
            onCheckedChange={async (isChecked) => {
              const { error } = await supabase
                .from('schools')
                .update({ is_published: isChecked })
                .eq('id', school.id);
              if (error) {
                console.error('Error updating provider status:', error);
                toast({
                  title: "Error",
                  description: error.message.includes('is_published')
                    ? "Database migration needed. Run migration: 20250930000007_add_schools_published_status.sql"
                    : "Failed to update provider status. Please try again.",
                  variant: "destructive",
                });
              } else {
                refreshData();
                toast({
                  title: "Success",
                  description: `Provider ${isChecked ? 'published' : 'unpublished'}. All programs from this provider are now ${isChecked ? 'visible' : 'hidden'}.`,
                });
              }
            }}
          />
          <span className="capitalize text-sm">
            {school.is_published ?? true ? 'Published' : 'Unpublished'}
          </span>
        </div>
      )
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
          <Button asChild className="bg-[#0694A2] hover:bg-[#0694A2]/90">
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
