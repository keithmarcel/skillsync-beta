'use client';

import { AdminTable } from '@/components/admin/AdminTable';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAdminTableData } from '@/hooks/useAdminTableData';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase/client';
import type { Program } from '@/lib/database/queries';
import { Plus } from 'lucide-react';

export default function ProgramsPage() {
  const selectQuery = `*, school:schools(id, name)`;
  const { toast } = useToast();
  const { data: programs, isLoading, error, refreshData } = useAdminTableData<Program>('programs', selectQuery);

  const columns = [
    { key: 'name', header: 'Program Name', sortable: true },
    {
      key: 'provider',
      header: 'Provider',
      render: (value: any, program: Program) => (program && program.school) ? program.school.name : '-'
    },
    { key: 'discipline', header: 'Discipline', sortable: true },
    { key: 'catalog_provider', header: 'Catalog', sortable: true },
    { key: 'program_type', header: 'Type', sortable: true },
    {
      key: 'skills_count',
      header: 'Skills',
      render: (value: any, program: Program) => (
        <span className="text-sm">{program.skills_count || 0}</span>
      )
    },
    {
      key: 'is_featured',
      header: 'Featured',
      render: (value: any, program: Program) => (
        <Switch
          checked={program.is_featured}
          className="data-[state=checked]:bg-[#0694A2]"
          onCheckedChange={async (isChecked) => {
            const { error } = await supabase
              .from('programs')
              .update({ is_featured: isChecked })
              .eq('id', program.id);
            if (error) {
              console.error('Error updating featured status:', error);
              toast({
                title: "Error",
                description: "Failed to update featured status. Please try again.",
                variant: "destructive",
              });
            } else {
              refreshData();
              toast({
                title: "Success",
                description: `Program ${isChecked ? 'marked as featured' : 'unmarked as featured'}.`,
              });
            }
          }}
        />
      ),
    },
    {
      key: 'status',
      header: 'Published',
      render: (value: any, program: Program) => (
        <Switch
          checked={program.status === 'published'}
          className="data-[state=checked]:bg-[#0694A2]"
          onCheckedChange={async (isChecked) => {
            const newStatus = isChecked ? 'published' : 'draft';
            const { error } = await supabase
              .from('programs')
              .update({ status: newStatus })
              .eq('id', program.id);
            if (error) {
              console.error('Error updating program status:', error);
              toast({
                title: "Error",
                description: "Failed to update program status. Please try again.",
                variant: "destructive",
              });
            } else {
              refreshData();
              toast({
                title: "Success",
                description: `Program ${newStatus === 'published' ? 'published' : 'saved as draft'} successfully.`,
              });
            }
          }}
        />
      ),
    }
  ];

  const actions = [
    {
      label: 'Edit',
      href: (program: Program) => program ? `/admin/programs/${program.id}` : '#'
    },
    {
      label: 'View Provider',
      href: (program: Program) => (program && program.school_id) ? `/admin/providers/${program.school_id}` : '#'
    },
    {
      label: 'Delete',
      onClick: async (program: Program) => {
        const { error } = await supabase
          .from('programs')
          .delete()
          .eq('id', program.id);
        if (error) {
          console.error('Error deleting program:', error);
          toast({
            title: "Error",
            description: "Failed to delete program. Please try again.",
            variant: "destructive",
          });
        } else {
          refreshData();
          toast({
            title: "Success",
            description: "Program deleted successfully.",
          });
        }
      },
      isDestructive: true,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Education Programs</h1>
          <p className="text-gray-600">Manage training programs and certifications</p>
        </div>
        <Button asChild className="bg-teal-600 hover:bg-teal-700">
          <Link href="/admin/programs/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Program
          </Link>
        </Button>
      </div>

      <AdminTable
        data={programs || []}
        columns={columns as any}
        actions={actions}
        loading={isLoading}
        error={error}
        searchPlaceholder="Search programs..."
        emptyMessage="No programs found"
      />
    </div>
  );
}
