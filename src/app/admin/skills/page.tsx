'use client';

import React from 'react';
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(50);
  
  const totalSkills = skills?.length || 0;
  const totalPages = Math.ceil(totalSkills / pageSize);
  
  // Note: Supabase has a 1000 row limit even with .limit(50000)
  // Showing actual count available, not total in database
  const displayCount = totalSkills >= 1000 ? '1,000+' : totalSkills.toLocaleString();

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
          <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
          <p className="text-muted-foreground">
            Manage skills taxonomy and metadata ({displayCount} skills)
          </p>
        </div>
        <Link href="/admin/skills/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Skill
          </Button>
        </Link>
      </div>

      <AdminTable
        data={skills || []}
        columns={columns}
        actions={actions}
        loading={isLoading}
        error={error}
        keyField="id"
        searchPlaceholder="Search skills by name, category, or source..."
        pagination={{
          page: currentPage,
          pageSize: pageSize,
          total: totalSkills,
          onPageChange: setCurrentPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setCurrentPage(1);
          }
        }}
      />
    </div>
  );
}
