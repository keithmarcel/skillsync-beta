'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, FileText, Settings, Shield, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminTable } from '@/components/admin/AdminTable';
import { supabase } from '@/lib/supabase/client';

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  status: 'success' | 'error' | 'pending';
  metadata: any;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function AdminAuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadAuditLogs();
  }, [searchTerm, actionFilter, entityFilter, userFilter, statusFilter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('admin_audit_logs')
        .select(`
          *,
          user:profiles(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      if (userFilter !== 'all') {
        query = query.eq('user_id', userFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'publish': return '📢';
      case 'archive': return '📦';
      case 'login': return '🔐';
      case 'logout': return '🚪';
      default: return '📝';
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'users':
      case 'profiles': return <User className="w-4 h-4" />;
      case 'jobs': return <FileText className="w-4 h-4" />;
      case 'programs': return <Settings className="w-4 h-4" />;
      case 'companies': return <Shield className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const userName = `${log.user?.first_name || ''} ${log.user?.last_name || ''}`.toLowerCase();
    const userEmail = log.user?.email?.toLowerCase() || '';

    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.entity_type.toLowerCase().includes(searchLower) ||
      userName.includes(searchLower) ||
      userEmail.includes(searchLower)
    );
  });

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (value: any, row: AuditLogEntry) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">
              {new Date(row.created_at).toLocaleDateString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(row.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ),
      width: 160,
    },
    {
      key: 'user',
      header: 'User',
      render: (value: any, row: AuditLogEntry) => (
        <div>
          <div className="font-medium text-sm">
            {row.user?.first_name} {row.user?.last_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.user?.email}
          </div>
        </div>
      ),
      width: 180,
    },
    {
      key: 'action',
      header: 'Action',
      render: (value: string, row: AuditLogEntry) => (
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getActionIcon(row.action)}</span>
          <span className="font-medium">{row.action}</span>
        </div>
      ),
      width: 120,
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (value: any, row: AuditLogEntry) => (
        <div className="flex items-center space-x-2">
          {getEntityIcon(row.entity_type)}
          <div>
            <div className="text-sm font-medium capitalize">
              {row.entity_type.replace('_', ' ')}
            </div>
            <div className="text-xs text-muted-foreground">
              ID: {row.entity_id.slice(0, 8)}...
            </div>
          </div>
        </div>
      ),
      width: 140,
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string, row: AuditLogEntry) => (
        <Badge className={getStatusColor(row.status)}>
          {row.status.toUpperCase()}
        </Badge>
      ),
      width: 100,
    },
    {
      key: 'details',
      header: 'Details',
      render: (value: any, row: AuditLogEntry) => {
        const metadata = row.metadata;
        if (!metadata) return <span className="text-muted-foreground">No details</span>;

        const details = [];
        if (metadata.old_values) details.push('Updated fields');
        if (metadata.new_values) details.push('Created/Modified');
        if (metadata.reason) details.push(metadata.reason);

        return (
          <div className="text-sm">
            {details.length > 0 ? details.join(', ') : 'System action'}
          </div>
        );
      },
    },
  ];

  const actionOptions = [
    'all', 'create', 'update', 'delete', 'publish', 'archive', 'login', 'logout'
  ];

  const entityOptions = [
    'all', 'users', 'jobs', 'programs', 'companies', 'schools', 'assessments'
  ];

  const statusOptions = [
    'all', 'success', 'error', 'pending'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all administrative activities and system changes
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Actions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {auditLogs.filter(log => log.status === 'success').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {auditLogs.length > 0 ? Math.round((auditLogs.filter(log => log.status === 'success').length / auditLogs.length) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Actions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {auditLogs.filter(log => log.status === 'error').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(auditLogs.map(log => log.user_id)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique admin users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, or entity..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option === 'all' ? 'All Actions' : option.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                {entityOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option === 'all' ? 'All Entities' : option.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option === 'all' ? 'All Status' : option.charAt(0).toUpperCase() + option.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setActionFilter('all');
              setEntityFilter('all');
              setUserFilter('all');
              setStatusFilter('all');
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {auditLogs.length} entries
          </p>
        </CardHeader>
        <CardContent>
          <AdminTable
            data={filteredLogs}
            columns={columns}
            loading={loading}
            error={error}
            emptyMessage="No audit log entries found"
          />
        </CardContent>
      </Card>
    </div>
  );
}
