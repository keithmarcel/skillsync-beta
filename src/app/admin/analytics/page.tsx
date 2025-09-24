'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, FileText, TrendingUp, Eye, Download, Award, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AdminTable } from '@/components/admin/AdminTable';
import { supabase } from '@/lib/supabase/client';

interface AnalyticsStats {
  totalUsers: number;
  totalJobs: number;
  totalPrograms: number;
  totalAssessments: number;
  publishedJobs: number;
  publishedPrograms: number;
  completedAssessments: number;
  avgAssessmentScore: number;
}

interface PopularContent {
  id: string;
  title: string;
  type: 'job' | 'program';
  views: number;
  favorites: number;
  assessments: number;
}

interface UserActivity {
  date: string;
  newUsers: number;
  newAssessments: number;
  newFavorites: number;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalUsers: 0,
    totalJobs: 0,
    totalPrograms: 0,
    totalAssessments: 0,
    publishedJobs: 0,
    publishedPrograms: 0,
    completedAssessments: 0,
    avgAssessmentScore: 0,
  });
  const [popularContent, setPopularContent] = useState<PopularContent[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load basic stats
      const [
        usersResult,
        jobsResult,
        programsResult,
        assessmentsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('jobs').select('id, status', { count: 'exact' }),
        supabase.from('programs').select('id, status', { count: 'exact' }),
        supabase.from('assessments').select('id, readiness_pct')
      ]);

      // Calculate stats
      const totalUsers = usersResult.count || 0;
      const totalJobs = jobsResult.count || 0;
      const totalPrograms = programsResult.count || 0;
      const totalAssessments = assessmentsResult.count || 0;

      const publishedJobs = jobsResult.data?.filter(job => job.status === 'published').length || 0;
      const publishedPrograms = programsResult.data?.filter(program => program.status === 'published').length || 0;

      const completedAssessments = assessmentsResult.data?.filter(assessment => assessment.readiness_pct !== null).length || 0;
      const avgAssessmentScore = assessmentsResult.data
        ? assessmentsResult.data.reduce((sum, assessment) => sum + (assessment.readiness_pct || 0), 0) / (completedAssessments || 1)
        : 0;

      setStats({
        totalUsers,
        totalJobs,
        totalPrograms,
        totalAssessments,
        publishedJobs,
        publishedPrograms,
        completedAssessments,
        avgAssessmentScore,
      });

      // Load popular content (mock data for now)
      setPopularContent([
        { id: '1', title: 'Software Engineer', type: 'job', views: 1250, favorites: 89, assessments: 45 },
        { id: '2', title: 'Data Analyst', type: 'job', views: 980, favorites: 67, assessments: 32 },
        { id: '3', title: 'Computer Science Degree', type: 'program', views: 850, favorites: 54, assessments: 28 },
      ]);

      // Load user activity data (mock data for now)
      setUserActivity([
        { date: '2024-01-01', newUsers: 12, newAssessments: 8, newFavorites: 15 },
        { date: '2024-01-02', newUsers: 8, newAssessments: 12, newFavorites: 22 },
        { date: '2024-01-03', newUsers: 15, newAssessments: 10, newFavorites: 18 },
      ]);

    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const popularContentColumns = [
    {
      key: 'title',
      header: 'Content',
      render: (value: any, row: PopularContent) => (
        <div>
          <div className="font-medium">{row.title}</div>
          <Badge variant="outline" className="text-xs">
            {row.type}
          </Badge>
        </div>
      ),
    },
    {
      key: 'views',
      header: 'Views',
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span>{value.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'favorites',
      header: 'Favorites',
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          <Award className="w-4 h-4 text-muted-foreground" />
          <span>{value.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'assessments',
      header: 'Assessments',
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          <Target className="w-4 h-4 text-muted-foreground" />
          <span>{value.toLocaleString()}</span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading analytics...</div>
          <div className="text-sm text-muted-foreground mt-2">Fetching dashboard data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor platform performance and user engagement
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.publishedJobs + stats.publishedPrograms).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.publishedJobs} jobs, {stats.publishedPrograms} programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Assessments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAssessments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.avgAssessmentScore.toFixed(1)}% average score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Engagement</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {popularContent.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total content views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Published Jobs</span>
                <span>{stats.publishedJobs} / {stats.totalJobs}</span>
              </div>
              <Progress value={(stats.publishedJobs / Math.max(stats.totalJobs, 1)) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Published Programs</span>
                <span>{stats.publishedPrograms} / {stats.totalPrograms}</span>
              </div>
              <Progress value={(stats.publishedPrograms / Math.max(stats.totalPrograms, 1)) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Completed Assessments</span>
                <span>{stats.completedAssessments} / {stats.totalAssessments}</span>
              </div>
              <Progress value={(stats.completedAssessments / Math.max(stats.totalAssessments, 1)) * 100} className="h-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">
                {((stats.completedAssessments / Math.max(stats.totalAssessments, 1)) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Completion rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Content */}
      <Card>
        <CardHeader>
          <CardTitle>Most Popular Content</CardTitle>
          <p className="text-sm text-muted-foreground">
            Content with highest engagement in the selected time period
          </p>
        </CardHeader>
        <CardContent>
          <AdminTable
            data={popularContent}
            columns={popularContentColumns}
            loading={false}
            emptyMessage="No popular content data available"
          />
        </CardContent>
      </Card>

      {/* User Activity Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>User Activity Trends</CardTitle>
          <p className="text-sm text-muted-foreground">
            Daily user registrations, assessments, and favorites
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chart visualization will be implemented here</p>
              <p className="text-sm text-gray-400 mt-1">
                Showing data for {userActivity.length} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
