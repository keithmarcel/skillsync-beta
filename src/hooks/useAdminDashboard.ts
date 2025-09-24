'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAdminStats, getRecentActivity } from '@/lib/admin-utils';
import type { AdminDashboardStats, AdminAuditLog } from '@/types/admin';

interface UseAdminDashboardReturn {
  stats: AdminDashboardStats;
  recentActivity: AdminAuditLog[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
}

const initialStats: AdminDashboardStats = {
  total_users: 0,
  total_companies: 0,
  total_providers: 0,
  total_programs: 0,
  total_roles: 0,
  total_assessments: 0,
  recent_activity: [],
};

export function useAdminDashboard(): UseAdminDashboardReturn {
  const [stats, setStats] = useState<AdminDashboardStats>(initialStats);
  const [recentActivity, setRecentActivity] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statsData = await getAdminStats();
      const activities = await getRecentActivity(5);
      setStats(statsData as any);
      setRecentActivity(activities as any);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    recentActivity,
    isLoading,
    error,
    refreshData: fetchDashboardData,
  };
}
