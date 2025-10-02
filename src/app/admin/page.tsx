'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Building2, 
  Briefcase, 
  GraduationCap, 
  Settings,
  FileText,
  Plus,
  Users,
  BarChart3,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  BookOpen,
  School
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { logAction } from '@/lib/admin-utils';
import { useAdminDashboard } from '@/hooks/useAdminDashboard'; // Import the new hook
import type { AdminAuditLog, AdminDashboardStats } from '@/types/admin';

// Components
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className = '' 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: { value: number; label: string }; 
  className?: string;
}) => (
  <Card className={className}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <p className="text-xs text-muted-foreground">
          {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'} {trend.label}
        </p>
      )}
    </CardContent>
  </Card>
);


const AdminDashboard = () => {
  const auditLogColumns = [
    {
      key: 'user',
      header: 'User',
      render: (log: AdminAuditLog) => {
        if (!log || !log.profiles) return 'System';
        if (log.profiles.first_name) {
          return `${log.profiles.first_name} ${log.profiles.last_name || ''}`.trim();
        }
        return log.profiles.email || 'Unknown User';
      },
    },
    {
      key: 'action',
      header: 'Action',
      render: (log: AdminAuditLog) => {
        if (!log || !log.action || !log.entity_type) return '—';
        return `${log.action} ${log.entity_type}`;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (log: AdminAuditLog) => {
        if (!log || !log.status) return <Badge variant="default">—</Badge>;
        return <Badge variant={log.status === 'error' ? 'destructive' : 'default'}>{log.status}</Badge>;
      },
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (log: AdminAuditLog) => {
        if (!log || !log.created_at) return '—';
        try {
          return formatDistanceToNow(new Date(log.created_at), { addSuffix: true });
        } catch (error) {
          return '—';
        }
      },
    },
  ];
  // All data fetching and state is now handled by the custom hook.
  const { stats, recentActivity, isLoading, error } = useAdminDashboard();

  // Log page view
  useEffect(() => {
    logAction({
      action: 'viewed',
      entityType: 'dashboard',
      entityId: 'admin-dashboard',
      status: 'success'
    });
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your platform.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-white hover:bg-gray-50 border-gray-300">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={stats?.total_users?.toLocaleString() || 0} icon={Users} />
          <StatCard title="Total Companies" value={stats?.total_companies?.toLocaleString() || 0} icon={Building2} />
          <StatCard title="Education Programs" value={stats?.total_programs?.toLocaleString() || 0} icon={GraduationCap} />
          <StatCard title="Featured Roles" value={stats?.total_roles?.toLocaleString() || 0} icon={Briefcase} />
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the admin panel</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <AdminTable
              data={recentActivity || []}
              columns={auditLogColumns as any}
              loading={isLoading}
              error={error}
              searchPlaceholder="Search activity..."
              emptyMessage="No recent activity found."
            />
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
};

export default AdminDashboard;
