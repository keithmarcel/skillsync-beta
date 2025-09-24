'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, User, CheckCircle, Clock, AlertCircle, Archive } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface WorkflowStatus {
  id: string;
  entity_id: string;
  entity_type: string;
  status: 'draft' | 'pending_review' | 'published' | 'archived';
  previous_status: string | null;
  requested_by: string;
  approved_by: string | null;
  approved_at: string | null;
  comments: string | null;
  created_at: string;
}

interface ContentApprovalWorkflowProps {
  entityId: string;
  entityType: string;
  currentStatus: string;
  onStatusChange: (newStatus: string, comments?: string) => Promise<void>;
  canApprove?: boolean;
}

export function ContentApprovalWorkflow({
  entityId,
  entityType,
  currentStatus,
  onStatusChange,
  canApprove = false
}: ContentApprovalWorkflowProps) {
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowStatus[]>([]);
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWorkflowHistory();
  }, [entityId, entityType]);

  const loadWorkflowHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('content_workflow_status')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflowHistory(data || []);
    } catch (err) {
      console.error('Error loading workflow history:', err);
    }
  };

  const handleStatusChange = async () => {
    try {
      setLoading(true);
      await onStatusChange(newStatus, comments);

      // Log the status change
      await logWorkflowStatus(newStatus, comments);

      // Reload history
      await loadWorkflowHistory();

      // Clear form
      setComments('');
    } catch (err) {
      console.error('Error changing status:', err);
    } finally {
      setLoading(false);
    }
  };

  const logWorkflowStatus = async (status: string, comments?: string) => {
    try {
      const { error } = await supabase
        .from('content_workflow_status')
        .insert({
          entity_id: entityId,
          entity_type: entityType,
          status: status as any,
          previous_status: currentStatus,
          requested_by: 'current_user', // This should come from auth context
          comments: comments
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error logging workflow status:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'pending_review': return <AlertCircle className="w-4 h-4" />;
      case 'published': return <CheckCircle className="w-4 h-4" />;
      case 'archived': return <Archive className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' }
  ];

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            {getStatusIcon(currentStatus)}
            <Badge className={getStatusColor(currentStatus)}>
              {currentStatus.replace('_', ' ').toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Status Change Form */}
      {canApprove && (
        <Card>
          <CardHeader>
            <CardTitle>Change Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status-select">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add comments about this status change..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleStatusChange}
              disabled={loading || newStatus === currentStatus}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workflow History */}
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
        </CardHeader>
        <CardContent>
          {workflowHistory.length > 0 ? (
            <div className="space-y-4">
              {workflowHistory.map((entry) => (
                <div key={entry.id} className="border-l-4 border-gray-200 pl-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(entry.status)}
                      <span className="font-medium">
                        Changed to {entry.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>By {entry.requested_by}</span>
                    </div>

                    {entry.comments && (
                      <div className="text-sm bg-gray-50 p-2 rounded">
                        {entry.comments}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No status changes have been recorded yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
