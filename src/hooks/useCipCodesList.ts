'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface CipCodeListItem {
  cip_code: string;
  title: string;
}

interface UseCipCodesListReturn {
  cipCodes: CipCodeListItem[];
  isLoading: boolean;
  error: string | null;
}

export function useCipCodesList(): UseCipCodesListReturn {
  const [cipCodes, setCipCodes] = useState<CipCodeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCipCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('cip_codes')
        .select('cip_code, title')
        .order('cip_code');

      if (queryError) throw queryError;
      setCipCodes(data || []);
    } catch (err: any) {
      console.error('Error fetching CIP codes list:', err);
      setError('Failed to load CIP codes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCipCodes();
  }, [fetchCipCodes]);

  return { cipCodes, isLoading, error };
}
