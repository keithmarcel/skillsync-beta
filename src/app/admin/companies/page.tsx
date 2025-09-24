'use client';

import { AdminTable } from '@/components/admin/AdminTable';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAdminTableData } from '@/hooks/useAdminTableData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import type { Company } from '@/lib/database/queries';
import { Plus } from 'lucide-react';

export default function CompaniesPage() {
  const selectQuery = `*`;
  const { toast } = useToast();
  const { data: companies, isLoading, error, refreshData } = useAdminTableData<Company>('companies', selectQuery);

  const columns = [
    { key: 'name', header: 'Company Name', sortable: true },
    { key: 'industry', header: 'Industry', sortable: true },
    {
      key: 'location',
      header: 'Location',
      render: (value: any, company: Company) => (company && company.hq_city && company.hq_state) ? `${company.hq_city}, ${company.hq_state}` : '-'
    },
    { key: 'employee_range', header: 'Size', sortable: true },
    {
      key: 'is_published',
      header: 'Status',
      render: (value: any, company: Company) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={company.is_published ?? true} // Default to true if column doesn't exist yet
            className="data-[state=checked]:bg-[#0694A2]"
            onCheckedChange={async (isChecked) => {
            const { error } = await supabase
              .from('companies')
              .update({ is_published: isChecked })
              .eq('id', company.id);
            if (error) {
              console.error('Error updating company status:', error);
              toast({
                title: "Error",
                description: error.message.includes('is_published')
                  ? "Database migration needed. Run: ALTER TABLE companies ADD COLUMN is_published BOOLEAN DEFAULT true;"
                  : "Failed to update company status. Please try again.",
                variant: "destructive",
              });
            } else {
              refreshData();
              toast({
                title: "Success",
                description: `Company ${isChecked ? 'published' : 'unpublished'}.`,
              });
            }
          }}
          />
          <span className="capitalize text-sm">
            {company.is_published ?? true ? 'Published' : 'Unpublished'}
          </span>
        </div>
      )
    }
  ];

  const actions = [
    {
      label: 'Edit',
      href: (company: Company) => company ? `/admin/companies/${company.id}` : '#'
    },
    {
      label: 'View Jobs',
      href: (company: Company) => company ? `/admin/roles?company=${company.id}` : '#'
    },
    {
      label: 'Delete',
      onClick: async (company: Company) => {
        const { error } = await supabase
          .from('companies')
          .delete()
          .eq('id', company.id);
        if (error) {
          console.error('Error deleting company:', error);
          toast({
            title: "Error",
            description: "Failed to delete company. Please try again.",
            variant: "destructive",
          });
        } else {
          refreshData();
          toast({
            title: "Success",
            description: "Company deleted successfully.",
          });
        }
      },
      isDestructive: true,
    },
  ];

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Companies</h1>
            <p className="text-gray-600">Manage company profiles and partnerships</p>
          </div>
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/admin/companies/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Link>
          </Button>
        </div>

        <AdminTable
          data={companies || []}
          columns={columns}
          actions={actions}
          loading={isLoading}
          error={error}
          searchPlaceholder="Search companies..."
          emptyMessage="No companies found"
        />
      </div>
  );
}
