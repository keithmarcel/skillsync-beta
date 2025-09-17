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
import { useAdmin } from '@/hooks/useAdmin';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { getAdminStats, getRecentActivity, logAction } from '@/lib/admin-utils';

// Types
type DashboardStats = {
  totalUsers: number;
  totalCompanies: number;
  totalProviders: number;
  totalPrograms: number;
  totalRoles: number;
  totalAssessments: number;
  pendingApprovals: number;
  totalOccupations: number;
};

type Activity = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
};

type RecentActivity = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  user: {
    email: string;
    name?: string;
  };
  timestamp: string;
  status: 'success' | 'error' | 'warning' | 'info';
};

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

const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
  const statusIcons = {
    success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
    warning: <AlertCircle className="h-4 w-4 text-yellow-500" />,
    info: <Activity className="h-4 w-4 text-blue-500" />,
  };

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-shrink-0 mt-0.5">
        {statusIcons[activity.status]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {activity.user.name || activity.user.email} {activity.action} {activity.entityType}
        </p>
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </div>
      </div>
      <div className="flex-shrink-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/${activity.entityType}/${activity.entityId}`}>
            View
          </Link>
        </Button>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { getScopedData, isSuperAdmin } = useAdmin();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalProviders: 0,
    totalPrograms: 0,
    totalRoles: 0,
    totalAssessments: 0,
    pendingApprovals: 0,
    totalOccupations: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch stats and recent activity in parallel
      const [statsData, activities] = await Promise.all([
        getAdminStats(),
        getRecentActivity(5)
      ]);

      setStats(statsData);
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getScopedData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Log page view
  useEffect(() => {
    logAction({
      action: 'viewed',
      entityType: 'dashboard',
      entityId: 'admin-dashboard',
      status: 'success'
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex space-x-2">
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
      <AdminLayout>
        <div className="space-y-6 p-6">
          <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back! Here's what's happening with your platform.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Reports
              </Button>
              <Button size="sm" asChild>
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Partner companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Education Programs</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrograms.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Roles</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active roles</p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions in the admin panel</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Activity tracking will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminDashboard;
