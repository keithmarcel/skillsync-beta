'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface SkillListItem {
  id: string;
  name: string;
  category: string | null;
}

interface UseSkillsListReturn {
  skills: SkillListItem[];
  isLoading: boolean;
  error: string | null;
}

export function useSkillsList(): UseSkillsListReturn {
  const [skills, setSkills] = useState<SkillListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('skills')
        .select('id, name, category')
        .order('name');

      if (queryError) throw queryError;
      setSkills(data || []);
    } catch (err: any) {
      console.error('Error fetching skills list:', err);
      setError('Failed to load skills.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return { skills, isLoading, error };
}
