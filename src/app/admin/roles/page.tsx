'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminTable } from '@/components/admin/AdminTable';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { Plus, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdminTableData } from '@/hooks/useAdminTableData';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import type { Job } from '@/lib/database/queries';
import { renderCategoryBadge } from '@/lib/table-configs';

export default function AdminRolesPage() {
  const { isCompanyAdmin } = useAuth();
  const { toast } = useToast();
  const selectQuery = '*, company:companies(*)';
  const initialFilter = useMemo(() => ({ job_kind: 'featured_role' }), []);
  const { data: roles, isLoading, error, refreshData } = useAdminTableData<Job>('jobs', selectQuery, { 
    initialFilter 
  });

  const columns = [
    { key: 'title', header: 'Role Title', sortable: true },
    { key: 'soc_code', header: 'SOC Code', sortable: true },
    {
      key: 'company',
      header: 'Company',
      render: (value: any, row: Job) => {
        if (!row) return null;
        return (
          <div className="flex items-center gap-2">
            <span>{row.company?.name}</span>
          </div>
        );
      }
    },
    { 
      key: 'category', 
      header: 'Category', 
      sortable: true,
      render: (value: any, row: Job) => {
        // Apply proper category mapping for featured roles
        const getProperCategory = (job: Job) => {
          // If database category is set and not "Featured Role", use it
          if (job.category && job.category.trim() !== '' && job.category !== 'Featured Role') {
            return job.category
          }
          
          // Apply title-based mapping for legacy featured roles
          const categoryMap: Record<string, string> = {
            'Mechanical Assistant Project Manager': 'Skilled Trades',
            'Senior Financial Analyst (FP&A)': 'Business',
            'Mechanical Project Manager': 'Skilled Trades', 
            'Surgical Technologist (Certified)': 'Health & Education',
            'Business Development Manager': 'Business',
            'Administrative Assistant': 'Business',
            'Supervisor, Residential Inbound Sales': 'Business',
            'Senior Mechanical Project Manager': 'Skilled Trades'
          }
          return categoryMap[job.title] || 'Business'
        }
        
        const properCategory = getProperCategory(row)
        return renderCategoryBadge(properCategory)
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: any, row: Job) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.status === 'published'}
            className="data-[state=checked]:bg-[#0694A2]"
            onCheckedChange={async (isChecked) => {
              const newStatus = isChecked ? 'published' : 'draft';
              const { error } = await supabase
                .from('jobs')
                .update({ status: newStatus })
                .eq('id', row.id);
              if (error) {
                console.error('Error updating job status:', error);
                toast({
                  title: "Error",
                  description: "Failed to update role status. Please try again.",
                  variant: "destructive",
                });
              } else {
                refreshData();
                toast({
                  title: "Success",
                  description: `Role ${newStatus === 'published' ? 'published' : 'saved as draft'} successfully.`,
                });
              }
            }}
          />
          <span className="capitalize text-sm">{row.status}</span>
        </div>
      ),
    },
    {
      key: 'updated_at',
      header: 'Last Updated',
      render: (value: any, row: Job) => (row.updated_at ? formatDistanceToNow(new Date(row.updated_at), { addSuffix: true }) : '-'),
    },
  ];

  const companyRoleCount = isCompanyAdmin ? roles.filter(r => (r as any).status !== 'archived').length : 0;
  const roleLimit = 10;


  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Featured Roles</h1>
            <p className="text-gray-600">
              {isCompanyAdmin 
                ? "Manage your company's featured roles and job postings"
                : "Manage all featured roles across partner companies"
              }
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isCompanyAdmin && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{companyRoleCount}</span> / {roleLimit} roles used
              </div>
            )}
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/admin/roles/new">
                <Plus className="w-4 h-4 mr-2" />
                Add New Role
              </Link>
            </Button>
          </div>
        </div>

        <AdminTable
          data={roles || []}
          columns={columns as any}
          actions={[
            {
              label: 'Edit',
              href: (row: Job) => `/admin/roles/${row.id}`,
            },
            {
              label: 'Delete',
              onClick: async (row: Job) => {
                const { error } = await supabase
                  .from('jobs')
                  .delete()
                  .eq('id', row.id);
                if (error) {
                  console.error('Error deleting role:', error);
                  toast({
                    title: "Error",
                    description: "Failed to delete role. Please try again.",
                    variant: "destructive",
                  });
                } else {
                  refreshData();
                  toast({
                    title: "Success",
                    description: "Role deleted successfully.",
                  });
                }
              },
              isDestructive: true,
            },
          ]}
          loading={isLoading}
          error={error}
          searchPlaceholder="Search roles..."
          emptyMessage="No roles found"
        />
      </div>
    </AdminGuard>
  );
}
