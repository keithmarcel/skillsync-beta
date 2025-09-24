'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface CompanyListItem {
  id: string;
  name: string;
}

interface UseCompaniesListReturn {
  companies: CompanyListItem[];
  isLoading: boolean;
  error: string | null;
}

export function useCompaniesList(): UseCompaniesListReturn {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (queryError) throw queryError;
      setCompanies(data || []);
    } catch (err: any) {
      console.error('Error fetching companies list:', err);
      setError('Failed to load companies.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return { companies, isLoading, error };
}
