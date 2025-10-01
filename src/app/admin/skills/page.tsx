'use client';

import { AdminTable } from '@/components/admin/AdminTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAdminTableData } from '@/hooks/useAdminTableData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Plus, Database, Globe } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  lightcast_id?: string;
  onet_id?: string;
  source: string;
  source_version?: string;
  is_active: boolean;
}

export default function SkillsPage() {
  const selectQuery = `*`;
  const { toast } = useToast();
  const { data: skills, isLoading, error, refreshData } = useAdminTableData<Skill>('skills', selectQuery);

  const columns = [
    { key: 'name', header: 'Skill Name', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    {
      key: 'source',
      header: 'Source',
      render: (value: any, skill: Skill) => (
        <Badge variant="outline" className="flex items-center gap-1 w-fit">
          {skill.source === 'LIGHTCAST' ? <Globe className="w-3 h-3" /> : <Database className="w-3 h-3" />}
          {skill.source}
        </Badge>
      )
    },
    {
      key: 'lightcast_id',
      header: 'Lightcast ID',
      render: (value: any, skill: Skill) => (
        <span className="text-xs text-gray-500 font-mono">
          {skill.lightcast_id ? skill.lightcast_id.substring(0, 12) + '...' : '-'}
        </span>
      )
    },
    {
      key: 'onet_id',
      header: 'O*NET ID',
      render: (value: any, skill: Skill) => (
        <span className="text-xs text-gray-500 font-mono">
          {skill.onet_id || '-'}
        </span>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (value: any, skill: Skill) => (
        <Badge variant={skill.is_active ? 'default' : 'secondary'}>
          {skill.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: (skill: Skill) => {
        toast({
          title: skill.name,
          description: `Source: ${skill.source} | Category: ${skill.category}`,
        });
      }
    },
    {
      label: 'Deactivate',
      onClick: async (skill: Skill) => {
        const { error } = await supabase
          .from('skills')
          .update({ is_active: false })
          .eq('id', skill.id);
        
        if (error) {
          toast({
            title: "Error",
            description: "Failed to deactivate skill",
            variant: "destructive",
          });
        } else {
          refreshData();
          toast({
            title: "Success",
            description: "Skill deactivated",
          });
        }
      },
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Skills Taxonomy</h1>
          <p className="text-gray-600">
            Manage skills from Lightcast and O*NET sources
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Database className="w-4 h-4 mr-2" />
            Import O*NET
          </Button>
          <Button variant="outline">
            <Globe className="w-4 h-4 mr-2" />
            Sync Lightcast
          </Button>
        </div>
      </div>

      <AdminTable
        data={skills || []}
        columns={columns as any}
        actions={actions}
        loading={isLoading}
        error={error}
        searchPlaceholder="Search skills..."
        emptyMessage="No skills found"
      />
    </div>
  );
}
