'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, TrendingUp, TrendingDown, Minus, Calendar, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AdminTable } from '@/components/admin/AdminTable';
import { supabase } from '@/lib/supabase/client';
import { PageLoader } from '@/components/ui/loading-spinner';

interface FeedbackItem {
  id: string;
  user_id: string | null;
  user_email: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  feedback_level: number;
  message: string | null;
  route_path: string | null;
  created_at: string;
}

interface FeedbackStats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  avgLevel: number;
  withComments: number;
}

interface RouteStats {
  route: string;
  count: number;
  avgLevel: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    avgLevel: 0,
    withComments: 0,
  });
  const [routeStats, setRouteStats] = useState<RouteStats[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, [timeRange, sentimentFilter]);

  const loadFeedback = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Build query
      let query = supabase
        .from('feedback')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Apply sentiment filter
      if (sentimentFilter !== 'all') {
        query = query.eq('sentiment', sentimentFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFeedback(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const positive = data?.filter(f => f.sentiment === 'positive').length || 0;
      const neutral = data?.filter(f => f.sentiment === 'neutral').length || 0;
      const negative = data?.filter(f => f.sentiment === 'negative').length || 0;
      const avgLevel = total > 0 
        ? data!.reduce((sum, f) => sum + (f.feedback_level || 0), 0) / total 
        : 0;
      const withComments = data?.filter(f => f.message && f.message.trim().length > 0).length || 0;

      setStats({
        total,
        positive,
        neutral,
        negative,
        avgLevel,
        withComments,
      });

      // Calculate route stats
      const routeMap = new Map<string, { count: number; levels: number[]; sentiments: { positive: number; neutral: number; negative: number } }>();
      
      data?.forEach(item => {
        const route = item.route_path || 'Unknown';
        if (!routeMap.has(route)) {
          routeMap.set(route, { count: 0, levels: [], sentiments: { positive: 0, neutral: 0, negative: 0 } });
        }
        const routeData = routeMap.get(route)!;
        routeData.count++;
        if (item.feedback_level) routeData.levels.push(item.feedback_level);
        routeData.sentiments[item.sentiment]++;
      });

      const routeStatsData: RouteStats[] = Array.from(routeMap.entries()).map(([route, data]) => ({
        route,
        count: data.count,
        avgLevel: data.levels.length > 0 ? data.levels.reduce((a, b) => a + b, 0) / data.levels.length : 0,
        sentiment: data.sentiments,
      })).sort((a, b) => b.count - a.count);

      setRouteStats(routeStatsData);

    } catch (err) {
      console.error('Error loading feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😍';
      case 'neutral': return '😐';
      case 'negative': return '😟';
      default: return '❓';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportFeedback = () => {
    const csv = [
      ['Date', 'Sentiment', 'Level', 'Route', 'User Email', 'Message'].join(','),
      ...feedback.map(f => [
        new Date(f.created_at).toLocaleDateString(),
        f.sentiment,
        f.feedback_level,
        f.route_path || '',
        f.user_email || 'Anonymous',
        `"${(f.message || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const feedbackColumns = [
    {
      key: 'created_at',
      header: 'Date',
      render: (value: string) => (
        <div className="text-sm">
          {new Date(value).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      ),
    },
    {
      key: 'sentiment',
      header: 'Feedback',
      render: (value: string, row: FeedbackItem) => (
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getSentimentEmoji(value)}</span>
          <div>
            <Badge variant="outline" className={getSentimentColor(value)}>
              {value}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">
              Level: {row.feedback_level}/5
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'route_path',
      header: 'Page',
      render: (value: string | null) => (
        <div className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">
          {value || 'Unknown'}
        </div>
      ),
    },
    {
      key: 'user_email',
      header: 'User',
      render: (value: string | null) => (
        <div className="text-sm">
          {value || <span className="text-muted-foreground italic">Anonymous</span>}
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Comment',
      render: (value: string | null) => (
        <div className="max-w-md">
          {value ? (
            <p className="text-sm text-gray-700 line-clamp-2">{value}</p>
          ) : (
            <span className="text-sm text-muted-foreground italic">No comment</span>
          )}
        </div>
      ),
    },
  ];

  const routeStatsColumns = [
    {
      key: 'route',
      header: 'Route',
      render: (value: string) => (
        <div className="font-mono text-sm bg-gray-50 px-2 py-1 rounded">
          {value}
        </div>
      ),
    },
    {
      key: 'count',
      header: 'Total Feedback',
      render: (value: number) => (
        <div className="font-semibold">{value}</div>
      ),
    },
    {
      key: 'avgLevel',
      header: 'Avg Rating',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{value.toFixed(1)}/5</span>
          {value >= 4 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : value <= 2 ? (
            <TrendingDown className="w-4 h-4 text-red-500" />
          ) : (
            <Minus className="w-4 h-4 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: 'sentiment',
      header: 'Sentiment Breakdown',
      render: (value: RouteStats['sentiment']) => (
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            😍 {value.positive}
          </Badge>
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            😐 {value.neutral}
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            😟 {value.negative}
          </Badge>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader text="Loading feedback..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Feedback</h1>
          <p className="text-muted-foreground">
            Monitor user sentiment and feedback across the platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Feedback</SelectItem>
              <SelectItem value="positive">😍 Positive</SelectItem>
              <SelectItem value="neutral">😐 Neutral</SelectItem>
              <SelectItem value="negative">😟 Negative</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportFeedback}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.withComments} with comments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive</CardTitle>
            <span className="text-2xl">😍</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.positive / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neutral</CardTitle>
            <span className="text-2xl">😐</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.neutral}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.neutral / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative</CardTitle>
            <span className="text-2xl">😟</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.negative / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgLevel.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Route Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback by Page</CardTitle>
          <p className="text-sm text-muted-foreground">
            See which pages are receiving the most feedback and their sentiment breakdown
          </p>
        </CardHeader>
        <CardContent>
          <AdminTable
            data={routeStats}
            columns={routeStatsColumns}
            loading={false}
            emptyMessage="No feedback data available for the selected time period"
          />
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest user feedback submissions
          </p>
        </CardHeader>
        <CardContent>
          <AdminTable
            data={feedback}
            columns={feedbackColumns}
            loading={false}
            emptyMessage="No feedback submissions yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
