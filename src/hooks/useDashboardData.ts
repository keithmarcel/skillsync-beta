'use client'

import { useState, useEffect } from 'react';
import { getUserAssessments, listJobs } from '@/lib/api';
import type { Assessment, Job } from '@/lib/database/queries';

interface UseDashboardDataReturn {
  recentAssessments: Assessment[];
  featuredJobs: Job[];
  loading: boolean;
  error: string | null;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const [assessments, jobs] = await Promise.all([
          getUserAssessments().catch(() => []),
          listJobs('featured_role').catch(() => []),
        ]);

        setRecentAssessments(assessments.slice(0, 3));
        setFeaturedJobs(jobs.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return { recentAssessments, featuredJobs, loading, error };
}
