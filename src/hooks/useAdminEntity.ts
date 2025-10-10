'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

interface UseAdminEntityReturn<T> {
  entity: T | null;
  isLoading: boolean;
  error: string | null;
  handleSave: (updatedEntity: Partial<T>) => Promise<T | null>;
  handleDelete: () => Promise<boolean>;
}

export function useAdminEntity<T extends { id: string }>(
  tableName: string, 
  entityId: string | null
): UseAdminEntityReturn<T> {
  const { profile } = useAuth();
  const [entity, setEntity] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isNew = entityId === 'new';

  const fetchEntity = useCallback(async () => {
    if (isNew || !entityId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', entityId)
        .single();

      if (queryError) throw queryError;
      setEntity(data as T);
    } catch (err: any) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(`Failed to load ${tableName}.`);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, entityId, isNew]);

  useEffect(() => {
    fetchEntity();
  }, [fetchEntity]);

  const handleSave = async (updatedEntity: Partial<T>): Promise<T | null> => {
    try {
      if (isNew) {
        const { data, error } = await supabase
          .from(tableName)
          .insert([updatedEntity])
          .select()
          .single();
        if (error) throw error;
        setEntity(data as T); // Update local entity state
        return data as T;
      } else {
        const { data, error } = await supabase
          .from(tableName)
          .update(updatedEntity)
          .eq('id', entityId!)
          .select()
          .single();
        if (error) throw error;
        setEntity(data as T); // Update local entity state
        return data as T;
      }
    } catch (err: any) {
      console.error(`Error saving ${tableName}:`, err);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      console.error('Error details:', err.details);
      console.error('Full error:', JSON.stringify(err, null, 2));
      
      const errorMessage = err.message || err.details || `Failed to save ${tableName}.`;
      setError(errorMessage);
      
      // Re-throw with a more descriptive error
      throw new Error(errorMessage);
    }
  };

  const handleDelete = async (): Promise<boolean> => {
    if (isNew || !entityId) return false;
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', entityId);
      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error(`Error deleting ${tableName}:`, err);
      setError(`Failed to delete ${tableName}.`);
      return false;
    }
  };

  return { entity, isLoading, error, handleSave, handleDelete };
}
