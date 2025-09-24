'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface JobListItem {
  id: string;
  title: string;
}

interface UseJobsListReturn {
  jobs: JobListItem[];
  isLoading: boolean;
  error: string | null;
}

export function useJobsList(): UseJobsListReturn {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('jobs')
        .select('id, title')
        .order('title');

      if (queryError) throw queryError;
      setJobs(data || []);
    } catch (err: any) {
      console.error('Error fetching jobs list:', err);
      setError('Failed to load jobs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, isLoading, error };
}
