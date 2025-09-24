'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

interface UseAdminTableDataReturn<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
}

export function useAdminTableData<T>(
  tableName: string, 
  selectQuery = '*', 
  options: { initialFilter?: Record<string, any> } = {}
): UseAdminTableDataReturn<T> {
  const { profile, isSuperAdmin, isCompanyAdmin, isProviderAdmin } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase.from(tableName).select(selectQuery);

      // Apply initial static filters
      if (options.initialFilter) {
        for (const key in options.initialFilter) {
          query = query.eq(key, options.initialFilter[key]);
        }
      }

      // Apply role-based scoping
      if (!isSuperAdmin) {
        if (isCompanyAdmin && profile.company_id) {
          if (tableName === 'companies') query = query.eq('id', profile.company_id);
          if (tableName === 'jobs') query = query.eq('company_id', profile.company_id);
        } else if (isProviderAdmin && profile.school_id) {
          if (tableName === 'schools') query = query.eq('id', profile.school_id);
          if (tableName === 'programs') query = query.eq('school_id', profile.school_id);
        }
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;

      setData(result as T[]);
    } catch (err: any) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(`Failed to load ${tableName}.`);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, selectQuery, options.initialFilter, profile, isSuperAdmin, isCompanyAdmin, isProviderAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refreshData: fetchData,
  };
}
