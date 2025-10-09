'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, UserCheck, UserX, Shield, Building, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminTable } from '@/components/admin/AdminTable';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

interface Profile {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  zip_code?: string;
  admin_role?: 'super_admin' | 'company_admin' | 'provider_admin' | null;
  company_id?: string | null;
  school_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface UserWithCompany extends Profile {
  company?: { id: string; name: string };
  school?: { id: string; name: string };
}

interface UserStats {
  total: number;
  admins: number;
  companies: number;
  providers: number;
  basic: number;
}

export default function AdminUsersPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({ total: 0, admins: 0, companies: 0, providers: 0, basic: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [adminRoleFilter, setAdminRoleFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleBulkPublish = async (userIds: string[]) => {
    try {
      setLoading(true);
      // TODO: Implement bulk publish functionality
      // For now, just show a message that this feature is not yet implemented
      toast({
        title: "Feature Not Implemented",
        description: "Bulk publish functionality is coming soon.",
      });
    } catch (err) {
      console.error('Error bulk publishing users:', err);
      toast({
        title: "Error",
        description: "Failed to publish users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkArchive = async (userIds: string[]) => {
    try {
      setLoading(true);
      // TODO: Implement bulk archive functionality
      // For now, just show a message that this feature is not yet implemented
      toast({
        title: "Feature Not Implemented",
        description: "Bulk archive functionality is coming soon.",
      });
    } catch (err) {
      console.error('Error bulk archiving users:', err);
      toast({
        title: "Error",
        description: "Failed to archive users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Bulk actions configuration
  const bulkActions = [
    {
      label: "Publish Users",
      onClick: handleBulkPublish,
      variant: 'default' as const,
    },
    {
      label: "Archive Users",
      onClick: handleBulkArchive,
      variant: 'outline' as const,
      isDestructive: true,
    },
  ];
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [searchTerm, roleFilter, adminRoleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (adminRoleFilter !== 'all') params.append('adminRole', adminRoleFilter);

      // Use API route with service role key to bypass RLS
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load users');
      }

      setUsers(result.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Use API route to get all profiles for stats calculation
      const response = await fetch('/api/admin/users');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load stats');
      }

      const data = result.users;

      const stats = (data || []).reduce(
        (acc: any, profile: any) => {
          acc.total++;
          if (profile.admin_role === 'super_admin') {
            acc.admins++;
          } else if (profile.admin_role === 'company_admin') {
            acc.companies++;
          } else if (profile.admin_role === 'provider_admin') {
            acc.providers++;
          } else {
            acc.basic++;
          }
          return acc;
        },
        { total: 0, admins: 0, companies: 0, providers: 0, basic: 0 }
      );

      setStats(stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const getRoleBadge = (profile: UserWithCompany) => {
    if (profile.admin_role === 'super_admin') {
      return <Badge variant="destructive"><Shield className="w-3 h-3 mr-1" />Super Admin</Badge>;
    }
    if (profile.admin_role === 'company_admin') {
      return <Badge variant="secondary"><Building className="w-3 h-3 mr-1" />Company Admin</Badge>;
    }
    if (profile.admin_role === 'provider_admin') {
      return <Badge variant="secondary"><GraduationCap className="w-3 h-3 mr-1" />Provider Admin</Badge>;
    }
    if (profile.role === 'partner_admin') {
      return <Badge variant="outline">Partner Admin</Badge>;
    }
    if (profile.role === 'org_user') {
      return <Badge variant="outline">Org User</Badge>;
    }
    return <Badge variant="outline">Basic User</Badge>;
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (value: any, row: UserWithCompany) => (
        <div>
          <div className="font-medium">
            {row.first_name} {row.last_name}
          </div>
          <div className="text-sm text-muted-foreground">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (value: any, row: UserWithCompany) => getRoleBadge(row),
    },
    {
      key: 'organization',
      header: 'Organization',
      render: (value: any, row: UserWithCompany) => {
        if (row.company) {
          return <span className="text-sm">{row.company.name}</span>;
        }
        if (row.school) {
          return <span className="text-sm">{row.school.name}</span>;
        }
        return <span className="text-sm text-muted-foreground">—</span>;
      },
    },
    {
      key: 'created_at',
      header: 'Joined',
      render: (value: any, row: UserWithCompany) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: 'Edit',
      href: (row: UserWithCompany) => `/admin/users/${row.id}`,
    },
    {
      label: 'Delete',
      onClick: async (row: UserWithCompany) => {
        if (window.confirm(`Are you sure you want to delete ${row.first_name} ${row.last_name}? This action cannot be undone.`)) {
          try {
            setLoading(true);
            const { error } = await supabase
              .from('profiles')
              .delete()
              .eq('id', row.id);

            if (error) throw error;

            toast({
              title: "Success",
              description: "User deleted successfully",
            });

            // Refresh data
            await loadUsers();
            await loadStats();
          } catch (err) {
            console.error('Error deleting user:', err);
            toast({
              title: "Error",
              description: "Failed to delete user",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        }
      },
      isDestructive: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Button asChild className="bg-teal-600 hover:bg-teal-700 self-start md:self-auto">
          <Link href="/admin/users/new">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.providers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Basic Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.basic}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="basic_user">Basic User</SelectItem>
                  <SelectItem value="org_user">Org User</SelectItem>
                  <SelectItem value="partner_admin">Partner Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={adminRoleFilter} onValueChange={setAdminRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by admin role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admin Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="company_admin">Company Admin</SelectItem>
                  <SelectItem value="provider_admin">Provider Admin</SelectItem>
                  <SelectItem value="none">No Admin Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <AdminTable
        data={users}
        columns={columns}
        actions={actions}
        loading={loading}
        error={error}
        searchPlaceholder="" // Remove duplicate search - we have custom filters above
        emptyMessage="No users found"
        bulkActions={bulkActions}
        onSelectionChange={setSelectedUsers}
      />
    </div>
  );
}
