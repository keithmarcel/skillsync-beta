'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface SchoolListItem {
  id: string;
  name: string;
}

interface UseSchoolsListReturn {
  schools: SchoolListItem[];
  isLoading: boolean;
  error: string | null;
}

export function useSchoolsList(): UseSchoolsListReturn {
  const [schools, setSchools] = useState<SchoolListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('schools')
        .select('id, name')
        .order('name');

      if (queryError) throw queryError;
      setSchools(data || []);
    } catch (err: any) {
      console.error('Error fetching schools list:', err);
      setError('Failed to load schools.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  return { schools, isLoading, error };
}
